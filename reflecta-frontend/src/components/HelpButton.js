import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './HelpButton.css';

const HelpButton = ({ page, onRestartTour }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    // Clear tour completion status and restart
    const tourKey = `tour_completed_${page}`;
    localStorage.removeItem(tourKey);

    if (onRestartTour) {
      onRestartTour();
    }

    // Reload page to restart tour
    window.location.reload();
  };

  return (
    <>
      <motion.button
        className="help-button"
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
      >
        <span className="help-icon">?</span>
      </motion.button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="help-tooltip"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            Restart Page Tour
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpButton;
