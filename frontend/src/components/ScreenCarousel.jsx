import React, { useRef, useEffect, useState } from 'react';
import './ScreenCarousel.css';

export default function ScreenCarousel({ children, onScreenChange }) {
  const containerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Start at the first real screen (skip the cloned last screen)
    const screenHeight = window.innerHeight;
    container.scrollTop = screenHeight;

    const handleScroll = () => {
      if (isScrolling) return;

      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Wait for scroll to settle
      scrollTimeout.current = setTimeout(() => {
        const scrollTop = container.scrollTop;
        const screenHeight = window.innerHeight;
        const totalScreens = React.Children.count(children) + 2; // including clones

        // Calculate current screen index (0-based, excluding clones)
        const currentScreenIndex = Math.round(scrollTop / screenHeight) - 1;

        // Notify parent of screen change
        if (onScreenChange && currentScreenIndex >= 0 && currentScreenIndex < React.Children.count(children)) {
          onScreenChange(currentScreenIndex);
        }

        // If scrolled to the cloned last screen (at the beginning)
        if (scrollTop < screenHeight * 0.5) {
          setIsScrolling(true);
          container.classList.add('instant-scroll');
          container.scrollTop = screenHeight * (totalScreens - 2);
          setTimeout(() => {
            container.classList.remove('instant-scroll');
            setIsScrolling(false);
          }, 50);
        }
        // If scrolled to the cloned first screen (at the end)
        else if (scrollTop > screenHeight * (totalScreens - 1.5)) {
          setIsScrolling(true);
          container.classList.add('instant-scroll');
          container.scrollTop = screenHeight;
          setTimeout(() => {
            container.classList.remove('instant-scroll');
            setIsScrolling(false);
          }, 50);
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [children, isScrolling, onScreenChange]);

  // Clone first and last children for infinite loop
  const childrenArray = React.Children.toArray(children);
  const lastChild = childrenArray[childrenArray.length - 1];
  const firstChild = childrenArray[0];

  return (
    <div className="screen-carousel" ref={containerRef}>
      {React.cloneElement(lastChild, { key: 'clone-last' })}
      {children}
      {React.cloneElement(firstChild, { key: 'clone-first' })}
    </div>
  );
}
