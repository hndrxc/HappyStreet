require("dotenv").config();
const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  console.log("connected");

  const db = client.db();
  const quests = db.collection("questTable");

  // READ
  const all = await quests.find().toArray();
  console.log("quests:", all);

  // INSERT
  const result = await quests.insertOne({ title: "test quest", value: 100, completions: 0 });
  console.log("inserted:", result.insertedId);

  // UPDATE
  await quests.updateOne({ _id: result.insertedId }, { $set: { value: 80 } });
  const updated = await quests.findOne({ _id: result.insertedId });
  console.log("updated value:", updated.value);

  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });