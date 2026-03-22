// ============================================
// MOCK DATA - Replace with real API calls later
// ============================================

// Kept for MessagesPage (not yet migrated to backend)
export const currentUser = {
  id: "user_001",
  username: "happywalker",
  avatar: null,
  balance: 0,
};

// --- Backend-shaped hotspot data (Phase 2) ---
export const hotspots = [
  {
    id: "hotspot_001",
    name: "Middleton Library",
    description: "A quiet study spot on campus",
    location: { type: "Point", coordinates: [-91.1800, 30.4133] },
    radius_meters: 300,
    questq_ids: ["quest_001", "quest_002", "quest_003"],
    category_bias: "mindfulness",
    heat_score: 12,
    active: true,
  },
  {
    id: "hotspot_002",
    name: "LSU Quad",
    description: "The heart of campus life",
    location: { type: "Point", coordinates: [-91.1780, 30.4155] },
    radius_meters: 400,
    questq_ids: ["quest_004", "quest_005"],
    category_bias: "social connection",
    heat_score: 28,
    active: true,
  },
  {
    id: "hotspot_003",
    name: "Student Union",
    description: "Grab food and hang out between classes",
    location: { type: "Point", coordinates: [-91.1768, 30.4148] },
    radius_meters: 250,
    questq_ids: ["quest_006", "quest_007"],
    category_bias: "kindness",
    heat_score: 18,
    active: true,
  },
  {
    id: "hotspot_004",
    name: "Highland Coffees",
    description: "The best coffee near campus",
    location: { type: "Point", coordinates: [-91.1780, 30.4103] },
    radius_meters: 150,
    questq_ids: ["quest_008"],
    category_bias: "gratitude",
    heat_score: 8,
    active: true,
  },
  {
    id: "hotspot_005",
    name: "Parade Ground",
    description: "Open field perfect for outdoor activities",
    location: { type: "Point", coordinates: [-91.1810, 30.4160] },
    radius_meters: 350,
    questq_ids: ["quest_009", "quest_010"],
    category_bias: "physical activity",
    heat_score: 15,
    active: true,
  },
  {
    id: "hotspot_006",
    name: "Tiger Stadium",
    description: "Home of LSU football",
    location: { type: "Point", coordinates: [-91.1840, 30.4120] },
    radius_meters: 500,
    questq_ids: [],
    category_bias: null,
    heat_score: 3,
    active: true,
  },
  {
    id: "hotspot_007",
    name: "Free Speech Alley",
    description: "The place for bold conversations",
    location: { type: "Point", coordinates: [-91.1770, 30.4150] },
    radius_meters: 100,
    questq_ids: ["quest_011"],
    category_bias: "social connection",
    heat_score: 22,
    active: true,
  },
  {
    id: "hotspot_008",
    name: "My Spot",
    description: "Home base",
    location: { type: "Point", coordinates: [-91.17098623802013, 30.389581536572592] },
    radius_meters: 200,
    questq_ids: [],
    category_bias: "kindness",
    heat_score: 5,
    active: true,
  },
];



// Mock shares for SharesPage (not yet migrated to backend)
export const userShares = [
  { id: "share_001", questTitle: "Kindness Fund", shareCount: 10, currentValue: 12.50 },
  { id: "share_002", questTitle: "Mindfulness Pool", shareCount: 5, currentValue: 8.75 },
  { id: "share_003", questTitle: "Social Connection", shareCount: 8, currentValue: 15.20 },
];

// Category color map — used by QuestCard, HotspotMap, etc.
export const CATEGORY_COLORS = {
  "kindness": "#E8A020",
  "mindfulness": "#8B5CF6",
  "social connection": "#3B82F6",
  "physical activity": "#10B981",
  "creativity": "#F472B6",
  "gratitude": "#F59E0B",
};

export const DIFFICULTY_LABELS = {
  low: "Easy",
  medium: "Med",
  high: "Hard",
};

// --- Below: unchanged data for pages not yet migrated ---

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
