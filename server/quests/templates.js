const actions = [
  "Leave a compliment for",
  "Buy a coffee for",
  "High five",
  "Sit with",
  "Share a snack with",
  "Give directions to",
  "Hold the door for",
  "Write a note for",
  "Take a photo with",
  "Recommend a song to",
  "Wave at",
  "Start a conversation with",
  "Give a fist bump to",
  "Lend your charger to",
  "Offer your seat to",
  "Draw a picture for",
  "Tell a joke to",
  "Share an umbrella with",
  "Carry something for",
  "Read aloud to",
];

const targets = [
  "a stranger studying alone",
  "someone wearing your school's colors",
  "the next person you make eye contact with",
  "someone who looks like they're having a rough day",
  "the barista",
  "someone sitting by themselves",
  "a person waiting in line",
  "your neighbor in class",
  "someone reading a book",
  "the first person you see outside",
  "someone walking their dog",
  "a friend you haven't talked to in a while",
  "the person next to you right now",
  "someone wearing headphones",
  "a campus worker",
];

const locationModifiers = [
  "at the nearest coffee shop",
  "in the quad",
  "at a park bench",
  "in the library",
  "at the student union",
  "outside your building",
  "on your walk to class",
  "at the dining hall",
  "in a study room",
  "at the bus stop",
];

const conditions = [
  "without looking at your phone first",
  "while making eye contact",
  "before noon",
  "with a genuine smile",
  "using their name if you can",
  "in under 60 seconds",
  "on your way somewhere",
  "right now",
  "before your next class",
  "while standing",
];


const ACTION_META = {
  "Leave a compliment for":    { category: "kindness",           difficulty_tier: "medium" },
  "Buy a coffee for":          { category: "kindness",           difficulty_tier: "medium" },
  "High five":                 { category: "social connection",  difficulty_tier: "low" },
  "Sit with":                  { category: "social connection",  difficulty_tier: "medium" },
  "Share a snack with":        { category: "kindness",           difficulty_tier: "medium" },
  "Give directions to":        { category: "kindness",           difficulty_tier: "medium" },
  "Hold the door for":         { category: "kindness",           difficulty_tier: "low" },
  "Write a note for":          { category: "kindness",           difficulty_tier: "medium" },
  "Take a photo with":         { category: "creativity",         difficulty_tier: "high" },
  "Recommend a song to":       { category: "creativity",         difficulty_tier: "medium" },
  "Wave at":                   { category: "social connection",  difficulty_tier: "low" },
  "Start a conversation with": { category: "social connection",  difficulty_tier: "medium" },
  "Give a fist bump to":       { category: "social connection",  difficulty_tier: "low" },
  "Lend your charger to":      { category: "social connection",  difficulty_tier: "medium" },
  "Offer your seat to":        { category: "kindness",           difficulty_tier: "low" },
  "Draw a picture for":        { category: "creativity",         difficulty_tier: "high" },
  "Tell a joke to":            { category: "creativity",         difficulty_tier: "medium" },
  "Share an umbrella with":    { category: "kindness",           difficulty_tier: "medium" },
  "Carry something for":       { category: "kindness",           difficulty_tier: "high" },
  "Read aloud to":             { category: "mindfulness",        difficulty_tier: "high" },
};

const COIN_REWARDS = { low: 5, medium: 15, high: 30 };

module.exports = {
  actions,
  targets,
  locationModifiers,
  conditions,
  ACTION_META,
  COIN_REWARDS,
};
