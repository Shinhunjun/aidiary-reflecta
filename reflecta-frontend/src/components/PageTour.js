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
  pageStartStep = 0, // Global step number where this page starts
  automationStates = {} // External component states to monitor (e.g., isLoading, showModal)
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [waitingForAction, setWaitingForAction] = useState(false);
  const [waitingForAutomation, setWaitingForAutomation] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const automationTimeoutRef = React.useRef(null);

  const {
    tourActive,
    globalStep,
    totalSteps,
    updateGlobalStep,
    navigateToNextPage,
    updateCurrentTourStep
  } = useTour();

  // Update highlight position on scroll and resize
  useEffect(() => {
    const updateHighlightPosition = () => {
      if (highlightedElement) {
        const rect = highlightedElement.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    };

    if (highlightedElement) {
      updateHighlightPosition();
      window.addEventListener('scroll', updateHighlightPosition, true);
      window.addEventListener('resize', updateHighlightPosition);

      return () => {
        window.removeEventListener('scroll', updateHighlightPosition, true);
        window.removeEventListener('resize', updateHighlightPosition);
      };
    }
  }, [highlightedElement]);

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

  // Monitor external automation states (e.g., API completion indicators)
  useEffect(() => {
    if (currentStep >= steps.length) return;

    const step = steps[currentStep];

    // If this step requires state monitoring and we're waiting for automation
    if (step.requiresStateMonitoring && waitingForAutomation) {
      // Check if the monitored state indicates completion
      // For Chat step 7: check if showDiaryModal is true (diary conversion completed)
      if (automationStates.showDiaryModal === true) {
        console.log('[PageTour] State monitoring: showDiaryModal is true, enabling Next button');
        setWaitingForAutomation(false);
      }
    }
  }, [currentStep, steps, waitingForAutomation, automationStates]);

  const highlightStep = (stepIndex) => {
    if (stepIndex >= steps.length) return;

    const step = steps[stepIndex];

    // Clear any existing automation timeout
    if (automationTimeoutRef.current) {
      clearTimeout(automationTimeoutRef.current);
      automationTimeoutRef.current = null;
    }

    // Check if this step requires user action
    if (step.requireAction && step.selector) {
      setWaitingForAction(true);
      setupActionListener(step);
    } else {
      setWaitingForAction(false);
    }

    // Check if this step has automation delay
    if (step.automationDelay) {
      console.log(`[PageTour] Step ${stepIndex} has automation delay: ${step.automationDelay}ms`);
      setWaitingForAutomation(true);

      // If this step requires state monitoring (e.g., API call), don't set timeout
      // The state monitoring useEffect will clear the waiting flag
      if (!step.requiresStateMonitoring) {
        // Set timeout to clear waiting state after automation completes
        automationTimeoutRef.current = setTimeout(() => {
          console.log(`[PageTour] Automation delay completed for step ${stepIndex}`);
          setWaitingForAutomation(false);
          automationTimeoutRef.current = null;
        }, step.automationDelay);
      }
    } else {
      setWaitingForAutomation(false);
    }

    if (step.selector) {
      // Wait for element to appear if it's not immediately available
      const checkElement = () => {
        const element = document.querySelector(step.selector);
        if (element) {
          // Scroll element into view smoothly first
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Wait for scroll animation to complete before setting highlight
          setTimeout(() => {
            setHighlightedElement(element);
          }, 600); // 600ms to allow smooth scroll to complete
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

    // Notify components of current tour step
    console.log('[PageTour] Updating current tour step:', { page, stepIndex });
    updateCurrentTourStep(page, stepIndex);
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
    // If waiting for user action or automation, don't advance
    if (waitingForAction || waitingForAutomation) {
      console.log('[PageTour] Cannot advance - waiting for:', { waitingForAction, waitingForAutomation });
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

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <div className="tour-backdrop" onClick={handleSkip} />

      {/* Highlight overlay for specific element */}
      {highlightedElement && (
        <div
          className="tour-highlight"
          style={{
            top: `${highlightPosition.top}px`,
            left: `${highlightPosition.left}px`,
            width: `${highlightPosition.width}px`,
            height: `${highlightPosition.height}px`,
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          className="tour-tooltip"
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
              disabled={waitingForAction || waitingForAutomation}
            >
              {currentStep < steps.length - 1
                ? waitingForAction
                  ? 'Waiting...'
                  : waitingForAutomation
                  ? currentStepData.requiresStateMonitoring
                    ? 'Loading...'
                    : 'Automating...'
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
