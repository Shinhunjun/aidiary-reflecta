import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useJournal } from "../contexts/JournalContext";
import apiService from "../services/api";
import PersonaSelector from "./PersonaSelector";
import "./Chat.css";

const Chat = () => {
  const { user } = useAuth();
  const { addJournalEntry, triggerRefresh } = useJournal();
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

  const handlePersonaSelect = (personaId) => {
    setSelectedPersonaId(personaId);
    setShowPersonaSelector(false);
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
    </div>
  );
};

export default Chat;
