const { MongoClient, ObjectId } = require("mongodb");

let db;

async function connect(uri) {
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  console.log("MongoDB connected");
}

// --- Quests ---
async function getQuests() {
  return await db.collection("questTable").find().toArray();
}

async function createQuest(title, value = 100) {
  const result = await db.collection("questTable").insertOne({ title, value, completions: 0 });
  return await db.collection("questTable").findOne({ _id: result.insertedId });
}

async function completeQuest(questId) {
  const oid = new ObjectId(questId);
  const quest = await db.collection("questTable").findOneAndUpdate(
    { _id: oid },
    { $inc: { completions: 1, value: -20 } },
    { returnDocument: "after" }
  );
  await db.collection("questTable").updateMany(
    { _id: { $ne: oid } },
    { $inc: { value: 5 } }
  );
  return quest;
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
  connect,
  getQuests, createQuest, completeQuest,
  getUser, createUser, updateUserLocation, updateUserBalance,
  getHotspots, createHotspot,
  getTunnel, createTunnel, updateTunnelStatus,
};