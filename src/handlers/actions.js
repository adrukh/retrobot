const DMStateManager = require('../managers/DMStateManager');
const { sendQuestionDM } = require('../services/dm');

// Handle button interactions
async function handleStartOver({ ack, body, client }) {
  await ack();
  
  const userId = body.user.id;
  const userState = DMStateManager.getUserState(userId);
  
  if (userState) {
    DMStateManager.restartUser(userId);
    await sendQuestionDM(client, userId, 0, userState.questions.length, userState.questions[0]);
  }
}

module.exports = {
  handleStartOver
};