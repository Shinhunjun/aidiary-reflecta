import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

export const TourProvider = ({ children }) => {
  const navigate = useNavigate();
  const [tourActive, setTourActive] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const [globalStep, setGlobalStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  // Check if tour is active on mount
  useEffect(() => {
    const isTourActive = localStorage.getItem('demo_tour_active') === 'true';
    const savedPage = localStorage.getItem('demo_tour_current_page') || '';
    const savedStep = parseInt(localStorage.getItem('demo_tour_global_step') || '0', 10);

    setTourActive(isTourActive);
    setCurrentPage(savedPage);
    setGlobalStep(savedStep);
  }, []);

  const startTour = () => {
    // Clear all existing tour progress
    clearAllTourProgress();

    // Set tour as active
    localStorage.setItem('demo_tour_active', 'true');
    localStorage.setItem('demo_tour_current_page', 'goal-setting');
    localStorage.setItem('demo_tour_global_step', '0');

    setTourActive(true);
    setCurrentPage('goal-setting');
    setGlobalStep(0);

    // Navigate to goal setting page to start tour
    navigate('/goal-setting');
  };

  const endTour = () => {
    localStorage.setItem('demo_tour_active', 'false');
    localStorage.removeItem('demo_tour_current_page');
    localStorage.removeItem('demo_tour_global_step');

    setTourActive(false);
    setCurrentPage('');
    setGlobalStep(0);
  };

  const clearAllTourProgress = () => {
    // Clear all page-specific tour completion flags
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('tour_completed_') || key.startsWith('demo_tour_')) {
        localStorage.removeItem(key);
      }
    });
  };

  const navigateToNextPage = (nextPage) => {
    // Mark current page as completed
    localStorage.setItem(`tour_completed_${currentPage}`, 'true');
    localStorage.setItem('demo_tour_current_page', nextPage);

    setCurrentPage(nextPage);

    // Navigate to next page
    const pageRoutes = {
      'goal-setting': '/goal-setting',
      'chat': '/chat',
      'dashboard': '/dashboard',
    };

    if (pageRoutes[nextPage]) {
      navigate(pageRoutes[nextPage]);
    }
  };

  const updateGlobalStep = (step) => {
    localStorage.setItem('demo_tour_global_step', step.toString());
    setGlobalStep(step);
  };

  const updateTotalSteps = (total) => {
    setTotalSteps(total);
  };

  const value = {
    tourActive,
    currentPage,
    globalStep,
    totalSteps,
    startTour,
    endTour,
    clearAllTourProgress,
    navigateToNextPage,
    updateGlobalStep,
    updateTotalSteps,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
