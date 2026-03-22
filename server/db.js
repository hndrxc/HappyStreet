const { MongoClient, ObjectId } = require("mongodb");

let db;

const DEFAULT_CATEGORY = "kindness";
const VALUE_DROP = 20;
const VALUE_RISE = 5;

const CATEGORY_DEFS = [
  { name: "kindness", displayName: "Kindness" },
  { name: "mindfulness", displayName: "Mindfulness" },
  { name: "social_connection", displayName: "Social Connection" },
  { name: "physical_activity", displayName: "Physical Activity" },
  { name: "creativity", displayName: "Creativity" },
  { name: "gratitude", displayName: "Gratitude" },
];

const CATEGORY_NAMES = CATEGORY_DEFS.map((c) => c.name);
const CATEGORY_MAP = Object.fromEntries(CATEGORY_DEFS.map((c) => [c.name, c]));

const DEFAULT_QUESTS = [
  { title: "Go for a walk", category: "physical_activity", value: 100, completions: 0 },
  { title: "Call a friend", category: "social_connection", value: 100, completions: 0 },
  { title: "Cook a meal", category: "creativity", value: 100, completions: 0 },
];

function isValidCategory(category) {
  return CATEGORY_NAMES.includes(category);
}

function normalizeQuest(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    category: rest.category || DEFAULT_CATEGORY,
    ...rest,
  };
}

async function ensureSeedData() {
  const quests = db.collection("questTable");
  const categories = db.collection("categories");
  const now = new Date();

  const questCount = await quests.countDocuments();
  if (questCount === 0) {
    await quests.insertMany(
      DEFAULT_QUESTS.map((q) => ({ ...q, createdAt: now, updatedAt: now }))
    );
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

async function createQuest(title, value = 100, category = DEFAULT_CATEGORY) {
  const now = new Date();
  const safeCategory = isValidCategory(category) ? category : DEFAULT_CATEGORY;
  const result = await db.collection("questTable").insertOne({
    title,
    value,
    completions: 0,
    category: safeCategory,
    createdAt: now,
    updatedAt: now,
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

  const completedCategory = doc.category || DEFAULT_CATEGORY;
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
  getQuests, createQuest, completeQuest,
  getUser, createUser, updateUserLocation, updateUserBalance,
  getHotspots, createHotspot,
  getTunnel, createTunnel, updateTunnelStatus,
};
