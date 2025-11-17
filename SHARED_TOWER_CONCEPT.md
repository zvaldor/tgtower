# Концепция общей башни (одна башня для всех)

## 🎯 Текущая логика vs Новая логика

### Сейчас:
- У каждого пользователя своя башня в сезоне
- Каждый строит свою башню независимо
- В конце выплата пропорционально высоте башни

### Нужно:
- **Одна общая башня** на весь сезон
- Все пользователи строят **одну и ту же** башню
- Когда кто-то размещает блок - башня растет для всех
- Когда башня падает - она падает для всех
- Выплата: делится между всеми кто участвовал в строительстве

## 📋 Что нужно изменить

### 1. База данных

Вместо привязки `user_id + season_id` нужна одна башня на сезон:

```sql
-- Вместо:
towers (user_id, season_id, height, is_collapsed)

-- Нужно:
towers (season_id UNIQUE, height, is_collapsed)

-- И отдельная таблица участников:
tower_contributors (
  user_id,
  season_id,
  blocks_placed INT,  -- сколько блоков этот пользователь разместил
  stars_invested INT   -- сколько Stars вложил
)
```

### 2. Backend логика

**Файл:** `backend/src/services/towerService.js`

Изменить:
- `getOrCreateTower()` - получать башню только по `season_id`
- `placeBlock()` - обновлять общую башню + записывать вклад пользователя
- `calculatePotentialPayout()` - рассчитывать долю пользователя от общего фонда

### 3. Распределение выплат

Новая формула:
```javascript
user_payout = (total_pool * 0.8) * (user_stars_invested / total_stars_invested)
```

То есть пропорционально вложенным Stars, а не высоте башни.

## ⚠️ Важные моменты

### Проблема: Race condition
Если два пользователя одновременно жмут "Place Block" - могут быть проблемы.

**Решение:** Использовать database locks:
```javascript
await client.query('BEGIN');
await client.query('SELECT * FROM towers WHERE season_id = $1 FOR UPDATE', [seasonId]);
// ... размещение блока
await client.query('COMMIT');
```

### Проблема: Кто виноват в обрушении?
Сейчас когда башня падает, непонятно чей блок был последним.

**Решение:** Сохранять в `blocks` таблице кто разместил:
```sql
blocks (
  tower_id,
  user_id,  -- кто разместил этот блок
  block_number,
  was_fatal
)
```

## 🔧 Пошаговый план миграции

### Шаг 1: Обновить схему БД

Создать новую миграцию:

```sql
-- 1. Удалить unique constraint на towers
ALTER TABLE towers DROP CONSTRAINT IF EXISTS towers_user_id_season_id_key;

-- 2. Удалить user_id из towers (или сделать nullable)
ALTER TABLE towers ALTER COLUMN user_id DROP NOT NULL;

-- 3. Добавить unique на season_id
ALTER TABLE towers ADD CONSTRAINT towers_season_id_key UNIQUE (season_id);

-- 4. Создать таблицу вкладов
CREATE TABLE tower_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  season_id UUID REFERENCES seasons(id) NOT NULL,
  blocks_placed INT DEFAULT 0,
  stars_invested INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, season_id)
);
```

### Шаг 2: Обновить backend

**towerService.js:**

```javascript
// Получить общую башню сезона
export async function getSeasonTower(seasonId) {
  let result = await pool.query(
    'SELECT * FROM towers WHERE season_id = $1',
    [seasonId]
  );

  if (result.rows.length === 0) {
    // Создать общую башню
    result = await pool.query(
      'INSERT INTO towers (season_id, height, is_collapsed) VALUES ($1, 0, false) RETURNING *',
      [seasonId]
    );
  }

  return result.rows[0];
}

// Разместить блок на общей башне
export async function placeBlockOnSharedTower(userId, seasonId, paidWithStars) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Заблокировать башню для обновления
    const towerResult = await client.query(
      'SELECT * FROM towers WHERE season_id = $1 FOR UPDATE',
      [seasonId]
    );

    const tower = towerResult.rows[0];

    if (tower.is_collapsed) {
      throw new Error('Tower already collapsed');
    }

    // Обновить вклад пользователя
    await client.query(
      `INSERT INTO tower_contributors (user_id, season_id, blocks_placed, stars_invested)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (user_id, season_id)
       DO UPDATE SET
         blocks_placed = tower_contributors.blocks_placed + 1,
         stars_invested = tower_contributors.stars_invested + $3`,
      [userId, seasonId, paidWithStars ? 10 : 0]
    );

    // Увеличить высоту башни
    const newHeight = tower.height + 1;
    await client.query(
      'UPDATE towers SET height = $1 WHERE id = $2',
      [newHeight, tower.id]
    );

    // Проверить на обрушение
    const collapsed = checkCollapse(newHeight);

    if (collapsed) {
      await client.query(
        'UPDATE towers SET is_collapsed = true, collapse_height = $1 WHERE id = $2',
        [newHeight, tower.id]
      );
    }

    await client.query('COMMIT');

    return { collapsed, height: newHeight };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Шаг 3: Обновить frontend

Frontend почти не нужно менять! Просто башня будет общая для всех.

### Шаг 4: Обновить расчет выплат

```javascript
export async function calculateUserPayout(userId, seasonId) {
  // Получить вклад пользователя
  const contributorResult = await pool.query(
    'SELECT stars_invested FROM tower_contributors WHERE user_id = $1 AND season_id = $2',
    [userId, seasonId]
  );

  if (contributorResult.rows.length === 0) return 0;

  const userInvestment = contributorResult.rows[0].stars_invested;

  // Получить общий фонд
  const seasonResult = await pool.query(
    'SELECT total_pool FROM seasons WHERE id = $1',
    [seasonId]
  );

  const totalPool = seasonResult.rows[0].total_pool;

  // Получить общие инвестиции
  const totalInvestmentResult = await pool.query(
    'SELECT SUM(stars_invested) as total FROM tower_contributors WHERE season_id = $1',
    [seasonId]
  );

  const totalInvestment = parseInt(totalInvestmentResult.rows[0].total, 10);

  if (totalInvestment === 0) return 0;

  // Выплата = 80% от фонда * доля пользователя
  return Math.floor((totalPool * 0.8) * (userInvestment / totalInvestment));
}
```

## 🎮 Новая механика игры

1. **Пользователь А** размещает блок → башня высотой 1
2. **Пользователь Б** размещает блок → башня высотой 2 (для всех!)
3. **Пользователь А** снова размещает → башня высотой 3
4. Башня растет для всех одновременно
5. Если кто-то размещает "фатальный" блок → башня падает для всех
6. В конце сезона выплата делится пропорционально вложенным Stars

## 💡 Преимущества новой механики

- **Социальная динамика**: пользователи видят как растет общая башня
- **Драма**: каждый следующий блок - риск для всех
- **Справедливость**: выплата пропорциональна вкладу
- **Простота**: одна башня проще понять чем много башен

## 🚀 Хотите чтобы я реализовал?

Скажите и я сделаю все изменения! Это займет:
1. Миграция БД (5 мин)
2. Обновление backend (15 мин)
3. Минимальные изменения frontend (5 мин)

Готов начать? 🛠️
