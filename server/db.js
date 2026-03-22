const { MongoClient, ObjectId } = require("mongodb");

let db;

const DEFAULT_CATEGORY = "kindness";
const VALUE_DROP = 20;
const VALUE_RISE = 5;

const CATEGORY_DEFS = [
  { name: "kindness", displayName: "Kindness" },
  { name: "mindfulness", displayName: "Mindfulness" },
  { name: "social connection", displayName: "Social Connection" },
  { name: "physical activity", displayName: "Physical Activity" },
  { name: "creativity", displayName: "Creativity" },
  { name: "gratitude", displayName: "Gratitude" },
];

const CATEGORY_NAMES = CATEGORY_DEFS.map((c) => c.name);
const CATEGORY_MAP = Object.fromEntries(CATEGORY_DEFS.map((c) => [c.name, c]));
const CATEGORY_ALIASES = {
  social_connection: "social connection",
  physical_activity: "physical activity",
};

const { generateQuests } = require("./quests/combinator");
const { getAllPackQuests } = require("./quests/packs");

function normalizeCategory(category) {
  if (typeof category !== "string") return null;
  const normalized = category.trim().toLowerCase().replace(/\s+/g, " ");
  return CATEGORY_ALIASES[normalized] || normalized;
}

function isValidCategory(category) {
  const normalized = normalizeCategory(category);
  return normalized ? CATEGORY_NAMES.includes(normalized) : false;
}

function normalizeQuest(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    title: rest.title,
    category: normalizeCategory(rest.category) || DEFAULT_CATEGORY,
    difficulty_tier: rest.difficulty_tier || "medium",
    coin_reward: rest.coin_reward ?? 15,
    completions: rest.completions || 0,
    value: rest.value ?? 100,
    source: rest.source || "generated",
    pack: rest.pack || null,
    hotspot_id: rest.hotspot_id ? rest.hotspot_id.toString() : null,
    location: rest.location || null,
    radius_meters: rest.radius_meters ?? 500,
    active: rest.active !== false,
    created_at: rest.created_at || rest.createdAt || null,
  };
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeHotspot(doc) {
  if (!doc) return null;

  const rawId = doc._id && typeof doc._id.toString === "function"
    ? doc._id.toString()
    : doc._id;

  const lat = Number.isFinite(doc.lat)
    ? doc.lat
    : (Array.isArray(doc.location?.coordinates) ? doc.location.coordinates[1] : null);
  const lon = Number.isFinite(doc.lon)
    ? doc.lon
    : (Array.isArray(doc.location?.coordinates) ? doc.location.coordinates[0] : null);

  const questqIds = Array.isArray(doc.questq_ids) ? doc.questq_ids : [];
  const legacyQuestIds = Array.isArray(doc.quest_ids) ? doc.quest_ids : [];
  const questIds = Array.from(
    new Set(
      [
        ...legacyQuestIds,
        ...questqIds.map((entry) => {
          if (entry == null) return null;
          if (typeof entry === "string") return entry;
          if (typeof entry.quest_id === "string") return entry.quest_id;
          if (entry.quest_id && typeof entry.quest_id.toString === "function") return entry.quest_id.toString();
          if (entry._id && typeof entry._id.toString === "function") return entry._id.toString();
          return null;
        }),
      ]
        .filter(Boolean)
        .map(String)
    )
  );

  return {
    ...doc,
    _id: rawId,
    id: doc.id ?? rawId,
    lat,
    lon,
    radius: Number.isFinite(doc.radius) ? doc.radius : 80,
    radius_meters: Number.isFinite(doc.radius_meters) ? doc.radius_meters : (Number.isFinite(doc.radius) ? doc.radius : 80),
    questq_ids: questqIds,
    quest_ids: questIds,
    location:
      doc.location ||
      (Number.isFinite(lat) && Number.isFinite(lon)
        ? { type: "Point", coordinates: [lon, lat] }
        : null),
  };
}

async function ensureSeedData() {
  const quests = db.collection("questTable");
  const categories = db.collection("categories");
  const now = new Date();

  const questCount = await quests.countDocuments();
  if (questCount === 0) {
    const generated = generateQuests(50);
    const packQuests = getAllPackQuests();

    const allQuests = [
      ...generated.map((q) => ({
        title: q.title,
        category: q.category,
        difficulty_tier: q.difficulty_tier,
        coin_reward: q.coin_reward,
        completions: 0,
        value: 100,
        source: "generated",
        pack: null,
        hotspot_id: null,
        location: null,
        radius_meters: 500,
        active: true,
        created_at: now,
      })),
      ...packQuests.map((q) => ({
        title: q.title,
        category: q.category,
        difficulty_tier: q.difficulty_tier,
        coin_reward: q.coin_reward,
        completions: 0,
        value: 100,
        source: "pack",
        pack: q.pack,
        hotspot_id: null,
        location: null,
        radius_meters: 500,
        active: true,
        created_at: now,
      })),
    ];

    await quests.insertMany(allQuests);
  }

  const categoryCount = await categories.countDocuments();
  if (categoryCount === 0) {
    await categories.insertMany(
      CATEGORY_DEFS.map((c) => ({
        name: c.name,
        displayName: c.displayName,
        price: 100,
        totalCompletions: 0,
        createdAt: now,
        updatedAt: now,
      }))
    );
  }

  // Keep old quest docs compatible
  await quests.updateMany(
    { $or: [{ category: { $exists: false } }, { category: null }] },
    { $set: { category: DEFAULT_CATEGORY, updatedAt: now } }
  );

  // Migrate legacy underscore category names to canonical names
  for (const [legacy, canonical] of Object.entries(CATEGORY_ALIASES)) {
    await quests.updateMany(
      { category: legacy },
      { $set: { category: canonical, updatedAt: now } }
    );
  }

  // Backfill new fields on quests 
  await quests.updateMany(
    { difficulty_tier: { $exists: false } },
    {
      $set: {
        difficulty_tier: "medium",
        coin_reward: 15,
        source: "generated",
        pack: null,
        hotspot_id: null,
        location: null,
        radius_meters: 500,
        active: true,
      },
    }
  );

  // Ensure all canonical category documents exist and consolidate legacy names.
  for (const [legacy, canonical] of Object.entries(CATEGORY_ALIASES)) {
    const legacyDoc = await categories.findOne({ name: legacy });
    if (!legacyDoc) continue;

    const canonicalDoc = await categories.findOne({ name: canonical });
    if (canonicalDoc) {
      await categories.updateOne(
        { _id: canonicalDoc._id },
        {
          $inc: { totalCompletions: legacyDoc.totalCompletions || 0 },
          $set: { updatedAt: now },
        }
      );
      await categories.deleteOne({ _id: legacyDoc._id });
      continue;
    }

    await categories.updateOne(
      { _id: legacyDoc._id },
      {
        $set: {
          name: canonical,
          displayName: CATEGORY_MAP[canonical].displayName,
          updatedAt: now,
        },
      }
    );
  }

  for (const categoryDef of CATEGORY_DEFS) {
    await categories.updateOne(
      { name: categoryDef.name },
      {
        $setOnInsert: {
          name: categoryDef.name,
          displayName: categoryDef.displayName,
          price: 100,
          totalCompletions: 0,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
  }

  // Seed stocks collection
  const { TICKERS } = require("./market/pricing");
  const stockCount = await db.collection("stocks").countDocuments();
  if (stockCount === 0) {
    const stockDocs = Object.entries(TICKERS).map(([name, ticker]) => ({
      name,
      ticker,
      current_price: 100,
      price_history: [{ price: 100, timestamp: now }],
      total_completions: 0,
      avg_happiness: 3.0,
      hour_change: 0,
      day_change: 0,
      updated_at: now,
    }));
    await db.collection("stocks").insertMany(stockDocs);
  }

  // Backfill happiness fields on categories
  await categories.updateMany(
    { totalHappinessScore: { $exists: false } },
    { $set: { totalHappinessScore: 0, avgHappiness: 0, lastUpdated: new Date() } }
  );

  // Backfill user fields for currency/stats
  await db.collection("userTable").updateMany(
    { joy_coins: { $exists: false } },
    { $set: { joy_coins: 0, total_completions: 0, streak_current: 0, streak_last_date: null } }
  );

  // Geospatial index for /quests/nearby — idempotent, null locations auto-excluded.
  await quests.createIndex({ location: "2dsphere" });

  // Index for stock price calculation queries on completions
  await db.collection("completions").createIndex({ category: 1, completed_at: -1 });

  const hotspots = db.collection("hotspotTable");
  await hotspots.updateMany(
    {
      location: { $exists: false },
      lat: { $type: "number" },
      lon: { $type: "number" },
    },
    [
      {
        $set: {
          location: { type: "Point", coordinates: ["$lon", "$lat"] },
        },
      },
    ]
  );
  await hotspots.updateMany(
    { questq_ids: { $exists: false } },
    { $set: { questq_ids: [] } }
  );
  await hotspots.createIndex({ location: "2dsphere" });

  // Seed default hotspots if empty
  const hotspotCount = await hotspots.countDocuments();
  if (hotspotCount === 0) {
    const defaultHotspots = [
      { name: "Middleton Library", description: "A quiet study spot on campus", lat: 30.4133, lon: -91.1800, radius_meters: 300, category_bias: "mindfulness" },
      { name: "LSU Quad", description: "The heart of campus life", lat: 30.4155, lon: -91.1780, radius_meters: 400, category_bias: "social connection" },
      { name: "Student Union", description: "Where everyone gathers between classes", lat: 30.4148, lon: -91.1768, radius_meters: 250, category_bias: "social connection" },
      { name: "Highland Coffees", description: "Local coffee shop near the north gates", lat: 30.4103, lon: -91.1780, radius_meters: 150, category_bias: "kindness" },
      { name: "Parade Ground", description: "Open field perfect for outdoor activities", lat: 30.4160, lon: -91.1810, radius_meters: 350, category_bias: "physical activity" },
      { name: "Tiger Stadium", description: "Death Valley — home of LSU football", lat: 30.4120, lon: -91.1840, radius_meters: 500, category_bias: "social connection" },
      { name: "PMAC", description: "Pete Maravich Assembly Center", lat: 30.4100, lon: -91.1850, radius_meters: 200, category_bias: "physical activity" },
      { name: "Free Speech Alley", description: "A place for open expression and creativity", lat: 30.4150, lon: -91.1770, radius_meters: 100, category_bias: "creativity" },
      { name: "The Quad at South", description: "Southern campus green space", lat: 30.4090, lon: -91.1760, radius_meters: 300, category_bias: "gratitude" },
      { name: "Nick's Cafe", description: "Classic campus diner", lat: 30.4085, lon: -91.1785, radius_meters: 150, category_bias: "kindness" },
    ];

    await hotspots.insertMany(
      defaultHotspots.map((h) => ({
        name: h.name,
        description: h.description,
        location: { type: "Point", coordinates: [h.lon, h.lat] },
        radius_meters: h.radius_meters,
        quest_ids: [],
        questq_ids: [],
        category_bias: h.category_bias,
        heat_score: 0,
        active: true,
        created_at: now,
      }))
    );
    console.log(`Seeded ${defaultHotspots.length} default hotspots`);
  }

  // Distribute quests across hotspots if quests are unanchored
  const unanchoredCount = await quests.countDocuments({ location: null, active: true });
  const totalQuestCount = await quests.countDocuments({ active: true });
  if (unanchoredCount === totalQuestCount && totalQuestCount > 0) {
    const allHotspotDocs = await hotspots.find().toArray();
    if (allHotspotDocs.length > 0) {
      const allQuestDocs = await quests.find({ active: true }).toArray();
      const globalCount = Math.max(1, Math.floor(allQuestDocs.length * 0.1));
      const toAssign = allQuestDocs.slice(globalCount); // first globalCount stay global

      const questOps = [];
      const hotspotQuestMap = new Map(); // hotspot _id -> quest _id[]

      for (let i = 0; i < toAssign.length; i++) {
        const hotspot = allHotspotDocs[i % allHotspotDocs.length];
        const questDoc = toAssign[i];

        questOps.push({
          updateOne: {
            filter: { _id: questDoc._id },
            update: {
              $set: {
                hotspot_id: hotspot._id,
                location: hotspot.location,
              },
            },
          },
        });

        const hid = hotspot._id.toString();
        if (!hotspotQuestMap.has(hid)) hotspotQuestMap.set(hid, []);
        hotspotQuestMap.get(hid).push(questDoc._id);
      }

      if (questOps.length > 0) await quests.bulkWrite(questOps);

      const hotspotOps = [];
      for (const [hid, questIds] of hotspotQuestMap) {
        hotspotOps.push({
          updateOne: {
            filter: { _id: new ObjectId(hid) },
            update: { $set: { quest_ids: questIds } },
          },
        });
      }
      if (hotspotOps.length > 0) await hotspots.bulkWrite(hotspotOps);

      console.log(`Distributed ${toAssign.length} quests across ${allHotspotDocs.length} hotspots (${globalCount} kept global)`);
    }
  }
}

async function connect(uri) {
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db("happystreet");
  await ensureSeedData();
  console.log("MongoDB connected");
}

// --- Quests ---
async function getQuests() {
  const docs = await db.collection("questTable").find().toArray();
  return docs.map(normalizeQuest);
}

async function createQuest(title, value = 100, category = DEFAULT_CATEGORY, extra = {}) {
  const now = new Date();
  const normalizedCategory = normalizeCategory(category);
  const safeCategory = isValidCategory(normalizedCategory) ? normalizedCategory : DEFAULT_CATEGORY;
  const result = await db.collection("questTable").insertOne({
    title,
    value,
    completions: 0,
    category: safeCategory,
    difficulty_tier: extra.difficulty_tier || "medium",
    coin_reward: extra.coin_reward ?? 15,
    source: extra.source || "community",
    pack: extra.pack || null,
    hotspot_id: extra.hotspot_id || null,
    location: extra.location || null,
    radius_meters: extra.radius_meters ?? 500,
    active: true,
    created_at: now,
  });
  const doc = await db.collection("questTable").findOne({ _id: result.insertedId });
  return normalizeQuest(doc);
}

async function completeQuest(questId, options = {}) {
  const { happinessRating, userId, hotspotId } = options;
  let oid;
  try {
    oid = new ObjectId(questId);
  } catch {
    return null;
  }

  const quests = db.collection("questTable");
  const doc = await quests.findOneAndUpdate(
    { _id: oid },
    [
      {
        $set: {
          completions: { $add: [{ $ifNull: ["$completions", 0] }, 1] },
          value: {
            $max: [0, { $subtract: [{ $ifNull: ["$value", 0] }, VALUE_DROP] }],
          },
          category: { $ifNull: ["$category", DEFAULT_CATEGORY] },
          updatedAt: "$$NOW",
        },
      },
    ],
    { returnDocument: "after" }
  );
  if (!doc) return null;

  await quests.updateMany(
    { _id: { $ne: oid } },
    [
      {
        $set: {
          value: { $add: [{ $ifNull: ["$value", 0] }, VALUE_RISE] },
          category: { $ifNull: ["$category", DEFAULT_CATEGORY] },
          updatedAt: "$$NOW",
        },
      },
    ]
  );

  const completedCategory = normalizeCategory(doc.category) || DEFAULT_CATEGORY;
  const meta = CATEGORY_MAP[completedCategory];
  const rating = Number.isFinite(happinessRating) ? Math.max(1, Math.min(5, happinessRating)) : null;

  // Update category with happiness data
  const categoryUpdate = {
    $inc: { totalCompletions: 1 },
    $set: { updatedAt: new Date() },
    $setOnInsert: {
      name: completedCategory,
      displayName: meta ? meta.displayName : completedCategory,
      price: 100,
      totalCompletions: 0,
      totalHappinessScore: 0,
      avgHappiness: 0,
      createdAt: new Date(),
    },
  };
  if (rating) {
    categoryUpdate.$inc.totalHappinessScore = rating;
  }
  await db.collection("categories").updateOne(
    { name: completedCategory },
    categoryUpdate,
    { upsert: true }
  );

  // Recompute avgHappiness from the updated totals
  if (rating) {
    const catDoc = await db.collection("categories").findOne({ name: completedCategory });
    if (catDoc && catDoc.totalCompletions > 0) {
      const avg = (catDoc.totalHappinessScore || 0) / catDoc.totalCompletions;
      await db.collection("categories").updateOne(
        { _id: catDoc._id },
        { $set: { avgHappiness: Math.round(avg * 100) / 100 } }
      );
    }
  }

  const normalizedQuest = normalizeQuest(doc);
  const coinReward = normalizedQuest.coin_reward || 0;

  // Record the completion
  await recordCompletion({
    questId: oid.toString(),
    userId: userId || "anonymous",
    category: completedCategory,
    happinessRating: rating,
    coinReward,
    hotspotId: hotspotId || normalizedQuest.hotspot_id || null,
  });

  // Award JoyCoins to user
  if (userId && userId !== "anonymous" && coinReward > 0) {
    try {
      const userOid = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
      if (userOid) {
        await db.collection("userTable").updateOne(
          { _id: userOid },
          {
            $inc: { joy_coins: coinReward, total_completions: 1 },
            $set: { streak_last_date: new Date() },
          }
        );
      }
    } catch { /* user not found is non-fatal */ }
  }

  return normalizedQuest;
}

async function recordCompletion({ questId, userId, category, happinessRating, coinReward, hotspotId, lat, lon }) {
  const doc = {
    quest_id: questId,
    user_id: userId || "anonymous",
    category,
    happiness_rating: happinessRating ?? null,
    coin_reward: coinReward || 0,
    hotspot_id: hotspotId || null,
    location: (Number.isFinite(lat) && Number.isFinite(lon))
      ? { type: "Point", coordinates: [lon, lat] }
      : null,
    completed_at: new Date(),
  };
  await db.collection("completions").insertOne(doc);
  return doc;
}

// --- Nearby Quests (geo-aware) ---
async function getNearbyQuests({ lat, lon, radius = 1000, category, difficulty, limit = 20, hotspotId }) {
  const quests = db.collection("questTable");
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 20;
  const normalizedCategory = normalizeCategory(category);
  const categoryFilter = normalizedCategory && isValidCategory(normalizedCategory)
    ? normalizedCategory
    : null;
  const baseFilter = { active: true };
  if (categoryFilter) baseFilter.category = categoryFilter;
  if (difficulty) baseFilter.difficulty_tier = difficulty;

  if (hotspotId) {
    const hotspot = await getHotspotById(hotspotId);
    const hotspotQuestIds = Array.isArray(hotspot?.quest_ids) ? hotspot.quest_ids.map(String) : [];

    const hotspotOr = [{ hotspot_id: hotspotId }];
    if (ObjectId.isValid(String(hotspotId))) {
      hotspotOr.push({ hotspot_id: new ObjectId(String(hotspotId)) });
    }

    const byHotspotField = await quests.find({ ...baseFilter, $or: hotspotOr }).toArray();

    let byHotspotQuestIds = [];
    if (hotspotQuestIds.length > 0) {
      const objectQuestIds = hotspotQuestIds
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      const questIdOr = [];
      if (objectQuestIds.length > 0) questIdOr.push({ _id: { $in: objectQuestIds } });
      questIdOr.push({ id: { $in: hotspotQuestIds } });

      byHotspotQuestIds = await quests.find({ ...baseFilter, $or: questIdOr }).toArray();
    }

    const mergedById = new Map();
    for (const doc of byHotspotField) {
      mergedById.set(doc._id.toString(), doc);
    }
    for (const doc of byHotspotQuestIds) {
      mergedById.set(doc._id.toString(), doc);
    }

    const orderedDocs = Array.from(mergedById.values());
    if (hotspotQuestIds.length > 0) {
      const questIdRank = new Map(hotspotQuestIds.map((id, index) => [String(id), index]));
      orderedDocs.sort((a, b) => {
        const aRank = questIdRank.has(a._id.toString()) ? questIdRank.get(a._id.toString()) : Number.MAX_SAFE_INTEGER;
        const bRank = questIdRank.has(b._id.toString()) ? questIdRank.get(b._id.toString()) : Number.MAX_SAFE_INTEGER;
        return aRank - bRank;
      });
    }

    return orderedDocs.slice(0, safeLimit).map((doc) => ({
      ...normalizeQuest(doc),
      distance_meters: null,
    }));
  }

  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
  if (!hasCoords) {
    const globalOnly = await quests.find({ ...baseFilter, location: null }).limit(safeLimit).toArray();
    return globalOnly.map((doc) => ({
      ...normalizeQuest(doc),
      distance_meters: null,
    }));
  }

  // 1) Geo-located quests within radius via $geoNear aggregation
  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lon, lat] },
        distanceField: "distance_meters",
        maxDistance: radius,
        spherical: true,
        query: baseFilter,
      },
    },
  ];
  pipeline.push({ $limit: safeLimit });

  const geoQuests = await quests.aggregate(pipeline).toArray();

  // 2) Global quests (location is null) — always included
  const globalFilter = { ...baseFilter, location: null };

  const globalQuests = await quests.find(globalFilter).limit(safeLimit).toArray();

  // 3) Merge: geo quests first (sorted by distance), then globals, trim to limit
  const normalizedGeo = geoQuests.map((doc) => ({
    ...normalizeQuest(doc),
    distance_meters: Math.round(doc.distance_meters),
  }));

  const normalizedGlobal = globalQuests.map((doc) => ({
    ...normalizeQuest(doc),
    distance_meters: null,
  }));

  if (normalizedGeo.length === 0) {
    return normalizedGlobal.slice(0, safeLimit);
  }

  if (normalizedGlobal.length === 0) {
    return normalizedGeo.slice(0, safeLimit);
  }

  // Preserve nearest-first geo sorting while always mixing in at least one global quest.
  let takeGlobal = 1;
  let takeGeo = Math.min(normalizedGeo.length, safeLimit - takeGlobal);
  let remaining = safeLimit - takeGeo - takeGlobal;

  if (remaining > 0) {
    const extraGeo = Math.min(remaining, normalizedGeo.length - takeGeo);
    takeGeo += extraGeo;
    remaining -= extraGeo;
  }

  if (remaining > 0) {
    const extraGlobal = Math.min(remaining, normalizedGlobal.length - takeGlobal);
    takeGlobal += extraGlobal;
  }

  return [
    ...normalizedGeo.slice(0, takeGeo),
    ...normalizedGlobal.slice(0, takeGlobal),
  ];
}

// --- Users ---
async function getUser(userId) {
  return await db.collection("userTable").findOne({ _id: new ObjectId(userId) });
}

async function getUserByUsername(username) {
  return await db.collection("userTable").findOne({ username });
}

async function createUser(username, pword_hash) {
  const result = await db.collection("userTable").insertOne({ username, pword_hash, balance: 100, lat: null, lon: null, collections: [] });
  return await db.collection("userTable").findOne({ _id: result.insertedId });
}

async function updateUserLocation(userId, lat, lon) {
  return await db.collection("userTable").findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: { lat, lon } },
    { returnDocument: "after" }
  );
}

async function updateUserBalance(userId, amount) {
  return await db.collection("userTable").findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $inc: { balance: amount } },
    { returnDocument: "after" }
  );
}

// --- Hotspots ---
async function getHotspots() {
  const docs = await db.collection("hotspotTable").find().toArray();
  return docs.map(normalizeHotspot);
}
async function getHotspotById(id) {
  const hotspots = db.collection("hotspotTable");
  const idText = String(id).trim();
  let doc = null;

  if (/^-?\d+$/.test(idText)) {
    doc = await hotspots.findOne({ id: parseInt(idText, 10) });
  }

  // Backward compatibility for mock-style IDs like hotspot_002.
  if (!doc) {
    const legacyMatch = /^hotspot_(\d+)$/i.exec(idText);
    if (legacyMatch) {
      doc = await hotspots.findOne({ id: parseInt(legacyMatch[1], 10) });
    }
  }

  if (!doc && ObjectId.isValid(idText)) {
    doc = await hotspots.findOne({ _id: new ObjectId(idText) });
  }

  // Allow string ids in `id` for mixed datasets.
  if (!doc) {
    doc = await hotspots.findOne({ id: idText });
  }
  if (!doc) {
    doc = await hotspots.findOne({ _id: id });
  }

  return normalizeHotspot(doc);
}

async function createHotspot(name, lat, lon, optionsOrRadius = {}) {
  const options =
    typeof optionsOrRadius === "number"
      ? { radius: optionsOrRadius }
      : (optionsOrRadius || {});
  const hotspots = db.collection("hotspotTable");
  const latest = await hotspots.find({ id: { $type: "number" } }).sort({ id: -1 }).limit(1).toArray();
  const nextId = latest.length > 0 ? latest[0].id + 1 : 0;

  const radiusMeters = options.radius_meters || options.radius || 80;
  const result = await hotspots.insertOne({
    id: nextId,
    name,
    description: options.description || "",
    location: { type: "Point", coordinates: [lon, lat] },
    radius_meters: radiusMeters,
    radius: radiusMeters,
    quest_ids: [],
    questq_ids: [],
    category_bias: options.category_bias || null,
    heat_score: 0,
    active: true,
    created_at: new Date(),
  });
  const doc = await hotspots.findOne({ _id: result.insertedId });
  return normalizeHotspot(doc);
}

// --- Tunnels (Exchanges) ---
async function getTunnel(tunnelId) {
  return await db.collection("tunnelTable").findOne({ _id: new ObjectId(tunnelId) });
}

async function createTunnel(quest_id, recipient_id, hotspot_id) {
  const result = await db.collection("tunnelTable").insertOne({
    quest_id, hotspot_id, recipient_id,
    offerer_id: null, status: "OPEN",
    recipient_desc: null, completed: null,
  });
  return await db.collection("tunnelTable").findOne({ _id: result.insertedId });
}

async function updateTunnelStatus(tunnelId, status, extra = {}) {
  return await db.collection("tunnelTable").findOneAndUpdate(
    { _id: new ObjectId(tunnelId) },
    { $set: { status, ...extra } },
    { returnDocument: "after" }
  );
}
async function deleteTunnel(tunnelId) {
  return await db.collection("tunnelTable").deleteOne({ _id: new ObjectId(tunnelId) });
}

async function getNearbyHotspots(lat, lon, radius = 10000) {
  const hotspots = db.collection("hotspotTable");

  try {
    const docs = await hotspots.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lon, lat] },
          distanceField: "distance_meters",
          maxDistance: radius,
          spherical: true,
        },
      },
    ]).toArray();

    return docs.map((doc) => ({
      ...normalizeHotspot(doc),
      distance_meters: Math.round(doc.distance_meters),
    }));
  } catch (err) {
    // Fallback to in-memory filter if $geoNear fails (e.g. missing index or no geo docs)
    console.error("$geoNear hotspot query failed, falling back to in-memory:", err.message);
    const allDocs = await hotspots.find().toArray();
    return allDocs
      .map(normalizeHotspot)
      .filter(Boolean)
      .map((h) => {
        if (!Number.isFinite(h.lat) || !Number.isFinite(h.lon)) return null;
        const distance = haversineMeters(lat, lon, h.lat, h.lon);
        if (distance > radius) return null;
        return { ...h, distance_meters: Math.round(distance) };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance_meters - b.distance_meters);
  }
}

async function removeRecipientFromQueue(questId, userId) {
  if (!questId || !userId) return;
  const questIdText = String(questId);
  const userIdText = String(userId);
  const hotspots = db.collection("hotspotTable");

  await hotspots.updateMany(
    { "questq_ids.quest_id": questIdText },
    { $pull: { "questq_ids.$[entry].recipient_ids": userIdText } },
    { arrayFilters: [{ "entry.quest_id": questIdText }] }
  );

  await hotspots.updateMany(
    { "questq_ids": { $elemMatch: { quest_id: questIdText, recipient_ids: { $size: 0 } } } },
    { $pull: { questq_ids: { quest_id: questIdText, recipient_ids: { $size: 0 } } } }
  );
}

async function joinQuestQueue(hotspotId, questId, userId) {
  const hotspot = await getHotspotById(hotspotId);
  if (!hotspot || !questId || !userId) return null;

  const hotspots = db.collection("hotspotTable");
  const targetId = ObjectId.isValid(String(hotspot._id))
    ? new ObjectId(String(hotspot._id))
    : hotspot._id;

  const queueEntries = Array.isArray(hotspot.questq_ids) ? hotspot.questq_ids : [];
  const matchedEntry = queueEntries.find((entry) => String(entry?.quest_id) === String(questId));

  if (matchedEntry) {
    await hotspots.updateOne(
      { _id: targetId },
      { $addToSet: { "questq_ids.$[q].recipient_ids": String(userId) } },
      { arrayFilters: [{ "q.quest_id": matchedEntry.quest_id }] }
    );
  } else {
    await hotspots.updateOne(
      { _id: targetId },
      {
        $push: {
          questq_ids: {
            quest_id: String(questId),
            recipient_ids: [String(userId)],
          },
        },
      }
    );
  }

  return await getHotspotById(hotspot._id);
}

async function acquireQuestRecipientForCompletion(questId, requestedRecipientId) {
  const hotspots = db.collection("hotspotTable");
  const allHotspots = await hotspots.find().toArray();
  const questIdText = String(questId);
  const requestedText = requestedRecipientId == null ? null : String(requestedRecipientId);

  for (const hotspot of allHotspots) {
    const queueEntries = Array.isArray(hotspot.questq_ids) ? hotspot.questq_ids : [];
    for (const entry of queueEntries) {
      if (!entry || String(entry.quest_id) !== questIdText) continue;
      const recipients = Array.isArray(entry.recipient_ids) ? entry.recipient_ids : [];
      if (recipients.length === 0) continue;

      let recipientValue = recipients[0];
      if (requestedText != null) {
        const matched = recipients.find((candidate) => String(candidate) === requestedText);
        if (matched == null) continue;
        recipientValue = matched;
      }

      const dequeue = await hotspots.updateOne(
        { _id: hotspot._id },
        { $pull: { "questq_ids.$[q].recipient_ids": recipientValue } },
        { arrayFilters: [{ "q.quest_id": entry.quest_id }] }
      );

      if (dequeue.modifiedCount === 0) continue;

      await hotspots.updateOne(
        { _id: hotspot._id },
        { $pull: { questq_ids: { quest_id: entry.quest_id, recipient_ids: [] } } }
      );

      const refreshed = await hotspots.findOne({ _id: hotspot._id });
      return {
        hotspot: normalizeHotspot(refreshed),
        hotspot_id: hotspot._id.toString(),
        recipient_id: recipientValue,
        quest_key: entry.quest_id,
      };
    }
  }

  return null;
}

async function requeueQuestRecipient(hotspotId, questKey, recipientId) {
  const hotspots = db.collection("hotspotTable");
  const targetId = ObjectId.isValid(String(hotspotId)) ? new ObjectId(String(hotspotId)) : hotspotId;

  const restored = await hotspots.updateOne(
    { _id: targetId },
    {
      $push: {
        "questq_ids.$[q].recipient_ids": {
          $each: [recipientId],
          $position: 0,
        },
      },
    },
    { arrayFilters: [{ "q.quest_id": questKey }] }
  );

  if (restored.modifiedCount > 0) return;

  await hotspots.updateOne(
    { _id: targetId },
    {
      $push: {
        questq_ids: {
          quest_id: questKey,
          recipient_ids: [recipientId],
        },
      },
    }
  );
}

// --- Market / Leaderboard / Stats ---
function getDb() { return db; }

async function getAllStocks() {
  return await db.collection("stocks").find().toArray();
}

async function getStockByTicker(ticker) {
  return await db.collection("stocks").findOne({ ticker: ticker.toUpperCase() });
}

async function getCategories() {
  return await db.collection("categories").find().toArray();
}

async function getLeaderboard(limit = 20) {
  const docs = await db.collection("userTable")
    .find({})
    .sort({ joy_coins: -1 })
    .limit(limit)
    .project({ pword_hash: 0 })
    .toArray();
  return docs.map((doc, i) => ({
    rank: i + 1,
    userId: doc._id.toString(),
    username: doc.username,
    joy_coins: doc.joy_coins || 0,
    total_completions: doc.total_completions || 0,
  }));
}

async function getUserStats(userId) {
  let doc = null;
  if (ObjectId.isValid(userId)) {
    doc = await db.collection("userTable").findOne(
      { _id: new ObjectId(userId) },
      { projection: { pword_hash: 0 } }
    );
  }
  if (!doc) {
    doc = await db.collection("userTable").findOne(
      { username: userId },
      { projection: { pword_hash: 0 } }
    );
  }
  if (!doc) return null;

  const recentCompletions = await db.collection("completions")
    .find({ user_id: doc._id.toString() })
    .sort({ completed_at: -1 })
    .limit(10)
    .toArray();

  return {
    userId: doc._id.toString(),
    username: doc.username,
    joy_coins: doc.joy_coins || 0,
    total_completions: doc.total_completions || 0,
    streak_current: doc.streak_current || 0,
    recent_completions: recentCompletions,
  };
}

module.exports = {
  DEFAULT_CATEGORY,
  isValidCategory,
  connect,
  collection: (name) => db.collection(name),
  getDb,
  getQuests, createQuest, completeQuest, recordCompletion, getNearbyQuests,
  getUser, getUserByUsername, createUser, updateUserLocation, updateUserBalance,
  getHotspots, createHotspot, getHotspotById, getNearbyHotspots, removeRecipientFromQueue,
  joinQuestQueue,
  acquireQuestRecipientForCompletion, requeueQuestRecipient,
  getTunnel, createTunnel, updateTunnelStatus, deleteTunnel,
  getAllStocks, getStockByTicker, getCategories, getLeaderboard, getUserStats,
};
