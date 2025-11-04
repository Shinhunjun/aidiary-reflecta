import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { JournalProvider } from "./contexts/JournalContext";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext";
import { TourProvider } from "./contexts/TourContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";
import DemoLanding from "./components/DemoLanding";
import Journal from "./components/Journal";
import GoalSetting from "./components/GoalSetting";
// import ProgressTracking from "./components/ProgressTracking"; // Removed - consolidated into Dashboard
import PrivacySettings from "./components/PrivacySettings";
import CounselorDashboard from "./components/CounselorDashboard";
import Sidebar from "./components/Sidebar";
import "./App.css";

// 로딩 애니메이션 컴포넌트
const LoadingSpinner = () => (
  <motion.div
    className="loading"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        width: "40px",
        height: "40px",
        border: "4px solid rgba(99, 102, 241, 0.3)",
        borderTopColor: "#6366f1",
        borderRadius: "50%",
      }}
    />
  </motion.div>
);

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Counselor 전용 라우트 컴포넌트
const CounselorRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "counselor") {
    return <Navigate to="/" />;
  }

  return children;
};

// 공개 라우트 컴포넌트 (로그인된 사용자는 대시보드로 리다이렉트)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <Navigate to="/" /> : children;
};

const AnimatedRoute = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const MainContent = () => {
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  return (
    <div className={`main-content ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <AnimatedRoute>
                <Home />
              </AnimatedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <AnimatedRoute>
                <PublicRoute>
                  <Login />
                </PublicRoute>
              </AnimatedRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <AnimatedRoute>
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              </AnimatedRoute>
            }
          />
          <Route
            path="/demo"
            element={
              <AnimatedRoute>
                <DemoLanding />
              </AnimatedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AnimatedRoute>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </AnimatedRoute>
            }
          />
          <Route
            path="/journal"
            element={
              <AnimatedRoute>
                <ProtectedRoute>
                  <Journal />
                </ProtectedRoute>
              </AnimatedRoute>
            }
          />
          <Route
            path="/goal-setting"
            element={
              <AnimatedRoute>
                <ProtectedRoute>
                  <GoalSetting />
                </ProtectedRoute>
              </AnimatedRoute>
            }
          />
          {/* Progress page removed - functionality consolidated into Dashboard */}
          {/* <Route
            path="/progress"
            element={
              <AnimatedRoute>
                <ProtectedRoute>
                  <ProgressTracking />
                </ProtectedRoute>
              </AnimatedRoute>
            }
          /> */}
          <Route
            path="/privacy-settings"
            element={
              <AnimatedRoute>
                <ProtectedRoute>
                  <PrivacySettings />
                </ProtectedRoute>
              </AnimatedRoute>
            }
          />
          <Route
            path="/counselor-dashboard"
            element={
              <AnimatedRoute>
                <CounselorRoute>
                  <CounselorDashboard />
                </CounselorRoute>
              </AnimatedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <JournalProvider>
        <SidebarProvider>
          <Router>
            <TourProvider>
            <div className="app-container">
              <Sidebar />
              <MainContent />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                style={{
                  zIndex: 9999,
                }}
              />
            </div>
            </TourProvider>
          </Router>
        </SidebarProvider>
      </JournalProvider>
    </AuthProvider>
  );
}

export default App;
