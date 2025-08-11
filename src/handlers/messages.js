const DMStateManager = require('../managers/DMStateManager');
const { sendQuestionDM, sendCompletionDM } = require('../services/dm');

// Handle DM messages
async function handleDMMessage({ message, client }) {
  // Only handle DM messages (not channel messages)
  if (message.channel_type !== 'im' || message.bot_id) return;

  const userId = message.user;
  const text = message.text.toLowerCase().trim();
  
  // Check if user is part of an active session
  const userState = DMStateManager.getUserState(userId);
  if (!userState) {
    // Send help message for users not in an active session
    await client.chat.postMessage({
      channel: userId,
      text: `👋 Hi! I'm retrobot, a Slack bot for team retrospectives.

To start using me:
1. Invite me to a channel: \`/invite @retrobot\`
2. Mention me: \`@retrobot start retrospective\` in that channel
3. I'll DM everyone to collect their responses privately
4. Responses get posted for team voting automatically

Mention me with \`@retrobot help\` in any channel for more commands and options.

*I only respond to DMs during active retrospective sessions.*`
    });
    return;
  }

  // Handle control commands
  if (text === 'start over' || text === 'restart') {
    DMStateManager.restartUser(userId);
    await sendQuestionDM(client, userId, 0, userState.questions.length, userState.questions[0]);
    return;
  }

  if (text === 'done' || text === 'next' || text === 'finished') {
    // Move to next question
    await DMStateManager.nextQuestion(userId, client);
    const updatedState = DMStateManager.getUserState(userId);
    
    if (updatedState.completed) {
      // All questions complete
      await sendCompletionDM(client, userId, updatedState.responses, updatedState.questions);
    } else {
      // Send next question
      const currentQ = updatedState.currentQuestion;
      await client.chat.postMessage({
        channel: userId,
        text: `✅ Recorded ${updatedState.responses[currentQ - 1].length} answers for "${updatedState.questions[currentQ - 1]}"`
      });
      
      await sendQuestionDM(client, userId, currentQ, updatedState.questions.length, updatedState.questions[currentQ]);
    }
    return;
  }

  // Handle regular response
  if (userState.completed) {
    await client.chat.postMessage({
      channel: userId,
      text: '✅ You\'ve already completed all questions. Your responses have been submitted!'
    });
    return;
  }

  // Add response to current question
  DMStateManager.addResponse(userId, message.text);
  
  // Send confirmation
  const currentResponses = userState.responses[userState.currentQuestion];
  await client.chat.postMessage({
    channel: userId,
    text: `✅ Got it! (${currentResponses.length} answers so far); keep answering or type 'done' to move on`
  });
}

module.exports = {
  handleDMMessage
};