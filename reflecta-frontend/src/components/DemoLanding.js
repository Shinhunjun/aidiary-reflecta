import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "../contexts/SidebarContext";
import { useTour } from "../contexts/TourContext";
import "./DemoLanding.css";

const DemoLanding = () => {
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();
  const { collapseSidebar } = useSidebar();
  const { startTour, updateTotalSteps } = useTour();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collapse sidebar when demo landing page mounts
  useEffect(() => {
    collapseSidebar();
  }, [collapseSidebar]);

  const scrollToNextSection = () => {
    const nextSection = document.querySelector('.demo-problem-solution');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

  const handleStartGuidedTour = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginAsDemo();
      if (result.success) {
        // Set total steps for the complete tour (Goal Setting: 9, Chat: 12, Dashboard: 11)
        updateTotalSteps(32);

        // Start the guided tour - this will navigate to goal-setting automatically
        startTour();
      } else {
        setError(result.error || "Failed to start guided tour. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
      console.error("Guided tour error:", err);
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
      screenshots: [
        {
          url: "/screenshots/chat-interface.png",
          alt: "AI chat conversation interface",
          caption: "Step 1: Chat naturally with AI"
        },
        {
          url: "/screenshots/diary-converted.png",
          alt: "Converted diary entry with goal mapping",
          caption: "Step 2: Instant diary conversion"
        }
      ]
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
              🚀 Interactive Demo
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

            <motion.div
              className="demo-scroll-indicator"
              onClick={scrollToNextSection}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <motion.div
                className="demo-scroll-arrow"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                ↓
              </motion.div>
              <span className="demo-scroll-text">Scroll to explore</span>
            </motion.div>
          </motion.div>
        </div>

        <div className="demo-hero-background">
          <div className="demo-gradient-orb demo-orb-1"></div>
          <div className="demo-gradient-orb demo-orb-2"></div>
          <div className="demo-gradient-orb demo-orb-3"></div>
        </div>
      </section>

      {/* Team Section */}
      <section className="demo-section demo-team-section">
        <div className="demo-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="demo-section-title">Meet Our Team</h2>
            <p className="demo-section-subtitle">
              AI & HCI experts building the future of personal growth
            </p>

            <div className="demo-team-grid">
              <motion.div
                className="demo-team-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="demo-team-avatar">👨‍💻</div>
                <h3>Hunjun Sin</h3>
                <div className="demo-team-role">Lead Developer & AI Engineer</div>
                <p className="demo-team-bio">
                  Full-stack developer specializing in AI integration and user experience design.
                  Passionate about using technology to support mental wellness.
                </p>
              </motion.div>

              <motion.div
                className="demo-team-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="demo-team-avatar">🧠</div>
                <h3>HCI Research Team</h3>
                <div className="demo-team-role">UX Research & Psychology</div>
                <p className="demo-team-bio">
                  Human-Computer Interaction specialists researching emotional AI and
                  conversational interfaces for personal growth applications.
                </p>
              </motion.div>

              <motion.div
                className="demo-team-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="demo-team-avatar">🎯</div>
                <h3>Product Strategy</h3>
                <div className="demo-team-role">Mental Health & Goal Science</div>
                <p className="demo-team-bio">
                  Combining evidence-based psychology with proven goal-setting frameworks
                  like Mandalart to create structured growth pathways.
                </p>
              </motion.div>
            </div>

            <div className="demo-team-expertise">
              <div className="demo-expertise-badge">🚀 AI/ML Development</div>
              <div className="demo-expertise-badge">🎨 UX/UI Design</div>
              <div className="demo-expertise-badge">🧠 Psychology Research</div>
              <div className="demo-expertise-badge">📊 Data Analytics</div>
            </div>
          </motion.div>
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
                {feature.screenshots ? (
                  // Multiple screenshots for this feature
                  <div className="demo-screenshots-grid">
                    {feature.screenshots.map((screenshot, sIndex) => (
                      <div key={sIndex} className="demo-screenshot-wrapper">
                        <div className="demo-screenshot-placeholder">
                          <img
                            src={screenshot.url}
                            alt={screenshot.alt}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="demo-screenshot-fallback" style={{ display: 'none' }}>
                            <span className="demo-screenshot-icon">📸</span>
                            <p>Screenshot Coming Soon</p>
                            <small>{screenshot.alt}</small>
                          </div>
                        </div>
                        {screenshot.caption && (
                          <p className="demo-screenshot-caption">{screenshot.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Single screenshot
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
                )}
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

      {/* User Journey & System Architecture Section */}
      <section className="demo-section demo-journey-section">
        <div className="demo-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="demo-section-title">How It Works: User Journey</h2>

            {/* User Flow Diagram */}
            <div className="demo-user-flow">
              <div className="demo-flow-step">
                <div className="demo-flow-number">1</div>
                <div className="demo-flow-icon">✨</div>
                <h4>Sign Up & Set Goals</h4>
                <p>Create account and build your Mandalart goal matrix</p>
              </div>

              <div className="demo-flow-arrow">→</div>

              <div className="demo-flow-step">
                <div className="demo-flow-number">2</div>
                <div className="demo-flow-icon">💬</div>
                <h4>Chat with AI</h4>
                <p>Select a persona and have natural conversations</p>
              </div>

              <div className="demo-flow-arrow">→</div>

              <div className="demo-flow-step">
                <div className="demo-flow-number">3</div>
                <div className="demo-flow-icon">📝</div>
                <h4>Convert to Journal</h4>
                <p>AI transforms chat into structured diary entries</p>
              </div>

              <div className="demo-flow-arrow">→</div>

              <div className="demo-flow-step">
                <div className="demo-flow-number">4</div>
                <div className="demo-flow-icon">🎯</div>
                <h4>Auto Goal Mapping</h4>
                <p>Entries linked to your Mandalart goals automatically</p>
              </div>

              <div className="demo-flow-arrow">→</div>

              <div className="demo-flow-step">
                <div className="demo-flow-number">5</div>
                <div className="demo-flow-icon">📊</div>
                <h4>View Analytics</h4>
                <p>Track progress, mood trends, and AI insights</p>
              </div>
            </div>

            {/* System Architecture */}
            <div className="demo-architecture">
              <h3 className="demo-subsection-title">System Architecture</h3>
              <div className="demo-architecture-diagram">
                <div className="demo-arch-layer">
                  <div className="demo-arch-title">Frontend Layer</div>
                  <div className="demo-arch-boxes">
                    <div className="demo-arch-box">
                      <strong>React + Framer Motion</strong>
                      <p>Interactive UI with smooth animations</p>
                    </div>
                    <div className="demo-arch-box">
                      <strong>Context API</strong>
                      <p>State management for auth & journals</p>
                    </div>
                  </div>
                </div>

                <div className="demo-arch-connector">↓</div>

                <div className="demo-arch-layer">
                  <div className="demo-arch-title">API Layer</div>
                  <div className="demo-arch-boxes">
                    <div className="demo-arch-box">
                      <strong>Node.js + Express</strong>
                      <p>RESTful API with JWT authentication</p>
                    </div>
                    <div className="demo-arch-box">
                      <strong>OpenAI Integration</strong>
                      <p>GPT-4 for chat, analysis, summaries</p>
                    </div>
                  </div>
                </div>

                <div className="demo-arch-connector">↓</div>

                <div className="demo-arch-layer">
                  <div className="demo-arch-title">Data Layer</div>
                  <div className="demo-arch-boxes">
                    <div className="demo-arch-box">
                      <strong>MongoDB</strong>
                      <p>User data, goals, journals, analytics</p>
                    </div>
                    <div className="demo-arch-box">
                      <strong>7-Day Caching</strong>
                      <p>Reduce API costs for summaries</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Features Storyboard */}
            <div className="demo-storyboard">
              <h3 className="demo-subsection-title">Feature Storyboard</h3>
              <div className="demo-storyboard-grid">
                <div className="demo-storyboard-frame">
                  <div className="demo-frame-header">Scene 1: New User</div>
                  <div className="demo-frame-visual">
                    <div className="demo-frame-icon">👤</div>
                    <p>"I want to achieve my dreams but don't know where to start"</p>
                  </div>
                </div>

                <div className="demo-storyboard-frame">
                  <div className="demo-frame-header">Scene 2: Mandalart</div>
                  <div className="demo-frame-visual">
                    <div className="demo-frame-icon">🎯</div>
                    <p>Creates 9x9 goal matrix: 1 core goal → 8 sub-goals → 64 tasks</p>
                  </div>
                </div>

                <div className="demo-storyboard-frame">
                  <div className="demo-frame-header">Scene 3: Daily Chat</div>
                  <div className="demo-frame-visual">
                    <div className="demo-frame-icon">💬</div>
                    <p>Chats with "Goal Coach" persona about today's challenges</p>
                  </div>
                </div>

                <div className="demo-storyboard-frame">
                  <div className="demo-frame-header">Scene 4: Auto Diary</div>
                  <div className="demo-frame-visual">
                    <div className="demo-frame-icon">📝</div>
                    <p>Converts chat to structured entry with mood & goal tags</p>
                  </div>
                </div>

                <div className="demo-storyboard-frame">
                  <div className="demo-frame-header">Scene 5: Insights</div>
                  <div className="demo-frame-visual">
                    <div className="demo-frame-icon">📊</div>
                    <p>Views dashboard: "You're 60% complete on Fitness sub-goal!"</p>
                  </div>
                </div>

                <div className="demo-storyboard-frame">
                  <div className="demo-frame-header">Scene 6: Achievement</div>
                  <div className="demo-frame-visual">
                    <div className="demo-frame-icon">🎉</div>
                    <p>30 days later: "I'm making real progress toward my dreams"</p>
                  </div>
                </div>
              </div>
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

      {/* Enhanced Market Research Section */}
      <section className="demo-section demo-market-section">
        <div className="demo-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="demo-section-title">Market Opportunity</h2>

            {/* AI Trend Evolution */}
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

            {/* Market Size */}
            <div className="demo-market-stats">
              <div className="demo-market-stat">
                <div className="demo-market-stat-number">$4.8B</div>
                <div className="demo-market-stat-label">Mental Wellness Apps Market (2024)</div>
              </div>
              <div className="demo-market-stat">
                <div className="demo-market-stat-number">20%+</div>
                <div className="demo-market-stat-label">Annual Growth Rate (CAGR)</div>
              </div>
              <div className="demo-market-stat">
                <div className="demo-market-stat-number">87M+</div>
                <div className="demo-market-stat-label">Global Users of Mental Health Apps</div>
              </div>
            </div>

            {/* Competitor Comparison */}
            <h3 className="demo-subsection-title">How We're Different</h3>
            <div className="demo-competitor-table">
              <div className="demo-competitor-row demo-competitor-header">
                <div className="demo-competitor-col">Feature</div>
                <div className="demo-competitor-col">Notion</div>
                <div className="demo-competitor-col">Day One</div>
                <div className="demo-competitor-col">Headspace</div>
                <div className="demo-competitor-col demo-competitor-reflecta">Reflecta</div>
              </div>
              <div className="demo-competitor-row">
                <div className="demo-competitor-col">AI Chat Personas</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col demo-competitor-reflecta">✅ 6+ Custom</div>
              </div>
              <div className="demo-competitor-row">
                <div className="demo-competitor-col">Goal Framework</div>
                <div className="demo-competitor-col">Basic</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col demo-competitor-reflecta">✅ Mandalart</div>
              </div>
              <div className="demo-competitor-row">
                <div className="demo-competitor-col">Auto Diary Conversion</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col demo-competitor-reflecta">✅ AI-Powered</div>
              </div>
              <div className="demo-competitor-row">
                <div className="demo-competitor-col">Goal-Journal Mapping</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col demo-competitor-reflecta">✅ Automatic</div>
              </div>
              <div className="demo-competitor-row">
                <div className="demo-competitor-col">Mental Health Monitoring</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col">❌</div>
                <div className="demo-competitor-col">Basic</div>
                <div className="demo-competitor-col demo-competitor-reflecta">✅ AI + Counselor</div>
              </div>
            </div>

            <div className="demo-differentiation-message">
              <strong>Our Unique Value:</strong> Reflecta is the only platform that combines conversational AI,
              structured goal-setting (Mandalart), automated journaling, and professional mental health support
              in one integrated system.
            </div>
          </motion.div>
        </div>
      </section>

      {/* Business Strategy Section */}
      <section className="demo-section demo-business-section">
        <div className="demo-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="demo-section-title">Business Strategy</h2>

            {/* Target Users */}
            <div className="demo-target-users">
              <h3 className="demo-subsection-title">Target User Personas</h3>
              <div className="demo-persona-grid">
                <div className="demo-persona-card">
                  <div className="demo-persona-icon">🎓</div>
                  <h4>Students & Young Professionals</h4>
                  <p>Ages 18-30 seeking structured goal-setting and mental health support during transitions</p>
                  <div className="demo-persona-stat">Primary Market: 45M users globally</div>
                </div>
                <div className="demo-persona-card">
                  <div className="demo-persona-icon">💼</div>
                  <h4>Working Professionals</h4>
                  <p>Ages 25-45 managing stress, career goals, and work-life balance</p>
                  <div className="demo-persona-stat">Secondary Market: 30M users globally</div>
                </div>
                <div className="demo-persona-card">
                  <div className="demo-persona-icon">🏫</div>
                  <h4>Educational Institutions</h4>
                  <p>Universities and schools providing mental health resources to students</p>
                  <div className="demo-persona-stat">Enterprise Market: 5,000+ institutions</div>
                </div>
              </div>
            </div>

            {/* Monetization Strategy */}
            <div className="demo-monetization">
              <h3 className="demo-subsection-title">Monetization Model</h3>
              <div className="demo-pricing-tiers">
                <div className="demo-pricing-card">
                  <div className="demo-pricing-badge">Free</div>
                  <div className="demo-pricing-price">$0</div>
                  <ul className="demo-pricing-features">
                    <li>✓ Basic journaling</li>
                    <li>✓ 2 AI personas</li>
                    <li>✓ Mandalart goal-setting</li>
                    <li>✓ Limited AI chats (10/month)</li>
                  </ul>
                </div>
                <div className="demo-pricing-card demo-pricing-featured">
                  <div className="demo-pricing-badge">Premium</div>
                  <div className="demo-pricing-price">$9.99<span>/mo</span></div>
                  <ul className="demo-pricing-features">
                    <li>✓ Unlimited AI chats</li>
                    <li>✓ All 6 personas + custom</li>
                    <li>✓ Advanced analytics</li>
                    <li>✓ AI insights & summaries</li>
                    <li>✓ Export & backup</li>
                  </ul>
                </div>
                <div className="demo-pricing-card">
                  <div className="demo-pricing-badge">Enterprise</div>
                  <div className="demo-pricing-price">Custom</div>
                  <ul className="demo-pricing-features">
                    <li>✓ Counselor dashboard</li>
                    <li>✓ Student risk monitoring</li>
                    <li>✓ Admin controls</li>
                    <li>✓ Bulk licensing</li>
                    <li>✓ Custom integrations</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Growth Roadmap */}
            <div className="demo-roadmap">
              <h3 className="demo-subsection-title">2025-2026 Roadmap</h3>
              <div className="demo-roadmap-timeline">
                <div className="demo-roadmap-item">
                  <div className="demo-roadmap-quarter">Q1 2025</div>
                  <div className="demo-roadmap-milestone">Beta Launch & User Feedback</div>
                  <ul>
                    <li>Public beta with 1,000 users</li>
                    <li>Iterate based on feedback</li>
                    <li>Refine AI personas</li>
                  </ul>
                </div>
                <div className="demo-roadmap-item">
                  <div className="demo-roadmap-quarter">Q2 2025</div>
                  <div className="demo-roadmap-milestone">Premium Launch & Marketing</div>
                  <ul>
                    <li>Launch premium tier</li>
                    <li>Social media campaigns</li>
                    <li>Partner with influencers</li>
                  </ul>
                </div>
                <div className="demo-roadmap-item">
                  <div className="demo-roadmap-quarter">Q3 2025</div>
                  <div className="demo-roadmap-milestone">Enterprise Pilot Program</div>
                  <ul>
                    <li>Onboard 5-10 universities</li>
                    <li>Build counselor features</li>
                    <li>HIPAA compliance</li>
                  </ul>
                </div>
                <div className="demo-roadmap-item">
                  <div className="demo-roadmap-quarter">Q4 2025 - Q2 2026</div>
                  <div className="demo-roadmap-milestone">Scale & Expand</div>
                  <ul>
                    <li>Reach 50,000 active users</li>
                    <li>Mobile app (iOS/Android)</li>
                    <li>International expansion</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Marketing Channels */}
            <div className="demo-marketing">
              <h3 className="demo-subsection-title">Go-to-Market Channels</h3>
              <div className="demo-marketing-channels">
                <div className="demo-marketing-channel">
                  <span className="demo-marketing-icon">📱</span>
                  <div>
                    <strong>Social Media</strong>
                    <p>TikTok, Instagram for student demographics</p>
                  </div>
                </div>
                <div className="demo-marketing-channel">
                  <span className="demo-marketing-icon">🎓</span>
                  <div>
                    <strong>University Partnerships</strong>
                    <p>Mental health centers, career services</p>
                  </div>
                </div>
                <div className="demo-marketing-channel">
                  <span className="demo-marketing-icon">💬</span>
                  <div>
                    <strong>Content Marketing</strong>
                    <p>Blog, YouTube on goal-setting & mental wellness</p>
                  </div>
                </div>
                <div className="demo-marketing-channel">
                  <span className="demo-marketing-icon">🤝</span>
                  <div>
                    <strong>Referral Program</strong>
                    <p>Incentivize user growth through sharing</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact & Feedback Section */}
      <section className="demo-section demo-contact-section">
        <div className="demo-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="demo-section-title">Get in Touch</h2>
            <p className="demo-section-subtitle">
              We'd love to hear your feedback and answer your questions
            </p>

            <div className="demo-contact-grid">
              {/* Contact Info */}
              <div className="demo-contact-info">
                <h3>Contact Information</h3>
                <div className="demo-contact-item">
                  <span className="demo-contact-icon">📧</span>
                  <div>
                    <strong>Email</strong>
                    <p>reflecta.team@gmail.com</p>
                  </div>
                </div>
                <div className="demo-contact-item">
                  <span className="demo-contact-icon">🌐</span>
                  <div>
                    <strong>Website</strong>
                    <p>aidiary-reflecta.vercel.app</p>
                  </div>
                </div>
                <div className="demo-contact-item">
                  <span className="demo-contact-icon">💬</span>
                  <div>
                    <strong>Social Media</strong>
                    <p>Follow us for updates and mental wellness tips</p>
                  </div>
                </div>

                <div className="demo-social-links">
                  <a href="#" className="demo-social-link" title="Twitter">🐦</a>
                  <a href="#" className="demo-social-link" title="LinkedIn">💼</a>
                  <a href="#" className="demo-social-link" title="Instagram">📸</a>
                  <a href="https://github.com/yourusername/reflecta" className="demo-social-link" title="GitHub">💻</a>
                </div>
              </div>

              {/* Feedback Form */}
              <div className="demo-feedback-form">
                <h3>Send Us Feedback</h3>
                <form className="demo-form">
                  <div className="demo-form-group">
                    <label htmlFor="demo-name">Name</label>
                    <input
                      type="text"
                      id="demo-name"
                      className="demo-input"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="demo-form-group">
                    <label htmlFor="demo-email">Email</label>
                    <input
                      type="email"
                      id="demo-email"
                      className="demo-input"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div className="demo-form-group">
                    <label htmlFor="demo-message">Message</label>
                    <textarea
                      id="demo-message"
                      className="demo-textarea"
                      rows="5"
                      placeholder="Share your thoughts, questions, or feedback..."
                    ></textarea>
                  </div>
                  <button type="submit" className="demo-submit-btn">
                    Send Message ✉️
                  </button>
                </form>
                <p className="demo-form-note">
                  <strong>Note:</strong> This is a demo form. For actual inquiries, please email us directly.
                </p>
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

            <div className="demo-final-cta-actions">
              <button
                className="demo-cta-button demo-cta-primary demo-cta-large"
                onClick={handleStartGuidedTour}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="demo-spinner"></span>
                    Loading Tour...
                  </>
                ) : (
                  <>
                    🎓 Start Guided Tour
                  </>
                )}
              </button>
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
