import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import "./Home.css";

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleJournalClick = () => {
    if (isAuthenticated) {
      navigate("/journal");
    } else {
      navigate("/login");
    }
  };

  const handleGoalSettingClick = () => {
    if (isAuthenticated) {
      navigate("/goal-setting");
    } else {
      navigate("/login");
    }
  };

  const handleProgressClick = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const featureVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
    hover: {
      scale: 1.05,
      y: -10,
      transition: {
        duration: 0.3,
      },
    },
  };

  if (!isAuthenticated) {
    return (
      <div className="home-container">
        <main className="home-main">
          <motion.section
            className="hero-section"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div className="hero-content" variants={itemVariants}>
              <motion.h2 variants={itemVariants}>Welcome to Reflecta</motion.h2>
              <motion.p variants={itemVariants}>
                Set your goals, log your day, track your progress, and achieve
                your dreams. Start your journey with us today.
              </motion.p>
              <motion.div className="hero-actions" variants={itemVariants}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/demo" className="cta-button">
                    🎬 Try Demo
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/signup" className="secondary-button">
                    Get Started
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/login" className="secondary-button">
                    Login
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.section>

          <motion.section
            className="features-section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <div className="features-content">
              <div className="features-grid">
                <motion.div
                  className="feature-item"
                  variants={featureVariants}
                  whileHover="hover"
                >
                  <div className="feature-icon">🎯</div>
                  <h4>Goal Setting</h4>
                  <p>Set personal goals and work towards achieving them.</p>
                  <div className="feature-hint">Login to access</div>
                </motion.div>
                <motion.div
                  className="feature-item"
                  variants={featureVariants}
                  whileHover="hover"
                >
                  <div className="feature-icon">📝</div>
                  <h4>Journal Writing</h4>
                  <p>
                    Record and reflect on your daily experiences and thoughts.
                  </p>
                  <div className="feature-hint">Login to access</div>
                </motion.div>
                <motion.div
                  className="feature-item"
                  variants={featureVariants}
                  whileHover="hover"
                >
                  <div className="feature-icon">📊</div>
                  <h4>Progress Tracking</h4>
                  <p>Visualize your growth journey and track your progress.</p>
                  <div className="feature-hint">Login to access</div>
                </motion.div>
              </div>
            </div>
          </motion.section>
        </main>

        <footer className="home-footer">
          <p>&copy; 2024 Reflecta. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="home-container">
      <main className="home-main">
        <motion.section
          className="hero-section"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h2
            className="hero-title"
            variants={itemVariants}
          >
            Reflecta
          </motion.h2>
          <motion.div className="hero-content" variants={itemVariants}>
            <motion.p className="about-intro" variants={itemVariants}>
              Welcome, {user?.name || "there"}! Reflecta is your personal growth
              companion, designed to help you set meaningful goals, reflect on
              your journey, and track your progress towards becoming your best
              self.
            </motion.p>
          </motion.div>
        </motion.section>

        <motion.section
          className="features-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <div className="features-content">
            <motion.h3 className="section-title" variants={itemVariants}>
              What You Can Do
            </motion.h3>
            <div className="features-grid">
              <motion.div
                className="feature-item clickable"
                onClick={handleGoalSettingClick}
                variants={featureVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <div className="feature-icon">🎯</div>
                <h4>Goal Setting</h4>
                <p>
                  Set personal goals and work towards achieving them with
                  structured planning and tracking.
                </p>
                <div className="feature-hint">Click to set your goals</div>
              </motion.div>
              <motion.div
                className="feature-item clickable"
                onClick={handleJournalClick}
                variants={featureVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <div className="feature-icon">📝</div>
                <h4>Journal Writing</h4>
                <p>
                  Record and reflect on your daily experiences, thoughts, and
                  feelings with AI-powered assistance.
                </p>
                <div className="feature-hint">Click to start writing</div>
              </motion.div>
              <motion.div
                className="feature-item clickable"
                onClick={handleProgressClick}
                variants={featureVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <div className="feature-icon">📊</div>
                <h4>Progress Dashboard</h4>
                <p>
                  Visualize your growth journey and track your progress with
                  insightful analytics.
                </p>
                <div className="feature-hint">Click to view dashboard</div>
              </motion.div>
            </div>

            <motion.div
              className="about-mission"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3>Our Mission</h3>
              <p>
                We believe that self-reflection and goal-setting are powerful
                tools for personal growth. Reflecta combines modern technology
                with proven psychological principles to create a platform that
                supports your journey towards self-improvement and achievement.
              </p>
            </motion.div>
          </div>
        </motion.section>
      </main>

      <footer className="home-footer">
        <p>&copy; 2024 Reflecta. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
