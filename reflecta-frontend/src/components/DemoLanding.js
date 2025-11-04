import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import "./DemoLanding.css";

const DemoLanding = () => {
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartDemo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginAsDemo();
      if (result.success) {
        // Navigate to dashboard after successful login
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        setError(result.error || "Failed to start demo. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
      console.error("Demo login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: "💜",
      title: "6 AI Personas + Custom Creation",
      description: "Choose from Empathetic Listener, Goal Coach, Analytical Advisor, Creative Explorer, Mindfulness Guide, or Balanced All-Rounder. Or create your own!",
      gradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    },
    {
      icon: "💬",
      title: "Chat → Auto Diary Conversion",
      description: "Talk naturally with AI, then convert conversations into structured journal entries with automatic goal mapping.",
      gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    },
    {
      icon: "🎯",
      title: "Mandalart Goal Setting",
      description: "Ohtani Shohei's secret weapon: Break down 1 core goal into 8 sub-goals and 64 actionable tasks.",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    },
    {
      icon: "📊",
      title: "AI-Powered Insights",
      description: "Automatic summaries, word clouds, emotion tracking, and goal-progress correlation analysis.",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
  ];

  return (
    <div className="demo-landing-container">
      {/* Hero Section */}
      <section className="demo-hero-section">
        <div className="demo-hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="demo-badge">
              🚀 Interactive Demo - No Signup Required
            </div>

            <h1 className="demo-hero-title">
              Experience Reflecta
            </h1>

            <p className="demo-hero-subtitle">
              AI-Powered Personal Growth Platform
            </p>

            <p className="demo-hero-description">
              Try the full demo with pre-loaded data. See how AI personas, chat-to-diary conversion,
              Mandalart goal-setting, and intelligent insights work together to transform your personal growth journey.
            </p>

            <div className="demo-hero-actions">
              <button
                className="demo-cta-button demo-cta-primary"
                onClick={handleStartDemo}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="demo-spinner"></span>
                    Logging in...
                  </>
                ) : (
                  <>
                    🎬 Start Interactive Demo
                  </>
                )}
              </button>

              <button
                className="demo-cta-button demo-cta-secondary"
                onClick={() => navigate("/signup")}
              >
                Create Free Account
              </button>
            </div>

            {error && (
              <div className="demo-error-message">
                {error}
              </div>
            )}
          </motion.div>
        </div>

        <div className="demo-hero-background">
          <div className="demo-gradient-orb demo-orb-1"></div>
          <div className="demo-gradient-orb demo-orb-2"></div>
          <div className="demo-gradient-orb demo-orb-3"></div>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <section className="demo-section demo-problem-solution">
        <div className="demo-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="demo-section-title">Why Reflecta?</h2>

            <div className="demo-comparison-grid">
              <div className="demo-comparison-card demo-problem-card">
                <h3>❌ Traditional Journaling</h3>
                <ul>
                  <li>90% abandon within a month</li>
                  <li>Blank page intimidation</li>
                  <li>Hard to find patterns manually</li>
                  <li>Goals disconnected from daily life</li>
                </ul>
              </div>

              <div className="demo-comparison-card demo-solution-card">
                <h3>✅ Reflecta Approach</h3>
                <ul>
                  <li>75% more emotional expression via AI chat</li>
                  <li>Conversation-based journaling</li>
                  <li>Automatic pattern recognition</li>
                  <li>Goals linked to every entry</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="demo-section demo-features-section">
        <div className="demo-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="demo-section-title">Core Features You'll Experience</h2>
            <p className="demo-section-subtitle">
              In the demo, you'll see real data showcasing each feature
            </p>

            <div className="demo-features-grid">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="demo-feature-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <div
                    className="demo-feature-icon"
                    style={{ background: feature.gradient }}
                  >
                    <span>{feature.icon}</span>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ELIZA Effect Section */}
      <section className="demo-section demo-eliza-section">
        <div className="demo-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="demo-eliza-content"
          >
            <div className="demo-eliza-text">
              <h2>The Science: ELIZA Effect</h2>
              <p className="demo-eliza-quote">
                "People express 75% more emotions when talking to AI versus writing in blank pages."
              </p>
              <p className="demo-eliza-description">
                Since the 1960s, MIT's ELIZA chatbot showed that humans naturally open up more
                in conversation—even with machines. Reflecta evolved this: our AI knows your goals,
                adapts to your personality choice, and helps you reflect meaningfully.
              </p>
            </div>
            <div className="demo-eliza-visual">
              <div className="demo-stat-card">
                <div className="demo-stat-number">75%</div>
                <div className="demo-stat-label">More Emotional Expression</div>
              </div>
              <div className="demo-stat-card">
                <div className="demo-stat-number">6</div>
                <div className="demo-stat-label">AI Personas + Custom</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2025 AI Trend Section */}
      <section className="demo-section demo-trend-section">
        <div className="demo-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="demo-section-title">AI is Evolving: Creation → Support</h2>

            <div className="demo-trend-comparison">
              <div className="demo-trend-year">
                <div className="demo-trend-label">2024</div>
                <div className="demo-trend-category">Content Creation</div>
                <div className="demo-trend-use">Generate Ideas</div>
              </div>

              <div className="demo-trend-arrow">→</div>

              <div className="demo-trend-year demo-trend-current">
                <div className="demo-trend-label">2025</div>
                <div className="demo-trend-category">Emotional Support</div>
                <div className="demo-trend-use">Therapy & Companionship</div>
              </div>
            </div>

            <p className="demo-trend-source">
              Source: Visual Capitalist, 2025 — "Therapy & Companionship" ranked #1 among AI use cases
            </p>

            <p className="demo-trend-message">
              Reflecta is at the center of this transformation, combining AI companionship
              with structured goal achievement.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What You'll See Section */}
      <section className="demo-section demo-preview-section">
        <div className="demo-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="demo-section-title">What You'll See in the Demo</h2>

            <div className="demo-preview-grid">
              <div className="demo-preview-item">
                <div className="demo-preview-number">01</div>
                <h3>Pre-loaded Mandalart Goals</h3>
                <p>9 life areas with 72 actionable tasks already set up</p>
              </div>

              <div className="demo-preview-item">
                <div className="demo-preview-number">02</div>
                <h3>15 Diverse Journal Entries</h3>
                <p>Real examples of chat-to-diary conversions with mood tracking</p>
              </div>

              <div className="demo-preview-item">
                <div className="demo-preview-number">03</div>
                <h3>AI-Generated Insights</h3>
                <p>Word clouds, progress charts, and goal-emotion correlations</p>
              </div>

              <div className="demo-preview-item">
                <div className="demo-preview-number">04</div>
                <h3>6 AI Personas Ready</h3>
                <p>Try different conversation styles and create your own</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="demo-section demo-final-cta">
        <div className="demo-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="demo-final-cta-content"
          >
            <h2>Ready to Experience the Future of Personal Growth?</h2>
            <p>
              No credit card required. No lengthy signup. Just click and explore.
            </p>

            <div className="demo-final-cta-actions">
              <button
                className="demo-cta-button demo-cta-primary demo-cta-large"
                onClick={handleStartDemo}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="demo-spinner"></span>
                    Logging in...
                  </>
                ) : (
                  <>
                    🚀 Launch Demo Now
                  </>
                )}
              </button>

              <p className="demo-final-note">
                Takes less than 5 seconds • Full features unlocked • Real data included
              </p>
            </div>

            {error && (
              <div className="demo-error-message">
                {error}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default DemoLanding;
