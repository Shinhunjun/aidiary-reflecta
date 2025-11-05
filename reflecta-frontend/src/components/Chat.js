import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useJournal } from "../contexts/JournalContext";
import { useTour } from "../contexts/TourContext";
import apiService from "../services/api";
import PersonaSelector from "./PersonaSelector";
import PageTour from "./PageTour";
import HelpButton from "./HelpButton";
import "./Chat.css";

const Chat = () => {
  const { user } = useAuth();
  const { addJournalEntry, triggerRefresh } = useJournal();
  const { tourActive, currentTourStep } = useTour();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "I am Reflecta, your personal reflection assistant. I'm here to help you with self-reflection, goal setting, and personal growth. What would you like to talk about today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [diaryContent, setDiaryContent] = useState("");
  const [diaryMood, setDiaryMood] = useState("reflective");
  const [goalMapping, setGoalMapping] = useState(null);
  const [isConvertingToDiary, setIsConvertingToDiary] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState(null);
  const [currentPersona, setCurrentPersona] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chat session from API
  useEffect(() => {
    const loadChatSession = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingChat(true);
        const response = await apiService.getChatSession();
        if (response.messages && response.messages.length > 0) {
          // Convert timestamp strings to Date objects
          const messagesWithDates = response.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(messagesWithDates);
        }
      } catch (error) {
        console.error("Error loading chat session:", error);
        // Keep default messages if API fails
      } finally {
        setIsLoadingChat(false);
      }
    };

    loadChatSession();
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save chat session to API
  useEffect(() => {
    const saveChatSession = async () => {
      if (!user?.id || isLoadingChat) return;

      try {
        await apiService.saveChatSession(messages);
      } catch (error) {
        console.error("Error saving chat session:", error);
      }
    };

    // Debounce saves to avoid too many API calls
    const timeoutId = setTimeout(saveChatSession, 2000);
    return () => clearTimeout(timeoutId);
  }, [messages, user?.id, isLoadingChat]);

  // Load default persona on mount
  useEffect(() => {
    const loadDefaultPersona = async () => {
      if (!user?.id) {
        console.log('[Chat] Skipping persona load - no user ID');
        return;
      }

      try {
        console.log('[Chat] Loading personas for user:', user.id);
        const personas = await apiService.getPersonas();
        console.log('[Chat] Received personas:', personas.length, personas);

        // Select first persona (prioritize user's personal personas over default)
        const defaultPersona = personas[0];
        if (defaultPersona) {
          console.log('[Chat] Setting default persona:', defaultPersona.displayName);
          setSelectedPersonaId(defaultPersona._id);
          setCurrentPersona(defaultPersona);
        } else {
          console.warn('[Chat] No personas available');
        }
      } catch (error) {
        console.error("[Chat] Error loading default persona:", error);
      }
    };

    loadDefaultPersona();
  }, [user?.id]);

  // 대화 선택 관련 함수들
  const toggleMessageSelection = (messageId) => {
    setSelectedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const selectAllMessages = () => {
    const userMessages = messages.filter((msg) => msg.sender === "user");
    setSelectedMessages(userMessages.map((msg) => msg.id));
  };

  const clearSelection = () => {
    setSelectedMessages([]);
    setIsSelectMode(false);
  };

  // Tour mode: Inject mock conversation data when tour starts
  useEffect(() => {
    if (!tourActive || !currentTourStep) return;
    if (currentTourStep.pageId !== 'chat') return;

    // Only inject once when first entering chat page during tour
    if (currentTourStep.stepIndex === 0 && messages.length === 1) {
      console.log('[Chat Tour] Injecting mock conversation data...');

      const mockMessages = [
        {
          id: 1,
          text: "I am Reflecta, your personal reflection assistant. I'm here to help you think through your goals and feelings. What's on your mind today?",
          sender: "bot",
          timestamp: new Date(Date.now() - 240000), // 4 minutes ago
        },
        {
          id: 2,
          text: "I've been thinking about my career goals lately. I want to improve my professional network and learn new skills.",
          sender: "user",
          timestamp: new Date(Date.now() - 180000), // 3 minutes ago
        },
        {
          id: 3,
          text: "That's wonderful that you're focused on career growth! Building a strong network and continuously learning are key to professional development. What specific skills are you interested in developing?",
          sender: "bot",
          timestamp: new Date(Date.now() - 120000), // 2 minutes ago
        },
        {
          id: 4,
          text: "I want to get better at public speaking and also complete my industry certification. I feel like these would really help me advance.",
          sender: "user",
          timestamp: new Date(Date.now() - 60000), // 1 minute ago
        },
        {
          id: 5,
          text: "Those are excellent concrete goals! Public speaking skills will boost your confidence and visibility, while a certification validates your expertise. Have you started taking any steps toward these goals?",
          sender: "bot",
          timestamp: new Date(Date.now() - 10000), // 10 seconds ago
        },
      ];

      setMessages(mockMessages);
      console.log('[Chat Tour] Mock conversation loaded:', mockMessages.length, 'messages');
    }
  }, [tourActive, currentTourStep, messages.length]);

  // Tour mode: Auto-enable selection and show diary modal
  useEffect(() => {
    console.log('[Chat Tour] Effect triggered:', {
      tourActive,
      currentTourStep,
      isSelectMode,
      showDiaryModal,
      showPersonaSelector,
      messageCount: messages.length
    });

    if (!tourActive || !currentTourStep) return;
    if (currentTourStep.pageId !== 'chat') return;

    console.log('[Chat Tour] On correct page, step:', currentTourStep.stepIndex);

    // Step 2: Auto-open persona selector modal (after highlighting button in step 1)
    if (currentTourStep.stepIndex === 2 && !showPersonaSelector) {
      console.log('[Chat Tour] Step 2 - Auto-opening persona selector...');
      setTimeout(() => {
        setShowPersonaSelector(true);
      }, 300);
    }

    // Step 3 or later: Close persona selector if open (after "Meet Your Personas" step 2)
    if (currentTourStep.stepIndex >= 3 && showPersonaSelector) {
      console.log('[Chat Tour] Step 3+ - Auto-closing persona selector...');
      setTimeout(() => {
        setShowPersonaSelector(false);
      }, 300);
    }

    // Step 5: Auto-enable selection mode
    if (currentTourStep.stepIndex === 5 && !isSelectMode) {
      console.log('[Chat Tour] Step 5 - Auto-enabling selection mode...');
      setTimeout(() => {
        setIsSelectMode(true);
      }, 300);
    }

    // Step 6: Auto-select first 2 user messages
    if (currentTourStep.stepIndex === 6 && isSelectMode && selectedMessages.length === 0) {
      console.log('[Chat Tour] Step 6 - Auto-selecting messages...');
      setTimeout(() => {
        const userMessages = messages.filter(m => m.sender === 'user');
        console.log('[Chat Tour] Found user messages:', userMessages.length);
        if (userMessages.length >= 2) {
          setSelectedMessages([userMessages[0].id, userMessages[1].id]);
          console.log('[Chat Tour] Selected 2 messages');
        }
      }, 300);
    }

    // Step 7: Auto-click "Convert to Diary" button
    if (currentTourStep.stepIndex === 7 && selectedMessages.length > 0 && !showDiaryModal) {
      console.log('[Chat Tour] Step 7 - Auto-clicking Convert to Diary button...');
      setTimeout(() => {
        // Find and click the convert button
        const convertButton = document.querySelector('.convert-button');
        if (convertButton) {
          console.log('[Chat Tour] Convert button found, clicking...');
          convertButton.click();
        } else {
          console.error('[Chat Tour] Convert button not found!');
        }
      }, 500);
    }

    // Step 8: Diary modal should be open (modal opens from convert button click)
    // No action needed - modal opened by button click in step 7

    // Step 11 or later: Close diary modal if open (after "Save to Database" step 10)
    if (currentTourStep.stepIndex >= 11 && showDiaryModal) {
      console.log('[Chat Tour] Step 11+ - Auto-closing diary modal...');
      setTimeout(() => {
        setShowDiaryModal(false);
        clearSelection();
      }, 300);
    }
  }, [tourActive, currentTourStep, messages, isSelectMode, showDiaryModal, showPersonaSelector, selectedMessages, clearSelection]);

  // 대화 초기화 함수
  const resetMessages = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the conversation? This will clear all messages and start fresh."
      )
    ) {
      setMessages([
        {
          id: 1,
          text: "I am Reflecta, your personal reflection assistant. I'm here to help you with self-reflection, goal setting, and personal growth. What would you like to talk about today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
      setSelectedMessages([]);
      setIsSelectMode(false);
    }
  };

  // 일기 변환 함수
  const convertToDiary = async () => {
    if (selectedMessages.length === 0) return;

    setIsConvertingToDiary(true);

    try {
      const selectedMessagesData = messages.filter((msg) =>
        selectedMessages.includes(msg.id)
      );

      const conversationText = selectedMessagesData
        .map((msg) => `${msg.sender === "user" ? "You" : "AI"}: ${msg.text}`)
        .join("\n\n");

      // Call backend API to convert conversation to diary with goal mapping
      const response = await apiService.convertToDiary(conversationText);

      setDiaryContent(response.diaryContent);
      setGoalMapping(response.goalMapping);
      setShowDiaryModal(true);
      clearSelection();
    } catch (error) {
      console.error("Error converting to diary:", error);
      alert("Failed to convert conversation to diary. Please try again.");
    } finally {
      setIsConvertingToDiary(false);
    }
  };

  // 일기 저장 함수
  const saveDiary = async () => {
    try {
      // 현재 날짜를 기반으로 제목 생성 (YYYY-MM-DD 형식)
      const today = new Date();
      const dateString = today.toISOString().split("T")[0]; // YYYY-MM-DD 형식

      // convertToDiary에서 받은 Goal 매핑 정보 사용
      const diaryEntry = await apiService.saveJournalEntry({
        title: `Daily Reflection - ${dateString}`,
        content: diaryContent,
        mood: diaryMood,
        tags: ["AI Reflection", "Personal Growth", "Daily Reflection"],
        isAIGenerated: true,
        // convertToDiary에서 받은 Goal 매핑 정보 사용
        relatedGoalId: goalMapping?.relatedGoalId || null,
        relatedGoalType: goalMapping?.relatedGoalType || null,
      });

      // Also save to localStorage as backup
      const existingEntries = JSON.parse(
        localStorage.getItem("journalEntries") || "[]"
      );
      existingEntries.push(diaryEntry.entry);
      localStorage.setItem("journalEntries", JSON.stringify(existingEntries));

      // Add to global context for immediate update
      addJournalEntry(diaryEntry.entry);

      // Trigger refresh in Journal component
      triggerRefresh();

      // Automatically trigger risk detection for the saved entry
      try {
        await apiService.analyzeJournalRisk(diaryEntry.entry._id);
        console.log("Risk analysis completed for diary entry");
      } catch (riskError) {
        console.error("Risk analysis failed (non-critical):", riskError);
        // Don't block the save flow if risk analysis fails
      }

      // 대화 내용 초기화
      setMessages([]);
      setSelectedMessages([]);
      setIsSelectMode(false);

      setShowDiaryModal(false);
      setDiaryContent("");
      setDiaryMood("reflective");
      setGoalMapping(null);

      // 성공 메시지 표시
      alert("Diary saved successfully! Redirecting to Journal...");

      // Journal 페이지로 이동 (My Entries 탭으로)
      navigate("/journal?tab=entries");
    } catch (error) {
      console.error("Error saving diary:", error);
      alert("Failed to save diary entry. Please try again.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Check if we should use mock API or real API
      const useMockAPI = process.env.REACT_APP_MOCK_API === "true";

      if (useMockAPI) {
        // Mock API response for demonstration
        const mockResponses = [
          "That's a great reflection! How did that make you feel?",
          "I can see you're processing some important thoughts. What would you like to explore further?",
          "It sounds like you had an interesting experience. What did you learn from it?",
          "I appreciate you sharing that with me. How do you think this relates to your goals?",
          "That's a thoughtful observation. What would you like to focus on next?",
          "I can sense some growth in your thinking. What patterns do you notice?",
          "Thank you for being so open. What questions do you have about this?",
          "I'm here to help you reflect deeper. What aspects would you like to explore?",
          "That's a valuable insight. How might you apply this learning?",
          "I can see you're developing self-awareness. What's your next step?",
        ];

        // Simulate API delay
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 + Math.random() * 2000)
        );

        const randomResponse =
          mockResponses[Math.floor(Math.random() * mockResponses.length)];

        const botMessage = {
          id: Date.now() + 1,
          text: randomResponse,
          sender: "bot",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Delegate to backend-enhanced chat endpoint with selected persona
        const response = await apiService.sendEnhancedMessage(inputMessage, selectedPersonaId);
        const botResponse = response?.message ||
          "I'm here to reflect with you. Could you share a bit more?";

        // Update current persona info if returned
        if (response?.persona) {
          setCurrentPersona(response.persona);
        }

        const botMessage = {
          id: Date.now() + 1,
          text: botResponse,
          sender: "bot",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error:", error);

      let errorText =
        "I'm sorry, I'm having trouble connecting right now. Please try again later.";

      if (error.message.includes("Failed to fetch")) {
        errorText =
          "I'm having trouble connecting to the server. Please check your internet connection and try again.";
      } else if (error.message.toLowerCase().includes("access token")) {
        errorText =
          "Looks like you're logged out. Please sign in again so I can keep helping.";
      } else if (error.message.includes("401")) {
        errorText =
          "I lost my session. Please log in again to continue.";
      } else if (error.message.includes("429")) {
        errorText =
          "I'm receiving too many requests right now. Please wait a moment and try again.";
      }

      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonaSelect = async (personaId) => {
    try {
      setSelectedPersonaId(personaId);
      // Fetch full persona object to display icon and name
      const persona = await apiService.getPersona(personaId);
      setCurrentPersona(persona);
      setShowPersonaSelector(false);
    } catch (error) {
      console.error("Error loading persona:", error);
      // Still update ID even if fetch fails
      setSelectedPersonaId(personaId);
      setShowPersonaSelector(false);
    }
  };

  const formatTime = (timestamp) => {
    // Ensure timestamp is a Date object
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Reflection Assistant</h3>
        <p>Your personal AI companion for self-reflection and growth</p>
        <div className="chat-controls">
          {!isSelectMode ? (
            <>
              <button
                className="control-button persona-button"
                onClick={() => setShowPersonaSelector(true)}
                title="Choose AI Persona"
              >
                {currentPersona ? currentPersona.icon : "💜"} Persona
              </button>
              <button
                className="control-button select-button"
                onClick={() => setIsSelectMode(true)}
              >
                Select Messages
              </button>
              <button
                className="control-button reset-button"
                onClick={resetMessages}
              >
                Reset Messages
              </button>
            </>
          ) : (
            <div className="selection-controls">
              <button
                className="control-button select-all-button"
                onClick={selectAllMessages}
              >
                Select All
              </button>
              <button
                className="control-button convert-button"
                onClick={convertToDiary}
                disabled={selectedMessages.length === 0 || isConvertingToDiary}
              >
                {isConvertingToDiary
                  ? "Converting..."
                  : `Convert to Diary (${selectedMessages.length})`}
              </button>
              <button
                className="control-button cancel-button"
                onClick={clearSelection}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.sender === "user" ? "user-message" : "bot-message"
            } ${isSelectMode ? "selectable" : ""} ${
              selectedMessages.includes(message.id) ? "selected" : ""
            }`}
            onClick={() =>
              isSelectMode &&
              message.sender === "user" &&
              toggleMessageSelection(message.id)
            }
          >
            {isSelectMode && message.sender === "user" && (
              <div className="message-checkbox">
                <input
                  type="checkbox"
                  checked={selectedMessages.includes(message.id)}
                  onChange={() => toggleMessageSelection(message.id)}
                />
              </div>
            )}
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="chat-input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about your goals, thoughts, or reflections..."
            className="chat-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="chat-send-button"
            disabled={!inputMessage.trim() || isLoading}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
            </svg>
          </button>
        </div>
      </form>

      {/* 일기 편집 모달 */}
      {showDiaryModal && (
        <div className="diary-modal-overlay">
          <div className="diary-modal">
            <div className="diary-modal-header">
              <h3>Edit Your Diary Entry</h3>
              <button
                className="close-button"
                onClick={() => setShowDiaryModal(false)}
              >
                ×
              </button>
            </div>
            <div className="diary-modal-content">
              <div className="ai-mapping-notice">
                <p>
                  🤖 AI will automatically analyze your diary content and
                  connect it to relevant goals if any are found.
                </p>
                <p>
                  📝 <strong>Note:</strong> This diary entry is based on your
                  actual conversation. AI will not add or invent any information
                  you didn't share.
                </p>
              </div>

              <div className="diary-mood-selector">
                <label htmlFor="diary-mood">How are you feeling?</label>
                <select
                  id="diary-mood"
                  value={diaryMood}
                  onChange={(e) => setDiaryMood(e.target.value)}
                  className="diary-mood-select"
                >
                  <option value="happy">😊 Happy</option>
                  <option value="excited">🤩 Excited</option>
                  <option value="calm">😌 Calm</option>
                  <option value="reflective">🤔 Reflective</option>
                  <option value="neutral">😐 Neutral</option>
                  <option value="anxious">😰 Anxious</option>
                  <option value="sad">😢 Sad</option>
                  <option value="grateful">🙏 Grateful</option>
                  <option value="stressed">😫 Stressed</option>
                  <option value="angry">😠 Angry</option>
                </select>
              </div>

              <textarea
                value={diaryContent}
                onChange={(e) => setDiaryContent(e.target.value)}
                className="diary-textarea"
                placeholder="Edit your diary entry here..."
                rows={15}
              />
            </div>
            <div className="diary-modal-actions">
              <button
                className="cancel-button"
                onClick={() => setShowDiaryModal(false)}
              >
                Cancel
              </button>
              <button className="save-button" onClick={saveDiary}>
                Save to Journal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persona Selector Modal */}
      <PersonaSelector
        isOpen={showPersonaSelector}
        onClose={() => setShowPersonaSelector(false)}
        currentPersonaId={selectedPersonaId}
        onSelectPersona={handlePersonaSelect}
      />

      {/* Page Tour for Chat */}
      <PageTour
        page="chat"
        navigateToNext="dashboard"
        pageTotalSteps={12}
        pageStartStep={9}
        automationStates={{ showDiaryModal }}
        steps={[
          {
            icon: "💬",
            title: "Welcome to AI Chat & Journaling!",
            description: "This is where reflection becomes natural conversation. Chat with our AI about your day, your thoughts, your progress - then convert those meaningful conversations into structured journal entries that map to your goals.",
            selector: null,
          },
          {
            icon: "🎭",
            title: "Choose Your AI Companion",
            description: "Click the persona button to select which AI companion you'd like to chat with. Each persona has a unique personality and communication style.",
            selector: ".control-button.persona-button",
          },
          {
            icon: "👥",
            title: "Meet Your Personas",
            description: "Watch as the persona selection modal opens! You can choose from 'Growth Mentor' for motivational support, 'Empathetic Listener' for emotional validation, 'Thoughtful Guide' for balanced reflection, or 'Analytical Coach' for structured thinking.",
            selector: null,
            automationDelay: 300, // Wait for persona modal to open
          },
          {
            icon: "✍️",
            title: "Type Your Message",
            description: "Start a conversation! Share what's on your mind - progress updates, challenges you're facing, insights you've gained, or questions about your goals. The AI will engage thoughtfully and help you reflect deeper.",
            selector: ".chat-input",
          },
          {
            icon: "🤖",
            title: "AI Responds Thoughtfully",
            description: "The AI responds with empathy and insight! You can discuss anything - daily events, relationships, hobbies, challenges at work. While the AI is aware of your goals, conversations don't have to focus on them. It's about authentic reflection on your life.",
            selector: ".chat-messages",
          },
          {
            icon: "☑️",
            title: "Select Messages",
            description: "After chatting, click 'Select Messages' to choose which parts of your conversation you want to save as a journal entry. Not every message needs to be saved - pick the most meaningful insights and reflections.",
            selector: ".control-button.select-button",
            automationDelay: 300, // Wait for selection mode to enable
          },
          {
            icon: "✅",
            title: "Choose Your Messages",
            description: "Checkboxes appear next to each message! Click to select the messages that capture important moments, breakthroughs, or reflections worth preserving. You can select as many or as few as you like.",
            selector: ".message-checkbox",
            waitForElement: true,
            automationDelay: 300, // Wait for message auto-selection
          },
          {
            icon: "📔",
            title: "Convert to Diary",
            description: "Once you've selected messages, click 'Convert to Diary'. Our AI will transform your conversation into a well-structured journal entry with a clear narrative flow. It's like having a personal editor!",
            selector: null,
            automationDelay: 500, // Initial delay, but will also monitor API state
            requiresStateMonitoring: true, // Special flag for API call steps
          },
          {
            icon: "😊",
            title: "Set Your Mood",
            description: "In the diary modal, choose the mood that best reflects how you felt during this experience. Moods help track your emotional patterns over time and appear in your analytics visualizations.",
            selector: ".diary-mood-selector",
            waitForElement: true,
          },
          {
            icon: "🎯",
            title: "Automatic Goal Mapping",
            description: "Here's the magic: our AI automatically analyzes your journal entry and links it to relevant goals from your Mandalart! It identifies which sub-goals and tasks your reflection relates to. This connection powers all your progress insights.",
            selector: ".diary-textarea",
            waitForElement: true,
          },
          {
            icon: "💾",
            title: "Save to Database",
            description: "Click 'Save to Journal' and your entry is permanently stored with all its goal mappings! It becomes part of your reflection history and contributes to AI-generated summaries, word clouds, and progress analytics.",
            selector: ".save-button",
            waitForElement: true,
          },
          {
            icon: "📊",
            title: "Next: See Your Insights!",
            description: "Now that you've journaled, head to the Dashboard to see the power of your reflections! View AI-generated summaries, distinctive word clouds for each sub-goal, emotional journey charts, and track how your journaling connects to goal progress.",
            selector: null,
          },
        ]}
      />

      {/* Help Button for demo users */}
      {user?.email === 'demo@reflecta.com' && (
        <HelpButton page="chat" />
      )}
    </div>
  );
};

export default Chat;
