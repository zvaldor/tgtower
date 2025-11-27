import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BottomSheet.css';

export default function BottomSheet({ isOpen, onClose, children, title, height = '80vh' }) {
  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="bottom-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="bottom-sheet"
            style={{ height }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300
            }}
          >
            {/* Handle */}
            <div className="bottom-sheet-handle-container">
              <div className="bottom-sheet-handle" />
            </div>

            {/* Header */}
            {title && (
              <div className="bottom-sheet-header">
                <h2 className="bottom-sheet-title">{title}</h2>
                <button className="bottom-sheet-close" onClick={onClose}>
                  ✕
                </button>
              </div>
            )}

            {/* Content */}
            <div className="bottom-sheet-content">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
