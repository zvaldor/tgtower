import React from 'react';
import './ScrollToTopButton.css';

export default function ScrollToTopButton() {
  const scrollToTop = () => {
    // Find the screen carousel container
    const carousel = document.querySelector('.screen-carousel');
    if (carousel) {
      // Scroll to the first real screen (second child because first is clone)
      carousel.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <button className="scroll-to-top-button" onClick={scrollToTop}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 19V5M12 5L5 12M12 5L19 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
