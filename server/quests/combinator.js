const {
  actions,
  targets,
  locationModifiers,
  conditions,
  ACTION_META,
  COIN_REWARDS,
} = require("./templates");

// --- Compatibility rules -------------------------------------------------- //
// Each rule: if the regex on the left-hand key matches, the regex on the
// right-hand key must NOT match.  If it does, the combo is invalid.
const INCOMPATIBLE = [
  // Target-location mismatches
  { target: /the barista/,              locationBan: /park bench|quad|bus stop|outside your building/ },
  { target: /walking their dog/,        locationBan: /library|study room/ },
  { target: /neighbor in class/,        locationBan: /coffee shop|park bench|bus stop/ },
  // Action-location mismatches
  { action: /Hold the door for/,        locationBan: /quad|park bench|bus stop/ },
  { action: /Offer your seat to/,       locationBan: /quad|park bench|bus stop|on your walk/ },
  // Action-condition mismatches
  { action: /Buy a coffee/,             conditionBan: /under 60 seconds/ },
  { action: /Read aloud/,               conditionBan: /under 60 seconds/ },
  { action: /Draw a picture/,           conditionBan: /under 60 seconds/ },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isCompatible(action, target, location, condition) {
  for (const rule of INCOMPATIBLE) {
    if (rule.action && rule.action.test(action)) {
      if (rule.locationBan && rule.locationBan.test(location)) return false;
      if (rule.conditionBan && rule.conditionBan.test(condition)) return false;
    }
    if (rule.target && rule.target.test(target)) {
      if (rule.locationBan && rule.locationBan.test(location)) return false;
      if (rule.conditionBan && rule.conditionBan.test(condition)) return false;
    }
  }
  return true;
}

/**
 * Generate a single random quest.
 * @param {object} [options] - Optional overrides for any component.
 * @returns {{ title: string, category: string, difficulty_tier: string, coin_reward: number }}
 */
function generateQuest(options = {}) {
  const action = options.action || pick(actions);
  let target = options.target || pick(targets);
  let location = options.location || pick(locationModifiers);
  let condition = options.condition || pick(conditions);

  // Retry incompatible components up to 10 times
  let retries = 0;
  while (!isCompatible(action, target, location, condition) && retries < 10) {
    retries++;
    // Re-pick the modifier components (keep the action stable for category consistency)
    if (!options.target) target = pick(targets);
    if (!options.location) location = pick(locationModifiers);
    if (!options.condition) condition = pick(conditions);
  }

  const title = `${action} ${target} ${location} ${condition}`;
  const meta = ACTION_META[action] || { category: "kindness", difficulty_tier: "medium" };

  return {
    title,
    category: meta.category,
    difficulty_tier: meta.difficulty_tier,
    coin_reward: COIN_REWARDS[meta.difficulty_tier] || 15,
  };
}

/**
 * Generate multiple unique quests.
 * @param {number} [count=50]
 * @param {object} [options] - Passed through to generateQuest.
 * @returns {Array<{ title: string, category: string, difficulty_tier: string, coin_reward: number }>}
 */
function generateQuests(count = 50, options = {}) {
  const seen = new Set();
  const results = [];
  let attempts = 0;

  while (results.length < count && attempts < count * 3) {
    attempts++;
    const quest = generateQuest(options);
    if (!seen.has(quest.title)) {
      seen.add(quest.title);
      results.push(quest);
    }
  }

  return results;
}

module.exports = { generateQuest, generateQuests };
