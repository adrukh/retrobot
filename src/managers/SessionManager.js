const fs = require('fs');
const path = require('path');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8'));

// Global session state - only one session at a time
let activeSession = null;

class SessionManager {
  static createSession(channelId, moderatorId, questionSet, anonymous = false) {
    if (activeSession) {
      throw new Error(`Active session already exists in <#${activeSession.channelId}>`);
    }

    const questions = this.getQuestions(questionSet);
    activeSession = {
      id: `session_${Date.now()}`,
      channelId,
      moderatorId,
      questionSet,
      questions,
      anonymous,
      status: 'collecting', // collecting -> voting -> completed
      responses: new Map(), // userId -> array of responses
      totalParticipants: 0, // Will be set when session starts
      createdAt: new Date()
    };

    return activeSession;
  }

  static getSession() {
    return activeSession;
  }

  static endSession() {
    activeSession = null;
  }

  static getQuestions(questionSet) {
    if (questionSet === 'custom') {
      throw new Error('Custom questions require explicit question array');
    }

    if (questionSet && config.questionSets[questionSet]) {
      return config.questionSets[questionSet];
    }

    // Default to retrospective
    return config.questionSets.retrospective;
  }

  static parseCustomQuestions(args) {
    // Extract quoted strings from args
    const questions = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('"') && arg.endsWith('"') && arg.length > 1) {
        questions.push(arg.slice(1, -1));
      } else if (arg.startsWith('"')) {
        current = arg.slice(1);
        inQuotes = true;
      } else if (arg.endsWith('"') && inQuotes) {
        current += ' ' + arg.slice(0, -1);
        questions.push(current);
        current = '';
        inQuotes = false;
      } else if (inQuotes) {
        current += ' ' + arg;
      }
    }

    return questions;
  }

  static getAvailableQuestionSets() {
    return Object.keys(config.questionSets);
  }

  static allResponsesCollected() {
    if (!activeSession) return false;
    
    const completedCount = activeSession.responses.size;
    return completedCount >= activeSession.totalParticipants;
  }
}

module.exports = SessionManager;