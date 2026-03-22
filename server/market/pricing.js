const TICKERS = {
  "kindness": "KIND",
  "mindfulness": "MIND",
  "social connection": "SOCL",
  "physical activity": "PHYS",
  "creativity": "CRTV",
  "gratitude": "GRAT",
};

const TICKER_TO_CATEGORY = Object.fromEntries(
  Object.entries(TICKERS).map(([cat, tick]) => [tick, cat])
);

const MAX_HISTORY = 50;
const MIN_PRICE = 10;
const MAX_PRICE = 500;
const BASE_DROP = 3;
const BASE_RISE = 1;

function clampPrice(price) {
  return Math.round(Math.max(MIN_PRICE, Math.min(MAX_PRICE, price)) * 100) / 100;
}

function findPriceAt(history, targetTime) {
  let closest = null;
  for (const entry of history) {
    const t = new Date(entry.timestamp).getTime();
    if (t <= targetTime) {
      if (!closest || t > new Date(closest.timestamp).getTime()) {
        closest = entry;
      }
    }
  }
  return closest ? closest.price : null;
}

/**
 * Supply/demand stock pricing:
 * - Completed stock goes DOWN proportional to its popularity
 * - All other stocks go UP proportional to their unpopularity
 * - Happiness rating softens or amplifies the drop
 *
 * Returns array of ALL updated stocks (not just the completed one).
 */
async function recalculateStockPrice(db, categoryName, happinessRating) {
  const ticker = TICKERS[categoryName];
  if (!ticker) return null;

  const now = new Date();
  const allCategories = Object.keys(TICKERS);

  // Get completion counts for every category
  const completionCounts = {};
  let totalCompletions = 0;
  for (const cat of allCategories) {
    const count = await db.collection("completions").countDocuments({ category: cat });
    completionCounts[cat] = count;
    totalCompletions += count;
  }

  // If no completions at all, treat as equal distribution
  if (totalCompletions === 0) totalCompletions = 1;

  // Read all current stock documents
  const allStocks = await db.collection("stocks").find().toArray();
  const stockMap = {};
  for (const s of allStocks) {
    stockMap[s.ticker] = s;
  }

  const rating = (happinessRating != null && Number.isFinite(happinessRating))
    ? Math.max(1, Math.min(5, happinessRating))
    : null;

  // Happiness modifier: rating 5 → 0.5 (half the drop), rating 1 → 2.0 (double the drop), null → 1.0
  const happinessMod = rating ? (2.0 - ((rating - 1) / 4) * 1.5) : 1.0;

  const updatedStocks = [];

  for (const cat of allCategories) {
    const catTicker = TICKERS[cat];
    const existing = stockMap[catTicker];
    const currentPrice = existing?.current_price ?? 100;
    const history = existing?.price_history ? [...existing.price_history] : [];
    const catCompletions = completionCounts[cat] || 0;
    const popularity = catCompletions / totalCompletions; // 0 to 1

    let newPrice;

    if (cat === categoryName) {
      // COMPLETED STOCK: price goes DOWN
      // Popular stocks drop more
      const drop = BASE_DROP * (0.5 + popularity) * happinessMod;
      newPrice = clampPrice(currentPrice - drop);
    } else {
      // OTHER STOCKS: price goes UP
      // Unpopular stocks rise more
      const unpopularity = 1 - popularity;
      const rise = BASE_RISE * (0.5 + unpopularity);
      newPrice = clampPrice(currentPrice + rise);
    }

    // Update price history
    history.push({ price: newPrice, timestamp: now });
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    // Calculate change percentages
    const hourAgoPrice = findPriceAt(history, Date.now() - 3600000);
    const dayAgoPrice = findPriceAt(history, Date.now() - 86400000);
    const hourChange = hourAgoPrice ? Math.round(((newPrice - hourAgoPrice) / hourAgoPrice) * 10000) / 100 : 0;
    const dayChange = dayAgoPrice ? Math.round(((newPrice - dayAgoPrice) / dayAgoPrice) * 10000) / 100 : 0;

    // Avg happiness for this category (from recent completions)
    const recentRatings = await db.collection("completions")
      .find({ category: cat, happiness_rating: { $ne: null } })
      .sort({ completed_at: -1 })
      .limit(20)
      .toArray();
    const avgHappiness = recentRatings.length > 0
      ? Math.round((recentRatings.reduce((s, c) => s + c.happiness_rating, 0) / recentRatings.length) * 100) / 100
      : 3.0;

    // Write to DB
    await db.collection("stocks").updateOne(
      { ticker: catTicker },
      {
        $set: {
          name: cat,
          ticker: catTicker,
          current_price: newPrice,
          price_history: history,
          avg_happiness: avgHappiness,
          total_completions: catCompletions,
          hour_change: hourChange,
          day_change: dayChange,
          updated_at: now,
        },
      },
      { upsert: true }
    );

    updatedStocks.push({
      ticker: catTicker,
      name: cat,
      current_price: newPrice,
      hour_change: hourChange,
      day_change: dayChange,
      sparkline: history.slice(-20).map((h) => h.price),
      avg_happiness: avgHappiness,
      total_completions: catCompletions,
      updated_at: now,
    });
  }

  return updatedStocks;
}

async function recalculateAllStocks(db) {
  // Just recalculate as if a neutral event happened in the first category
  const firstCat = Object.keys(TICKERS)[0];
  return await recalculateStockPrice(db, firstCat, 3);
}

module.exports = {
  TICKERS,
  TICKER_TO_CATEGORY,
  recalculateStockPrice,
  recalculateAllStocks,
};
