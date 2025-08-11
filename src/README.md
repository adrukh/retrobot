# retrobot - Refactored Codebase

This directory contains the refactored retrobot codebase, broken down from a single 989-line file into focused modules.

## Directory Structure

```
src/
├── index.js                 # Main entry point (23 lines)
├── config/
│   └── slack.js            # Slack app configuration (13 lines)
├── managers/
│   ├── SessionManager.js   # Session state management (92 lines)
│   └── DMStateManager.js   # DM conversation state (115 lines)
├── handlers/
│   ├── commands.js         # Slash command handlers (256 lines)
│   ├── messages.js         # DM message handlers (65 lines)
│   └── actions.js          # Button interaction handlers (18 lines)
└── services/
    ├── slack.js           # Slack API utilities (59 lines)
    ├── voting.js          # Voting/presentation logic (311 lines)
    └── dm.js              # DM messaging functions (111 lines)
```

## Module Responsibilities

### 📁 **config/**
- **slack.js**: Slack Bolt app initialization and configuration

### 📁 **managers/**
- **SessionManager.js**: Manages retro session lifecycle, questions, and state
- **DMStateManager.js**: Manages individual user DM conversation states

### 📁 **handlers/**
- **commands.js**: Routes and handles all `/retro` slash commands
- **messages.js**: Handles DM message events for user responses
- **actions.js**: Handles button click interactions (start over, etc.)

### 📁 **services/**
- **slack.js**: Utilities for Slack API calls (channel members, safe DM sending)
- **voting.js**: Business logic for auto-present, manual present, vote counting
- **dm.js**: Functions for sending different types of DM messages

## Benefits of Refactoring

### ✅ **Maintainability**
- Each file has a single responsibility
- Easy to find and modify specific functionality
- Reduced cognitive load when working on features

### ✅ **Testability** 
- Each module can be unit tested independently
- Clear interfaces between components
- Easy to mock dependencies

### ✅ **Scalability**
- New commands can be added easily in handlers/commands.js
- New services can be added without touching core logic
- Clear separation allows for feature expansion

### ✅ **Code Organization**
- Logical grouping by function (handlers, services, managers)
- Consistent naming conventions
- Clear import/export relationships

## File Size Reduction

| Module Type | Files | Total Lines | Max File Size |
|-------------|-------|-------------|---------------|
| Original    | 1     | 989         | 989 lines     |
| Refactored  | 10    | 1063        | 311 lines     |

The largest file is now `services/voting.js` at 311 lines, well under the 500-line recommendation for maintainable code files.

## Import/Export Pattern

Each module follows a consistent pattern:
- Import dependencies at the top
- Define functions/classes
- Export public interface at the bottom

Example:
```javascript
const SomeManager = require('../managers/SomeManager');

async function someFunction() {
  // implementation
}

module.exports = {
  someFunction
};
```

## Running the Refactored Code

The entry point is now `src/index.js`. The package.json has been updated accordingly:

```bash
npm start      # runs: node src/index.js
npm run dev    # runs: node --watch src/index.js
```