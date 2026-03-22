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

const BASE_PRICE = 100;
const MAX_HISTORY = 50;

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

async function recalculateStockPrice(db, categoryName) {
  const ticker = TICKERS[categoryName];
  if (!ticker) return null;

  // Momentum: rolling average of last 20 happiness ratings
  const recentCompletions = await db.collection("completions")
    .find({ category: categoryName })
    .sort({ completed_at: -1 })
    .limit(20)
    .toArray();

  const momentum = recentCompletions.length > 0
    ? recentCompletions.reduce((sum, c) => sum + c.happiness_rating, 0) / recentCompletions.length
    : 3.0;

  // Volume: completions in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const volume = await db.collection("completions")
    .countDocuments({ category: categoryName, completed_at: { $gte: oneHourAgo } });

  // Price formula
  const price = BASE_PRICE + (momentum - 3) * 20 + Math.log(volume + 1) * 10;
  const roundedPrice = Math.round(price * 100) / 100;
  const now = new Date();

  // Read-modify-write for price_history
  const existing = await db.collection("stocks").findOne({ ticker });
  const history = existing?.price_history || [];
  history.push({ price: roundedPrice, timestamp: now });
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  const hourAgoPrice = findPriceAt(history, Date.now() - 3600000);
  const dayAgoPrice = findPriceAt(history, Date.now() - 86400000);
  const hourChange = hourAgoPrice ? Math.round(((roundedPrice - hourAgoPrice) / hourAgoPrice) * 10000) / 100 : 0;
  const dayChange = dayAgoPrice ? Math.round(((roundedPrice - dayAgoPrice) / dayAgoPrice) * 10000) / 100 : 0;

  const totalCompletions = await db.collection("completions")
    .countDocuments({ category: categoryName });

  await db.collection("stocks").updateOne(
    { ticker },
    {
      $set: {
        name: categoryName,
        ticker,
        current_price: roundedPrice,
        price_history: history,
        avg_happiness: Math.round(momentum * 100) / 100,
        total_completions: totalCompletions,
        hour_change: hourChange,
        day_change: dayChange,
        updated_at: now,
      },
    },
    { upsert: true }
  );

  return {
    ticker,
    name: categoryName,
    current_price: roundedPrice,
    hour_change: hourChange,
    day_change: dayChange,
    sparkline: history.slice(-20).map((h) => h.price),
    avg_happiness: Math.round(momentum * 100) / 100,
    total_completions: totalCompletions,
    updated_at: now,
  };
}

async function recalculateAllStocks(db) {
  const results = [];
  for (const categoryName of Object.keys(TICKERS)) {
    const result = await recalculateStockPrice(db, categoryName);
    if (result) results.push(result);
  }
  return results;
}

module.exports = {
  TICKERS,
  TICKER_TO_CATEGORY,
  recalculateStockPrice,
  recalculateAllStocks,
};
