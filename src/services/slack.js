const app = require('../slack');

// Utility functions for Slack API calls
async function getChannelMembers(channelId) {
  try {
    const result = await app.client.conversations.members({
      token: process.env.SLACK_BOT_TOKEN,
      channel: channelId
    });
    
    if (!result.members || result.members.length === 0) {
      throw new Error('No members found in channel or bot lacks permissions');
    }
    
    // Filter out bots
    const members = [];
    for (const userId of result.members) {
      try {
        const userInfo = await app.client.users.info({
          token: process.env.SLACK_BOT_TOKEN,
          user: userId
        });
        if (!userInfo.user.is_bot && !userInfo.user.deleted) {
          members.push(userId);
        }
      } catch (error) {
        console.error(`Error getting user info for ${userId}:`, error);
        // Skip this user but continue with others
      }
    }
    
    if (members.length === 0) {
      throw new Error('No active human members found in channel');
    }
    
    return members;
  } catch (error) {
    console.error('Error getting channel members:', error);
    throw new Error(`Failed to get channel members: ${error.message}`);
  }
}

// Error handling wrapper for DM sending
async function safeSendDM(client, userId, message) {
  try {
    await client.chat.postMessage({
      channel: userId,
      ...message
    });
    return true;
  } catch (error) {
    console.error(`Failed to send DM to ${userId}:`, error);
    return false;
  }
}

module.exports = {
  getChannelMembers,
  safeSendDM
};