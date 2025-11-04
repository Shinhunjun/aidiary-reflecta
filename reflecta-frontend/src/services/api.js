const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

class ApiService {
  constructor() {
    this.token = localStorage.getItem("authToken");
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Auth methods
  async register(userData) {
    const response = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async registerCounselor(userData) {
    const response = await this.request("/auth/register-counselor", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async login(credentials) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  logout() {
    this.setToken(null);
  }

  // Goals methods
  async getGoals() {
    return this.request("/goals");
  }

  async saveGoals(mandalartData) {
    return this.request("/goals", {
      method: "POST",
      body: JSON.stringify({ mandalartData }),
    });
  }

  // Journal methods
  async getJournalEntries() {
    return this.request("/journal");
  }

  async getJournalEntry(id) {
    return this.request(`/journal/${id}`);
  }

  async saveJournalEntry(entryData) {
    return this.request("/journal", {
      method: "POST",
      body: JSON.stringify(entryData),
    });
  }

  // Chat methods
  async getChatSession() {
    return this.request("/chat");
  }

  async saveChatSession(messages) {
    return this.request("/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
  }

  async sendEnhancedMessage(message, personaId = null) {
    return this.request("/chat/enhanced", {
      method: "POST",
      body: JSON.stringify({ message, personaId }),
    });
  }

  async generateGoalSuggestions(suggestionInput) {
    return this.request("/goals/ai-suggestions", {
      method: "POST",
      body: JSON.stringify(suggestionInput),
    });
  }

  // Goal Progress methods
  async getGoalProgress(goalId) {
    return this.request(`/goals/${goalId}/progress`);
  }

  async saveGoalProgress(goalId, progressData) {
    return this.request(`/goals/${goalId}/progress`, {
      method: "POST",
      body: JSON.stringify(progressData),
    });
  }

  async getGoalProgressSummary(goalId, period = "weekly") {
    const params = new URLSearchParams({ period });
    return this.request(`/goals/${goalId}/progress/summary?${params.toString()}`);
  }

  async getGoalProgressAnalytics(goalId) {
    return this.request(`/goals/${goalId}/progress/analytics`);
  }

  async getGoalProgressInsights(goalId) {
    return this.request(`/goals/${goalId}/progress/insights`);
  }

  async getGoalEmotionalJourney(goalId) {
    return this.request(`/goals/${goalId}/emotional-journey`);
  }

  async getGoalNarrativeTimeline(goalId) {
    return this.request(`/goals/${goalId}/narrative-timeline`);
  }

  // Goal Related Journal methods
  async getGoalJournals(goalId) {
    return this.request(`/goals/${goalId}/journals`);
  }

  async getGoalWordCloud(goalId, timeRange = 'all') {
    const params = new URLSearchParams({ timeRange });
    return this.request(`/goals/${goalId}/wordcloud?${params.toString()}`);
  }

  async getGoalJournalSummary(goalId) {
    return this.request(`/goals/${goalId}/journals/summary`);
  }

  async getGoalChildrenSummary(goalId) {
    return this.request(`/goals/${goalId}/children/summary`);
  }

  // Convert conversation to diary with goal mapping
  async convertToDiary(conversationText) {
    return this.request("/convert-to-diary", {
      method: "POST",
      body: JSON.stringify({ conversationText }),
    });
  }

  // GPT-based Goal Mapping
  async analyzeGoalMapping(diaryContent) {
    return this.request("/analyze-goal-mapping", {
      method: "POST",
      body: JSON.stringify({ diaryContent }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request("/health");
  }

  // Privacy Settings methods
  async getPrivacySettings() {
    return this.request("/privacy-settings");
  }

  async updatePrivacySettings(settings) {
    return this.request("/privacy-settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async getCounselors() {
    return this.request("/counselors");
  }

  // Counselor Dashboard methods
  async getCounselorAlerts(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/counselor/alerts?${params.toString()}`);
  }

  async getAlertDetails(alertId) {
    return this.request(`/counselor/alerts/${alertId}`);
  }

  async updateAlertStatus(alertId, status, followUpDate = null) {
    return this.request(`/counselor/alerts/${alertId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, followUpDate }),
    });
  }

  async addCounselorNote(alertId, note, action = null) {
    return this.request(`/counselor/alerts/${alertId}/notes`, {
      method: "POST",
      body: JSON.stringify({ note, action }),
    });
  }

  async getStudentOverview(studentId) {
    return this.request(`/counselor/students/${studentId}`);
  }

  // Risk Analysis methods
  async analyzeJournalRisk(entryId) {
    return this.request(`/journal/${entryId}/analyze-risk`, {
      method: "POST",
    });
  }

  async analyzeMoodPatterns() {
    return this.request("/analyze-mood-patterns", {
      method: "POST",
    });
  }

  // Persona methods
  async getPersonas() {
    return this.request("/personas");
  }

  async getPersona(personaId) {
    return this.request(`/personas/${personaId}`);
  }

  async createPersona(personaData) {
    return this.request("/personas", {
      method: "POST",
      body: JSON.stringify(personaData),
    });
  }

  async updatePersona(personaId, personaData) {
    return this.request(`/personas/${personaId}`, {
      method: "PUT",
      body: JSON.stringify(personaData),
    });
  }

  async deletePersona(personaId) {
    return this.request(`/personas/${personaId}`, {
      method: "DELETE",
    });
  }
}

export default new ApiService();
