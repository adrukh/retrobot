const { safeSendDM } = require('./slack');
const SessionManager = require('../managers/SessionManager');

// DM conversation functions
async function sendInitialDM(client, userId, session, moderatorId, channelId) {
  const introText = `👋 Hi! I'm retrobot.

<@${moderatorId}> just started a ${session.questionSet} agenda session in <#${channelId}> and I'm here to collect your input privately.

Here's how this works:
• I'll ask you ${session.questions.length} questions, one at a time
• Send me your thoughts (one per message) 
• Reply 'done' when finished with each question
• You can skip any question by just saying 'done'
• Type 'start over' anytime to restart from the beginning

Ready? Let's begin!

---

Question 1/${session.questions.length}: ${session.questions[0]}
Send me your thoughts and reply 'done' when finished.`;

  return await safeSendDM(client, userId, {
    text: introText
  });
}

async function sendQuestionDM(client, userId, questionIndex, totalQuestions, question) {
  const questionText = `Question ${questionIndex + 1}/${totalQuestions}: ${question}
Send me your thoughts and reply 'done' when finished.`;

  return await safeSendDM(client, userId, {
    text: questionText
  });
}

async function sendCompletionDM(client, userId, responses, questions) {
  const activeSession = SessionManager.getSession();
  let summaryText = '🎉 All done! Here\'s what I recorded:\n\n';
  
  for (let i = 0; i < questions.length; i++) {
    const questionResponses = responses[i];
    if (questionResponses && questionResponses.length > 0) {
      summaryText += `✅ ${questions[i]}: ${questionResponses.length} answer${questionResponses.length > 1 ? 's' : ''}\n`;
      questionResponses.forEach(response => {
        summaryText += `• "${response}"\n`;
      });
    } else {
      summaryText += `⏭️ ${questions[i]}: 0 answers (skipped)\n`;
    }
    summaryText += '\n';
  }

  summaryText += `Your responses have been submitted! Head back to <#${activeSession.channelId}> for the next steps.`;

  return await safeSendDM(client, userId, {
    text: summaryText
  });
}

module.exports = {
  sendInitialDM,
  sendQuestionDM,
  sendCompletionDM
};