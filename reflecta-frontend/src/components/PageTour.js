import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PageTour.css';

const PageTour = ({ page, steps, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState(null);

  useEffect(() => {
    // Check if user is demo and hasn't seen this tour
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const tourKey = `tour_completed_${page}`;
    const tourCompleted = localStorage.getItem(tourKey);

    if (currentUser.email === 'demo@reflecta.com' && !tourCompleted) {
      // Delay tour start slightly to ensure DOM is ready
      setTimeout(() => {
        setIsVisible(true);
        highlightStep(0);
      }, 500);
    }
  }, [page]);

  const highlightStep = (stepIndex) => {
    if (stepIndex >= steps.length) return;

    const step = steps[stepIndex];
    if (step.selector) {
      const element = document.querySelector(step.selector);
      if (element) {
        setHighlightedElement(element);
        // Scroll element into view smoothly
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightedElement(null);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      highlightStep(nextStep);
    } else {
      completeTour();
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = () => {
    const tourKey = `tour_completed_${page}`;
    localStorage.setItem(tourKey, 'true');
    setIsVisible(false);
    setHighlightedElement(null);
    if (onComplete) onComplete();
  };

  const getTooltipPosition = () => {
    if (!highlightedElement) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const rect = highlightedElement.getBoundingClientRect();
    const tooltipHeight = 200; // Approximate tooltip height
    const tooltipWidth = 400; // Approximate tooltip width

    // Try to position tooltip below the element
    if (rect.bottom + tooltipHeight < window.innerHeight) {
      return {
        top: `${rect.bottom + window.scrollY + 20}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      };
    }
    // Position above if not enough space below
    else if (rect.top - tooltipHeight > 0) {
      return {
        top: `${rect.top + window.scrollY - tooltipHeight - 20}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      };
    }
    // Position to the right if not enough vertical space
    else if (rect.right + tooltipWidth < window.innerWidth) {
      return {
        top: `${rect.top + window.scrollY + rect.height / 2}px`,
        left: `${rect.right + 20}px`,
        transform: 'translateY(-50%)',
      };
    }
    // Default: center screen
    else {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const tooltipPosition = getTooltipPosition();

  return (
    <>
      {/* Backdrop */}
      <div className="tour-backdrop" onClick={handleSkip} />

      {/* Highlight overlay for specific element */}
      {highlightedElement && (
        <div
          className="tour-highlight"
          style={{
            top: `${highlightedElement.getBoundingClientRect().top + window.scrollY}px`,
            left: `${highlightedElement.getBoundingClientRect().left}px`,
            width: `${highlightedElement.offsetWidth}px`,
            height: `${highlightedElement.offsetHeight}px`,
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          className="tour-tooltip"
          style={tooltipPosition}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tour-tooltip-header">
            <span className="tour-step-indicator">
              {currentStep + 1} of {steps.length}
            </span>
            <button className="tour-close-btn" onClick={handleSkip}>
              ✕
            </button>
          </div>

          <div className="tour-tooltip-content">
            <div className="tour-icon">{currentStepData.icon}</div>
            <h3 className="tour-title">{currentStepData.title}</h3>
            <p className="tour-description">{currentStepData.description}</p>
          </div>

          <div className="tour-tooltip-footer">
            <button className="tour-skip-btn" onClick={handleSkip}>
              Skip Tour
            </button>
            <button className="tour-next-btn" onClick={handleNext}>
              {currentStep < steps.length - 1 ? 'Next' : 'Got it!'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default PageTour;
