const SessionManager = require('./SessionManager');

// User DM states for multi-message conversations
const userDMStates = new Map();

class DMStateManager {
  static initializeUser(userId, questions) {
    userDMStates.set(userId, {
      currentQuestion: 0,
      responses: Array(questions.length).fill(null).map(() => []),
      questions,
      completed: false
    });
  }

  static getUserState(userId) {
    return userDMStates.get(userId);
  }

  static addResponse(userId, response) {
    const state = userDMStates.get(userId);
    if (!state) return false;

    state.responses[state.currentQuestion].push(response);
    return true;
  }

  static async nextQuestion(userId, client) {
    const state = userDMStates.get(userId);
    if (!state) return false;

    state.currentQuestion++;
    if (state.currentQuestion >= state.questions.length) {
      state.completed = true;
      await this.saveUserResponses(userId, client);
    }
    return true;
  }

  static restartUser(userId) {
    const state = userDMStates.get(userId);
    if (!state) return false;

    state.currentQuestion = 0;
    state.responses = Array(state.questions.length).fill(null).map(() => []);
    state.completed = false;
    return true;
  }

  static async saveUserResponses(userId, client) {
    const state = userDMStates.get(userId);
    const activeSession = SessionManager.getSession();
    if (!state || !activeSession) return;

    // Flatten responses into session format
    const userResponses = [];
    for (let i = 0; i < state.questions.length; i++) {
      const questionResponses = state.responses[i];
      questionResponses.forEach(response => {
        userResponses.push({
          questionIndex: i,
          question: state.questions[i],
          answer: response
        });
      });
    }

    activeSession.responses.set(userId, userResponses);
    
    // Check if all responses are collected and auto-present
    if (SessionManager.allResponsesCollected()) {
      try {
        // Import autoPresent to avoid circular dependency
        const { autoPresent } = require('../services/voting');
        await autoPresent(client);
      } catch (error) {
        console.error('Auto-present failed:', error);
      }
    }
  }

  static getCompletedUsers() {
    const completed = [];
    for (const [userId, state] of userDMStates) {
      if (state.completed) {
        completed.push(userId);
      }
    }
    return completed;
  }

  static getInProgressUsers() {
    const inProgress = [];
    for (const [userId, state] of userDMStates) {
      if (!state.completed && state.currentQuestion > 0) {
        inProgress.push(userId);
      }
    }
    return inProgress;
  }

  static getNotStartedUsers(allUsers) {
    const started = new Set(userDMStates.keys());
    return allUsers.filter(userId => !started.has(userId));
  }

  static clear() {
    userDMStates.clear();
  }

  static delete(userId) {
    userDMStates.delete(userId);
  }
}

module.exports = DMStateManager;