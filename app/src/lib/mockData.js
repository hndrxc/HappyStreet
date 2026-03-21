// ============================================
// MOCK DATA - Replace with real API calls later
// ============================================

export const currentUser = {
  id: "user_001",
  username: "happywalker",
  avatar: null,
  balance: 2847.50,
};

export const hotspots = [
  {
    id: "hotspot_001",
    name: "Central Park Cafe",
    distance: 0, // 0 means inside
    direction: null,
  },
  {
    id: "hotspot_002",
    name: "Downtown Plaza",
    distance: 0.3,
    direction: "NE",
  },
  {
    id: "hotspot_003",
    name: "Harbor View",
    distance: 1.2,
    direction: "S",
  },
];

export const quests = [
  {
    id: "quest_001",
    title: "Coffee Run",
    value: 12.50,
    activeNeeds: 3,
    completions: 47,
  },
  {
    id: "quest_002",
    title: "Grocery Pickup",
    value: 25.00,
    activeNeeds: 1,
    completions: 23,
  },
  {
    id: "quest_003",
    title: "Pet Sitting",
    value: 45.00,
    activeNeeds: 2,
    completions: 12,
  },
  {
    id: "quest_004",
    title: "Package Delivery",
    value: 8.75,
    activeNeeds: 5,
    completions: 89,
  },
  {
    id: "quest_005",
    title: "Tech Help",
    value: 35.00,
    activeNeeds: 1,
    completions: 31,
  },
];

export const conversations = {
  needs: [
    {
      id: "conv_001",
      questId: "quest_001",
      questTitle: "Coffee Run",
      otherUser: {
        id: "user_002",
        username: "coffeelover",
      },
      lastMessage: "On my way to pick it up now!",
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      isLocked: false,
    },
    {
      id: "conv_002",
      questId: "quest_003",
      questTitle: "Pet Sitting",
      otherUser: {
        id: "user_003",
        username: "petpal",
      },
      lastMessage: "Your dog is doing great!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isLocked: false,
    },
    {
      id: "conv_003",
      questId: "quest_002",
      questTitle: "Grocery Pickup",
      otherUser: {
        id: "user_004",
        username: "helpinghands",
      },
      lastMessage: "Thanks for helping out!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      isLocked: true,
    },
  ],
  fulfillments: [
    {
      id: "conv_004",
      questId: "quest_004",
      questTitle: "Package Delivery",
      otherUser: {
        id: "user_005",
        username: "quicksend",
      },
      lastMessage: "Can you pick it up from the lobby?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      isLocked: false,
    },
    {
      id: "conv_005",
      questId: "quest_005",
      questTitle: "Tech Help",
      otherUser: {
        id: "user_006",
        username: "newbie42",
      },
      lastMessage: "That fixed it! Thank you so much!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
      isLocked: true,
    },
  ],
};

export const chatMessages = {
  conv_001: [
    { id: "msg_001", senderId: "user_001", text: "Hi! I need a latte from the cafe", timestamp: new Date(Date.now() - 1000 * 60 * 15) },
    { id: "msg_002", senderId: "user_002", text: "Sure! Large or medium?", timestamp: new Date(Date.now() - 1000 * 60 * 12) },
    { id: "msg_003", senderId: "user_001", text: "Large please, extra shot", timestamp: new Date(Date.now() - 1000 * 60 * 10) },
    { id: "msg_004", senderId: "user_002", text: "Got it! On my way to pick it up now!", timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  ],
  conv_002: [
    { id: "msg_005", senderId: "user_001", text: "How is Max doing?", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3) },
    { id: "msg_006", senderId: "user_003", text: "Your dog is doing great!", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  ],
  conv_003: [
    { id: "msg_007", senderId: "user_004", text: "All groceries delivered!", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
    { id: "msg_008", senderId: "user_001", text: "Thanks for helping out!", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
  ],
  conv_004: [
    { id: "msg_009", senderId: "user_005", text: "Hi, I have a package for delivery", timestamp: new Date(Date.now() - 1000 * 60 * 45) },
    { id: "msg_010", senderId: "user_001", text: "No problem, where should I pick it up?", timestamp: new Date(Date.now() - 1000 * 60 * 40) },
    { id: "msg_011", senderId: "user_005", text: "Can you pick it up from the lobby?", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  ],
  conv_005: [
    { id: "msg_012", senderId: "user_006", text: "I can't figure out this wifi issue", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4) },
    { id: "msg_013", senderId: "user_001", text: "Try restarting your router", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4) },
    { id: "msg_014", senderId: "user_006", text: "That fixed it! Thank you so much!", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4) },
  ],
};

export const leaderboard = {
  global: [
    { rank: 1, userId: "user_010", username: "questmaster", balance: 15420.00, totalShares: 234 },
    { rank: 2, userId: "user_011", username: "helperhero", balance: 12850.50, totalShares: 198 },
    { rank: 3, userId: "user_012", username: "kindspirit", balance: 9840.25, totalShares: 156 },
    { rank: 4, userId: "user_013", username: "goodvibes", balance: 7230.00, totalShares: 123 },
    { rank: 5, userId: "user_001", username: "happywalker", balance: 2847.50, totalShares: 45 },
    { rank: 6, userId: "user_014", username: "sunnydays", balance: 2340.75, totalShares: 67 },
    { rank: 7, userId: "user_015", username: "friendlyface", balance: 1890.00, totalShares: 34 },
    { rank: 8, userId: "user_016", username: "warmheart", balance: 1450.25, totalShares: 28 },
    { rank: 9, userId: "user_017", username: "joygiver", balance: 980.50, totalShares: 19 },
    { rank: 10, userId: "user_018", username: "cheerful1", balance: 650.00, totalShares: 12 },
  ],
  interacted: [
    { rank: 1, userId: "user_002", username: "coffeelover", balance: 3240.00, totalShares: 56 },
    { rank: 2, userId: "user_003", username: "petpal", balance: 2180.50, totalShares: 43 },
    { rank: 3, userId: "user_005", username: "quicksend", balance: 1560.25, totalShares: 31 },
    { rank: 4, userId: "user_004", username: "helpinghands", balance: 890.00, totalShares: 18 },
    { rank: 5, userId: "user_006", username: "newbie42", balance: 450.75, totalShares: 8 },
  ],
};

export const userShares = [
  {
    id: "share_001",
    questId: "quest_001",
    questTitle: "Coffee Run",
    shareCount: 15,
    currentValue: 12.50,
  },
  {
    id: "share_002",
    questId: "quest_003",
    questTitle: "Pet Sitting",
    shareCount: 8,
    currentValue: 45.00,
  },
  {
    id: "share_003",
    questId: "quest_004",
    questTitle: "Package Delivery",
    shareCount: 22,
    currentValue: 8.75,
  },
  {
    id: "share_004",
    questId: "quest_005",
    questTitle: "Tech Help",
    shareCount: 5,
    currentValue: 35.00,
  },
];

// Simulated socket state for real-time values
export const socketSimulation = {
  isConnected: true,
  lastUpdate: new Date(),
};
