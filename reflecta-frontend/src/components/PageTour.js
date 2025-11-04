import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '../contexts/TourContext';
import './PageTour.css';

const PageTour = ({
  page,
  steps,
  onComplete,
  navigateToNext = null, // Next page to navigate to
  pageTotalSteps = null, // Total steps in this page
  pageStartStep = 0 // Global step number where this page starts
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [waitingForAction, setWaitingForAction] = useState(false);

  const {
    tourActive,
    globalStep,
    totalSteps,
    updateGlobalStep,
    navigateToNextPage
  } = useTour();

  useEffect(() => {
    // Check if user is demo and tour is active OR hasn't seen this tour
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const tourKey = `tour_completed_${page}`;
    const tourCompleted = localStorage.getItem(tourKey);
    const isTourActive = localStorage.getItem('demo_tour_active') === 'true';

    if (currentUser.email === 'demo@reflecta.com' && (isTourActive || !tourCompleted)) {
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

    // Check if this step requires user action
    if (step.requireAction && step.selector) {
      setWaitingForAction(true);
      setupActionListener(step);
    } else {
      setWaitingForAction(false);
    }

    if (step.selector) {
      // Wait for element to appear if it's not immediately available
      const checkElement = () => {
        const element = document.querySelector(step.selector);
        if (element) {
          setHighlightedElement(element);
          // Scroll element into view smoothly
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (step.waitForElement) {
          // Retry after a short delay if element should appear
          setTimeout(checkElement, 200);
        }
      };
      checkElement();
    } else {
      setHighlightedElement(null);
    }

    // Update global step counter
    if (pageTotalSteps) {
      updateGlobalStep(pageStartStep + stepIndex);
    }
  };

  const setupActionListener = (step) => {
    if (!step.selector || !step.requireAction) return;

    const element = document.querySelector(step.selector);
    if (!element) return;

    // Add pulsing effect to indicate action required
    element.classList.add('tour-action-required');

    // Listen for click on the element
    const handleAction = () => {
      element.classList.remove('tour-action-required');
      setWaitingForAction(false);

      // Auto-advance after action
      setTimeout(() => {
        handleNext();
      }, 500);
    };

    element.addEventListener('click', handleAction, { once: true });

    // Store handler to cleanup later
    element._tourHandler = handleAction;
  };

  const handleNext = () => {
    // If waiting for user action, show message
    if (waitingForAction) {
      return; // Don't advance
    }

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      highlightStep(nextStep);
    } else {
      // Last step of this page
      if (navigateToNext) {
        // Navigate to next page in tour
        const tourKey = `tour_completed_${page}`;
        localStorage.setItem(tourKey, 'true');
        navigateToNextPage(navigateToNext);
      } else {
        completeTour();
      }
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
      {highlightedElement && (() => {
        const rect = highlightedElement.getBoundingClientRect();
        return (
          <div
            className="tour-highlight"
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
          />
        );
      })()}

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
              {tourActive && totalSteps > 0 ? (
                <>Demo Tour: Step {globalStep + 1} of {totalSteps}</>
              ) : (
                <>{currentStep + 1} of {steps.length}</>
              )}
            </span>
            <button className="tour-close-btn" onClick={handleSkip}>
              ✕
            </button>
          </div>

          <div className="tour-tooltip-content">
            <div className="tour-icon">{currentStepData.icon}</div>
            <h3 className="tour-title">{currentStepData.title}</h3>
            <p className="tour-description">{currentStepData.description}</p>

            {waitingForAction && (
              <div className="tour-waiting-message">
                👆 Please click the highlighted element to continue
              </div>
            )}

            {currentStep === steps.length - 1 && navigateToNext && (
              <div className="tour-next-page-preview">
                <span className="tour-next-arrow">→</span>
                Next: {navigateToNext === 'chat' ? 'Chat & Journaling' : navigateToNext === 'dashboard' ? 'Analytics Dashboard' : 'Next Page'}
              </div>
            )}
          </div>

          <div className="tour-tooltip-footer">
            <button className="tour-skip-btn" onClick={handleSkip}>
              Skip Tour
            </button>
            <button
              className="tour-next-btn"
              onClick={handleNext}
              disabled={waitingForAction}
            >
              {currentStep < steps.length - 1
                ? waitingForAction
                  ? 'Waiting...'
                  : 'Next'
                : navigateToNext
                ? 'Continue →'
                : 'Got it!'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default PageTour;
