# HappyStreet

A community task marketplace where users can help other users.

# Description

## Quests

HappyStreet revolves around a quest board, a shared feed where users post tasks they need help with. Each quest has a value attached to it, and anyone in the community can pick one up. Once someone takes a quest, they're matched with the other person, either the one who posted it or the one requesting help. Users will complete the task, and the recipient confirms it through the app to mitigate cheating.

## Economy

After finishing a quest, the user earns currency that they invest into stock categories based on what kind of task it was. But the more a specific quest gets completed, the less it pays out, so harder, less popular tasks stay valuable while easy ones lose their value over time.

Your invested shares change based on what other users are doing and where they're putting their own earnings. Sell at the right time and you walk away with more money. Sell too late and you might not. The money goes toward cosmetics to personalize your profile and securing a spot on the friends leaderboard.

## Social

A built in messaging system lets you communicate directly with whoever you're working with on a quest, whether you're the one helping or the one who posted it. There's also a friends tab to see who the user is connected with and a leaderboard so you can see how you stack up against the people you know.

> **For most users:** HappyStreet is a cloud hosted platform — just visit the website or open the app on your device. No installation needed.
>
> The instructions below are only for developers or self-hosters who want to run their own instance of the server.

# Getting Started

## Dependencies

Before running this project, you will need to have the following software installed on your system:

- [Node.js](https://nodejs.org/) | v18+ | JavaScript runtime |
- [npm](https://www.npmjs.com/) | v9+ | Package manager |
- [MongoDB](https://www.mongodb.com/) | v6+ | NoSQL database |


## Installation

1. **Install Node.js & npm**
   Download and install Node.js (v18 or higher) from [nodejs.org](https://nodejs.org/). npm is already included.

   Verify both Node.js and npm are installed:
```bash
   node --version
   npm --version
```
2. **Install MongoDB**
   Follow the installation guide for your OS:
   - [macOS](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/)
   - [Windows](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/)
   - [Linux](https://www.mongodb.com/docs/manual/administration/install-on-linux/)

   Verify MongoDB is installed:
```bash
   mongosh --version
```
## Execution


1. **Clone the repository**
```bash
   git clone 
   cd 
```

2. **Set up the server**
```bash
   cd server
   npm install
   node server.js
```

3. **Set up the client** (in a new terminal)
```bash
   cd app
   npm install
   npm run dev
```




