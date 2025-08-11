const SessionManager = require('../managers/SessionManager');

async function autoPresent(client) {
  const activeSession = SessionManager.getSession();
  if (!activeSession || activeSession.status !== 'collecting') return;
  
  const channelId = activeSession.channelId;
  
  // Change session status
  activeSession.status = 'voting';

  // Group responses by question
  const responsesByQuestion = new Map();
  for (let i = 0; i < activeSession.questions.length; i++) {
    responsesByQuestion.set(i, []);
  }

  // Collect all responses grouped by question
  for (const [userId, userResponses] of activeSession.responses) {
    for (const response of userResponses) {
      responsesByQuestion.get(response.questionIndex).push({
        userId,
        answer: response.answer,
        question: response.question
      });
    }
  }

  // Store message timestamps for vote tracking
  activeSession.votingMessages = [];

  // Post header message
  await client.chat.postMessage({
    channel: channelId,
    text: '📋 All responses collected! Automatically presenting for voting. React with 👍 🔥 📈 to vote on individual items:'
  });

  // Post each response as a separate message for individual voting
  for (let i = 0; i < activeSession.questions.length; i++) {
    const responses = responsesByQuestion.get(i);
    if (responses.length > 0) {
      // Post question header
      await client.chat.postMessage({
        channel: channelId,
        text: `**${activeSession.questions[i]}**`
      });
      
      // Post each response as separate message
      for (const response of responses) {
        const attribution = activeSession.anonymous ? '' : ` - <@${response.userId}>`;
        const result = await client.chat.postMessage({
          channel: channelId,
          text: `"${response.answer}"${attribution}`
        });
        
        // Store message info for vote counting
        activeSession.votingMessages.push({
          ts: result.ts,
          questionIndex: i,
          question: activeSession.questions[i],
          answer: response.answer,
          userId: response.userId
        });
        
        // Add initial reaction options to each response
        const reactionEmojis = ['thumbsup', 'fire', 'chart_with_upwards_trend'];
        for (const emoji of reactionEmojis) {
          try {
            await client.reactions.add({
              channel: channelId,
              timestamp: result.ts,
              name: emoji
            });
          } catch (error) {
            console.error(`Failed to add reaction ${emoji} to message ${result.ts}:`, error);
          }
        }
      }
    }
  }
}

async function presentResponses(client, channelId) {
  const activeSession = SessionManager.getSession();
  if (!activeSession) {
    throw new Error('No active retro session. Use `/retro start` first.');
  }

  if (activeSession.channelId !== channelId) {
    throw new Error(`Active session is in <#${activeSession.channelId}>. Use commands from there.`);
  }

  if (activeSession.status !== 'collecting') {
    throw new Error('Session is not in collecting phase.');
  }

  // Change session status
  activeSession.status = 'voting';

  // Group responses by question
  const responsesByQuestion = new Map();
  for (let i = 0; i < activeSession.questions.length; i++) {
    responsesByQuestion.set(i, []);
  }

  // Collect all responses grouped by question
  for (const [userId, userResponses] of activeSession.responses) {
    for (const response of userResponses) {
      responsesByQuestion.get(response.questionIndex).push({
        userId,
        answer: response.answer,
        question: response.question
      });
    }
  }

  // Check if any responses exist
  let hasResponses = false;
  for (const responses of responsesByQuestion.values()) {
    if (responses.length > 0) {
      hasResponses = true;
      break;
    }
  }

  if (!hasResponses) {
    throw new Error('No responses collected yet. Wait for participants to reply via DM.');
  }

  // Store message timestamps for vote tracking
  activeSession.votingMessages = [];

  // Post header message
  await client.chat.postMessage({
    channel: channelId,
    text: '📋 Responses ready for voting! React with 👍 🔥 📈 to vote on individual items:'
  });

  // Post each response as a separate message for individual voting
  for (let i = 0; i < activeSession.questions.length; i++) {
    const responses = responsesByQuestion.get(i);
    if (responses.length > 0) {
      // Post question header
      await client.chat.postMessage({
        channel: channelId,
        text: `**${activeSession.questions[i]}**`
      });
      
      // Post each response as separate message
      for (const response of responses) {
        const attribution = activeSession.anonymous ? '' : ` - <@${response.userId}>`;
        const result = await client.chat.postMessage({
          channel: channelId,
          text: `"${response.answer}"${attribution}`
        });
        
        // Store message info for vote counting
        activeSession.votingMessages.push({
          ts: result.ts,
          questionIndex: i,
          question: activeSession.questions[i],
          answer: response.answer,
          userId: response.userId
        });
        
        // Add initial reaction options to each response
        const reactionEmojis = ['thumbsup', 'fire', 'chart_with_upwards_trend'];
        for (const emoji of reactionEmojis) {
          try {
            await client.reactions.add({
              channel: channelId,
              timestamp: result.ts,
              name: emoji
            });
          } catch (error) {
            console.error(`Failed to add reaction ${emoji} to message ${result.ts}:`, error);
          }
        }
      }
    }
  }
}

async function summarizeVotes(client, channelId, topCount = 3) {
  const activeSession = SessionManager.getSession();
  if (!activeSession) {
    throw new Error('No active retro session. Use `/retro start` first.');
  }

  if (activeSession.channelId !== channelId) {
    throw new Error(`Active session is in <#${activeSession.channelId}>. Use commands from there.`);
  }

  if (activeSession.status !== 'voting') {
    throw new Error('Session is not in voting phase. Use `/retro present` first.');
  }

  let messageText = '🏆 Top Voted Topics for Discussion:\n\n';

  // Get reactions from each voting message
  const votedResponses = [];
  
  for (const votingMsg of activeSession.votingMessages) {
    try {
      const reactionsResult = await client.reactions.get({
        channel: channelId,
        timestamp: votingMsg.ts
      });

      // Count reactions by type (excluding bot reactions)
      let totalVotes = 0;
      let reactionBreakdown = {};
      
      if (reactionsResult.message && reactionsResult.message.reactions) {
        for (const reaction of reactionsResult.message.reactions) {
          // Subtract 1 to exclude the bot's own reaction
          const userVotes = Math.max(0, reaction.count - 1);
          totalVotes += userVotes;
          
          if (userVotes > 0) {
            reactionBreakdown[reaction.name] = userVotes;
          }
        }
      }

      // Add this response with its vote count and breakdown
      votedResponses.push({
        questionIndex: votingMsg.questionIndex,
        question: votingMsg.question,
        answer: votingMsg.answer,
        userId: votingMsg.userId,
        votes: totalVotes,
        reactionBreakdown
      });
    } catch (error) {
      console.error('Error getting reactions for message:', votingMsg.ts, error);
      // Add with 0 votes if we can't get reactions
      votedResponses.push({
        questionIndex: votingMsg.questionIndex,
        question: votingMsg.question,
        answer: votingMsg.answer,
        userId: votingMsg.userId,
        votes: 0,
        reactionBreakdown: {}
      });
    }
  }

  // Group responses by question
  const responsesByQuestion = new Map();
  for (let i = 0; i < activeSession.questions.length; i++) {
    responsesByQuestion.set(i, []);
  }

  for (const response of votedResponses) {
    responsesByQuestion.get(response.questionIndex).push(response);
  }

  // Sort and show top responses for each question
  for (let i = 0; i < activeSession.questions.length; i++) {
    const responses = responsesByQuestion.get(i);
    if (responses.length > 0) {
      // Sort by vote count
      responses.sort((a, b) => b.votes - a.votes);
      
      messageText += `**${activeSession.questions[i]}**\n`;
      const topResponses = responses.slice(0, topCount);
      
      topResponses.forEach((response, index) => {
        const attribution = activeSession.anonymous ? '' : ` - <@${response.userId}>`;
        
        // Build reaction breakdown display
        let voteText = `(${response.votes} votes`;
        if (response.reactionBreakdown && Object.keys(response.reactionBreakdown).length > 0) {
          const breakdownParts = [];
          if (response.reactionBreakdown.thumbsup || response.reactionBreakdown['+1']) {
            breakdownParts.push(`👍${response.reactionBreakdown.thumbsup || response.reactionBreakdown['+1']}`);
          }
          if (response.reactionBreakdown.fire) {
            breakdownParts.push(`🔥${response.reactionBreakdown.fire}`);
          }
          if (response.reactionBreakdown.chart_with_upwards_trend || response.reactionBreakdown.chart_increasing) {
            breakdownParts.push(`📈${response.reactionBreakdown.chart_with_upwards_trend || response.reactionBreakdown.chart_increasing}`);
          }
          // Add any other reactions
          for (const [emoji, count] of Object.entries(response.reactionBreakdown)) {
            if (!['thumbsup', '+1', 'fire', 'chart_with_upwards_trend', 'chart_increasing'].includes(emoji)) {
              breakdownParts.push(`:${emoji}:${count}`);
            }
          }
          if (breakdownParts.length > 0) {
            voteText += `: ${breakdownParts.join(' ')}`;
          }
        }
        voteText += ')';
        
        messageText += `${index + 1}. "${response.answer}"${attribution} ${voteText}\n`;
      });
      messageText += '\n';
    }
  }

  messageText += '---\n🎯 Session complete! Ready for discussion.';

  return messageText;
}

module.exports = {
  autoPresent,
  presentResponses,
  summarizeVotes
};