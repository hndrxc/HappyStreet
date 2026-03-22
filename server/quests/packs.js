// Hand-curated quest packs — complete quest objects (not combinatorial).

const campus = [
  { title: "Leave an encouraging sticky note on a library desk", category: "kindness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Buy the person behind you in the dining hall a dessert", category: "kindness", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Study with someone you have never studied with before", category: "social connection", difficulty_tier: "high", coin_reward: 30 },
  { title: "Compliment a professor after class", category: "kindness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Pick up litter on the quad", category: "gratitude", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Introduce yourself to someone new in your lecture", category: "social connection", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Leave a thank-you note for a campus janitor", category: "gratitude", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Share your class notes with a classmate who missed a day", category: "kindness", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Sit in the grass for 10 minutes without your phone", category: "mindfulness", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Walk a different route to class and notice 3 new things", category: "mindfulness", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Write a positive message in chalk on the sidewalk", category: "creativity", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Give a genuine compliment to 3 strangers on campus", category: "kindness", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Organize a spontaneous study group in the student union", category: "social connection", difficulty_tier: "high", coin_reward: 30 },
  { title: "Do 20 jumping jacks between classes", category: "physical activity", difficulty_tier: "low", coin_reward: 5 },
  { title: "Draw a small doodle and leave it for someone to find", category: "creativity", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Hold the door open for the next 5 people entering a building", category: "kindness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Thank a campus bus driver by name", category: "gratitude", difficulty_tier: "low", coin_reward: 5 },
  { title: "Eat lunch with someone sitting alone in the dining hall", category: "social connection", difficulty_tier: "high", coin_reward: 30 },
  { title: "Take a photo of your favorite campus spot and share why you love it", category: "creativity", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Walk barefoot in the grass for 5 minutes", category: "mindfulness", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Help someone carry their books or bags across campus", category: "kindness", difficulty_tier: "medium", coin_reward: 15 },
];

const downtown = [
  { title: "Leave a positive review for a local business you love", category: "kindness", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Compliment a street musician's performance", category: "kindness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Pick up litter on one city block", category: "gratitude", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Buy a coffee for the person behind you in line", category: "kindness", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Sketch a building you walk past every day but never really look at", category: "creativity", difficulty_tier: "high", coin_reward: 30 },
  { title: "Sit on a bench for 10 minutes and people-watch mindfully", category: "mindfulness", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Give directions to someone who looks lost", category: "kindness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Take a photo of something beautiful you normally walk past", category: "creativity", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Say good morning to 5 strangers on the street", category: "social connection", difficulty_tier: "low", coin_reward: 5 },
  { title: "Write a thank-you note and leave it at a restaurant table", category: "gratitude", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Walk 6 blocks without looking at your phone", category: "mindfulness", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Ask a shop owner about their favorite item in the store", category: "social connection", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Do a lap around a park at a jog", category: "physical activity", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Share your umbrella with a stranger when it rains", category: "kindness", difficulty_tier: "medium", coin_reward: 15 },
  { title: "Recommend your favorite local spot to a tourist", category: "social connection", difficulty_tier: "medium", coin_reward: 15 },
];

const quickHits = [
  { title: "Smile at 5 strangers", category: "kindness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Hold the elevator for someone", category: "kindness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Say thank you to a janitor by name", category: "gratitude", difficulty_tier: "low", coin_reward: 5 },
  { title: "Wave at someone across the room", category: "social connection", difficulty_tier: "low", coin_reward: 5 },
  { title: "Take 3 deep breaths before entering a building", category: "mindfulness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Give someone a thumbs up", category: "social connection", difficulty_tier: "low", coin_reward: 5 },
  { title: "Text a friend something you appreciate about them", category: "kindness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Stand up and stretch for 30 seconds", category: "physical activity", difficulty_tier: "low", coin_reward: 5 },
  { title: "Notice 3 things you can hear right now", category: "mindfulness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Compliment someone's outfit", category: "kindness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Fist bump a friend", category: "social connection", difficulty_tier: "low", coin_reward: 5 },
  { title: "Let someone go ahead of you in line", category: "kindness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Look up from your phone and make eye contact with someone", category: "mindfulness", difficulty_tier: "low", coin_reward: 5 },
  { title: "Do 10 squats right where you are", category: "physical activity", difficulty_tier: "low", coin_reward: 5 },
  { title: "Write down one thing you are grateful for right now", category: "gratitude", difficulty_tier: "low", coin_reward: 5 },
];

const weekend = [
  { title: "Volunteer at a food bank for 2 hours", category: "kindness", difficulty_tier: "high", coin_reward: 30 },
  { title: "Cook a meal for a neighbor", category: "creativity", difficulty_tier: "high", coin_reward: 30 },
  { title: "Organize a park cleanup with friends", category: "gratitude", difficulty_tier: "high", coin_reward: 30 },
  { title: "Go on a 3-mile hike and leave no trace", category: "physical activity", difficulty_tier: "high", coin_reward: 30 },
  { title: "Write handwritten letters to 3 people you appreciate", category: "gratitude", difficulty_tier: "high", coin_reward: 30 },
  { title: "Spend an hour at a coffee shop sketching people", category: "creativity", difficulty_tier: "high", coin_reward: 30 },
  { title: "Play a pickup sport with strangers at the park", category: "physical activity", difficulty_tier: "high", coin_reward: 30 },
  { title: "Host a board game night for your floor or friends", category: "social connection", difficulty_tier: "high", coin_reward: 30 },
  { title: "Do a 30-minute guided meditation in a quiet outdoor spot", category: "mindfulness", difficulty_tier: "high", coin_reward: 30 },
  { title: "Bake cookies and hand them out to neighbors", category: "kindness", difficulty_tier: "high", coin_reward: 30 },
  { title: "Teach someone a skill you know well", category: "social connection", difficulty_tier: "high", coin_reward: 30 },
  { title: "Explore a part of town you have never visited on foot", category: "physical activity", difficulty_tier: "high", coin_reward: 30 },
];

const ALL_PACKS = { campus, downtown, quickHits, weekend };

function getAllPackQuests() {
  return Object.entries(ALL_PACKS).flatMap(([packName, quests]) =>
    quests.map((q) => ({ ...q, pack: packName }))
  );
}

module.exports = { campus, downtown, quickHits, weekend, ALL_PACKS, getAllPackQuests };
