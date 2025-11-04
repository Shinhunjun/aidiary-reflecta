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

  const featureShowcase = [
    {
      title: "Ohtani Shohei's Secret Weapon",
      subtitle: "Mandalart Goal Setting Framework",
      description: "The same goal-setting system used by MLB superstar Shohei Ohtani to achieve his dreams. Break down your single core goal into 8 focused sub-goals, then expand each into 8 actionable tasks—creating a comprehensive roadmap of 64 concrete steps.",
      highlights: [
        "Visual 9×9 grid makes complex goals manageable",
        "Color-coded categories for life balance",
        "Track progress across all 64 actionable tasks",
        "Pre-loaded demo with complete goal structure"
      ],
      screenshot: "/screenshots/mandalart-grid.png",
      imageAlt: "Mandalart 9x9 goal-setting grid"
    },
    {
      title: "Choose Your Perfect AI Companion",
      subtitle: "6 AI Personas + Custom Creation",
      description: "Every conversation style is different. Select from our carefully crafted personas—each with unique approaches to reflection and growth—or create your own custom persona with personalized prompts and personality traits.",
      highlights: [
        "Empathetic Listener for emotional support",
        "Goal Coach for achievement-focused reflection",
        "Analytical Advisor for problem-solving",
        "Creative Explorer for imaginative thinking",
        "Plus Mindfulness Guide & Balanced All-Rounder",
        "Create unlimited custom personas"
      ],
      screenshot: "/screenshots/personas-selector.png",
      imageAlt: "AI Persona selection interface"
    },
    {
      title: "Talk Naturally, Journal Effortlessly",
      subtitle: "Chat → Auto Diary Conversion",
      description: "Research shows people express 75% more emotions in conversation than writing. Chat with AI like you're talking to a friend, then instantly convert those conversations into structured journal entries with automatic goal mapping and mood detection.",
      highlights: [
        "Natural conversation interface—no blank page anxiety",
        "Select any messages to convert to diary",
        "Automatic goal mapping to your Mandalart",
        "Mood tracking and emotion analysis",
        "Edit and refine AI-generated entries"
      ],
      screenshot: "/screenshots/chat-to-diary.png",
      imageAlt: "Chat to diary conversion process"
    },
    {
      title: "Understand Your Growth Patterns",
      subtitle: "AI-Powered Insights & Analytics",
      description: "Transform your journal entries into actionable insights. Our AI analyzes your reflections to reveal patterns, track emotional trends, correlate mood with goals, and generate beautiful visualizations of your personal growth journey.",
      highlights: [
        "Word clouds highlight your focus areas",
        "AI-generated summaries (7-day cache for efficiency)",
        "Mood-goal correlation analysis",
        "Progress charts and timeline views",
        "Search and filter by mood, tags, or goals"
      ],
      screenshot: "/screenshots/ai-insights.png",
      imageAlt: "AI insights dashboard with word cloud and charts"
    }
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

      {/* Feature Showcase Section with Screenshots */}
      <section className="demo-section demo-showcase-section">
        <div className="demo-container">
          {featureShowcase.map((feature, index) => (
            <motion.div
              key={index}
              className={`demo-showcase-item ${index % 2 === 1 ? "reverse" : ""}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.2 }}
            >
              <div className="demo-showcase-image">
                <div className="demo-screenshot-placeholder">
                  <img
                    src={feature.screenshot}
                    alt={feature.imageAlt}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="demo-screenshot-fallback" style={{ display: 'none' }}>
                    <span className="demo-screenshot-icon">📸</span>
                    <p>Screenshot Coming Soon</p>
                    <small>{feature.imageAlt}</small>
                  </div>
                </div>
              </div>

              <div className="demo-showcase-content">
                <div className="demo-showcase-badge">Feature {String(index + 1).padStart(2, '0')}</div>
                <h3 className="demo-showcase-title">{feature.title}</h3>
                <h4 className="demo-showcase-subtitle">{feature.subtitle}</h4>
                <p className="demo-showcase-description">{feature.description}</p>
                <ul className="demo-showcase-highlights">
                  {feature.highlights.map((highlight, hIndex) => (
                    <li key={hIndex}>
                      <span className="demo-highlight-icon">✓</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
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
