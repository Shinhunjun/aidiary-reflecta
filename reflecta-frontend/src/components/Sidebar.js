import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "../contexts/SidebarContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarVariants = {
    expanded: {
      width: "260px",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    collapsed: {
      width: "70px",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const linkVariants = {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    hover: {
      x: 5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.aside
      className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
      initial={false}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
    >
      {isAuthenticated && (
        <motion.button
          className="toggle-btn"
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isCollapsed ? "▶" : "◀"}
        </motion.button>
      )}
      <div className="sidebar-header">
        <motion.h1
          className="sidebar-logo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isCollapsed ? "R" : "Reflecta"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isCollapsed ? "R" : "Reflecta"}
            </motion.span>
          </AnimatePresence>
        </motion.h1>
      </div>

      <motion.nav
        className="sidebar-nav"
        initial="initial"
        animate="animate"
        variants={{
          animate: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        <motion.div variants={linkVariants} whileHover="hover">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon">ℹ️</span>
            <span className="sidebar-label">About</span>
          </NavLink>
        </motion.div>

        <motion.div variants={linkVariants} whileHover="hover">
          <NavLink
            to="/demo"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon">🎬</span>
            <span className="sidebar-label">Demo</span>
          </NavLink>
        </motion.div>

        {isAuthenticated ? (
          <>
            <motion.div variants={linkVariants} whileHover="hover">
              <NavLink
                to="/goal-setting"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <span className="sidebar-icon">🎯</span>
                <span className="sidebar-label">Goal</span>
              </NavLink>
            </motion.div>

            <motion.div variants={linkVariants} whileHover="hover">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <span className="sidebar-icon">📊</span>
                <span className="sidebar-label">Dashboard</span>
              </NavLink>
            </motion.div>

            <motion.div variants={linkVariants} whileHover="hover">
              <NavLink
                to="/journal"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <span className="sidebar-icon">📝</span>
                <span className="sidebar-label">Journal</span>
              </NavLink>
            </motion.div>

            <motion.div variants={linkVariants} whileHover="hover">
              <NavLink
                to="/privacy-settings"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <span className="sidebar-icon">🔒</span>
                <span className="sidebar-label">Privacy</span>
              </NavLink>
            </motion.div>

            {user?.role === "counselor" && (
              <motion.div variants={linkVariants} whileHover="hover">
                <NavLink
                  to="/counselor-dashboard"
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="sidebar-icon">👥</span>
                  <span className="sidebar-label">Counselor</span>
                </NavLink>
              </motion.div>
            )}
          </>
        ) : (
          <>
            <motion.div
              className="sidebar-link locked"
              onClick={() => navigate("/login")}
              variants={linkVariants}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="sidebar-icon">🎯</span>
              <span className="sidebar-label">Goal</span>
              <span className="lock-icon">🔒</span>
            </motion.div>

            <motion.div
              className="sidebar-link locked"
              onClick={() => navigate("/login")}
              variants={linkVariants}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="sidebar-icon">📊</span>
              <span className="sidebar-label">Dashboard</span>
              <span className="lock-icon">🔒</span>
            </motion.div>

            <motion.div
              className="sidebar-link locked"
              onClick={() => navigate("/login")}
              variants={linkVariants}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="sidebar-icon">📝</span>
              <span className="sidebar-label">Journal</span>
              <span className="lock-icon">🔒</span>
            </motion.div>
          </>
        )}
      </motion.nav>

      <motion.div
        className="sidebar-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {isAuthenticated ? (
          <>
            <motion.div
              className="user-info-sidebar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div
                className="user-avatar"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </motion.div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    className="user-details"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="user-name">
                      {user?.name || "User"}
                      {user?.role === "counselor" && (
                        <span style={{ marginLeft: "5px", fontSize: "0.8em", color: "#6366f1" }}>
                          👨‍⚕️
                        </span>
                      )}
                    </div>
                    <div className="user-email">{user?.email}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <motion.button
              onClick={handleLogout}
              className="logout-btn"
              title="Logout"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {isCollapsed ? "🚪" : "🚪 Logout"}
            </motion.button>
          </>
        ) : (
          <div className="auth-buttons">
            <motion.button
              onClick={() => navigate("/login")}
              className="login-btn"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </motion.button>
            <motion.button
              onClick={() => navigate("/signup")}
              className="signup-btn"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Up
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.aside>
  );
};

export default Sidebar;
