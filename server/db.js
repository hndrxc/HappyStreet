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

  // Keep old quest docs compatible with Phase 1 category requirements.
  await quests.updateMany(
    { $or: [{ category: { $exists: false } }, { category: null }] },
    { $set: { category: DEFAULT_CATEGORY, updatedAt: now } }
  );

  // Migrate legacy underscore category names to canonical Phase 1 names.
  for (const [legacy, canonical] of Object.entries(CATEGORY_ALIASES)) {
    await quests.updateMany(
      { category: legacy },
      { $set: { category: canonical, updatedAt: now } }
    );
  }

  // Backfill new fields on quests that predate Phase 1.
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

  // Geospatial index for /quests/nearby — idempotent, null locations auto-excluded.
  await quests.createIndex({ location: "2dsphere" });
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

async function completeQuest(questId) {
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
  await db.collection("categories").updateOne(
    { name: completedCategory },
    {
      $inc: { totalCompletions: 1 },
      $set: { updatedAt: new Date() },
      $setOnInsert: {
        name: completedCategory,
        displayName: meta ? meta.displayName : completedCategory,
        price: 100,
        totalCompletions: 0,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return normalizeQuest(doc);
}

// --- Nearby Quests (geo-aware) ---
async function getNearbyQuests({ lat, lon, radius = 1000, category, difficulty, limit = 20 }) {
  const quests = db.collection("questTable");
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 20;
  const normalizedCategory = normalizeCategory(category);
  const categoryFilter = normalizedCategory && isValidCategory(normalizedCategory)
    ? normalizedCategory
    : null;

  // 1) Geo-located quests within radius via $geoNear aggregation
  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lon, lat] },
        distanceField: "distance_meters",
        maxDistance: radius,
        spherical: true,
        query: { active: true },
      },
    },
  ];
  if (categoryFilter) pipeline.push({ $match: { category: categoryFilter } });
  if (difficulty) pipeline.push({ $match: { difficulty_tier: difficulty } });
  pipeline.push({ $limit: safeLimit });

  const geoQuests = await quests.aggregate(pipeline).toArray();

  // 2) Global quests (location is null) — always included
  const globalFilter = { location: null, active: true };
  if (categoryFilter) globalFilter.category = categoryFilter;
  if (difficulty) globalFilter.difficulty_tier = difficulty;

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
  return await db.collection("hotspotTable").find().toArray();
}

async function createHotspot(name, lat, lon, radius = 80) {
  const result = await db.collection("hotspotTable").insertOne({ name, lat, lon, radius, questq_ids: [] });
  return await db.collection("hotspotTable").findOne({ _id: result.insertedId });
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

module.exports = {
  DEFAULT_CATEGORY,
  isValidCategory,
  connect,
  getQuests, createQuest, completeQuest, getNearbyQuests,
  getUser, createUser, updateUserLocation, updateUserBalance,
  getHotspots, createHotspot,
  getTunnel, createTunnel, updateTunnelStatus,
};
