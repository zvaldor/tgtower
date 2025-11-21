import React, { useRef } from 'react';
import './ScreenCarousel.css';

export default function ScreenCarousel({ children }) {
  const containerRef = useRef(null);

  return (
    <div className="screen-carousel" ref={containerRef}>
      {children}
    </div>
  );
}
