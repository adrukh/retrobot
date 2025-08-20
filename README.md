# retrobot 🤖

A Slack bot that helps teams conduct organized retrospectives and discussions by collecting input privately and facilitating structured voting.

## How It Works

retrobot streamlines team discussions by:
1. **Private Collection** - Gathers input from team members via DM to encourage honest feedback
2. **Anonymous Options** - Protects psychological safety with optional anonymous responses  
3. **Structured Voting** - Posts all responses for team voting with emoji reactions
4. **Prioritized Results** - Surfaces top-voted topics for focused discussion

## Getting Started

**First time setup?** See [SETUP.md](SETUP.md) for complete installation and configuration instructions.

### Invite retrobot to Your Channel
```
/invite @retrobot
```

### Basic Commands

#### Start a Session
```
@retrobot start retrospective
```
Begins collecting responses to standard retrospective questions.

#### Check Progress  
```
@retrobot status
```
See who has completed, is in progress, or hasn't started responding.

#### Present for Voting
```
@retrobot present
```
Posts all collected responses to the channel for team voting.

#### View Results
```
@retrobot summarize
```
Shows top-voted topics ready for discussion.

#### Reset Session
```
@retrobot reset
```
Cancel the current session and clear all responses to start fresh.

## Question Sets

### Retrospective (Default)
- What went well this sprint?
- What could be improved?
- What should we start doing?

### Other Built-in Sets
Check available question sets:
```
@retrobot help
```

## Usage Examples

### Standard Retrospective
```
@retrobot start retrospective
```
1. Bot DMs each team member the questions
2. Team members respond privately via DM
3. Use `@retrobot present` when ready to share responses
4. Team votes with emoji reactions (👍 🔥 📈)
5. Use `@retrobot summarize` to see top-voted items

If you need to cancel and start over, use `@retrobot reset` to clear everything.

### Anonymous Session
```
@retrobot start retrospective --anonymous
```
Same flow as above, but responses are posted without names to encourage honest feedback.

### Custom Questions
```
@retrobot start custom "What's blocking us?" "What tools do we need?"
```
Create a session with your own questions (use quotes for multi-word questions).

## The Response Flow

1. **DM Conversation**: retrobot asks each question individually
2. **Multiple Responses**: Send multiple messages for each question
3. **Move Forward**: Type "done" when finished with current question  
4. **Restart Option**: Type "start over" anytime to restart from beginning
5. **Skip Questions**: Just type "done" without responding to skip

### Example DM Flow
```
retrobot: Question 1/3: What went well this sprint?
You: The new deployment pipeline worked great
You: Team collaboration was excellent
You: done

retrobot: Question 2/3: What could be improved?
You: Need better test coverage
You: done
```

## Voting & Results

After presenting responses:
- React with 👍 🔥 📈 to vote on items
- Higher vote counts = higher priority for discussion
- Use `@retrobot summarize` to see ranked results
- Optionally specify top N items: `@retrobot summarize --top 5`

## Privacy & Permissions

### What retrobot Can Access
- Channel member lists (to know who to DM)
- User profiles (to filter out bots)
- Send DMs and channel messages
- Read emoji reactions for voting

### What retrobot Cannot Access  
- Your private messages with others
- Channels it hasn't been invited to
- Historical messages or content

### Anonymous Mode
When using `--anonymous`, participant names are hidden from responses but retrobot still needs to track who responded to avoid duplicates.

## Tips for Success

1. **Set Expectations**: Let your team know a session is starting
2. **Wait for Responses**: Check `@retrobot status` before presenting
3. **Encourage Participation**: Remind team members to check their DMs
4. **Vote Thoughtfully**: Help prioritize the most important discussion topics
5. **Follow Through**: Use the results to drive actual improvements

## Troubleshooting

**Bot not responding?**
- Make sure retrobot is invited to your channel: `/invite @retrobot`

**Not receiving DMs?** 
- Check your Slack notification settings allow DMs from apps

**Missing responses?**
- Some team members may have DMs from apps disabled
- Check `@retrobot status` to see who hasn't responded

**Need to start over?**
```
@retrobot reset
```

**Need help?**
```
@retrobot help
```

---

Ready to improve your team retrospectives? Start with `@retrobot hello` to test the bot!