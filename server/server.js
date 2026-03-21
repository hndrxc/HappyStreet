require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());

// --- REST ---
app.get("/quests", async (req, res) => {
  const quests = await db.getQuests();
  res.json(quests);
});

app.post("/quests", async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  const quest = await db.createQuest(title);
  io.emit("quest_added", quest);
  res.status(201).json(quest);
});

// --- Socket.io ---
io.on("connection", async (socket) => {
  console.log("client connected:", socket.id);
  socket.emit("quests_init", await db.getQuests());

  socket.on("complete_quest", async (questId) => {
    const updated = await db.completeQuest(questId);
    if (!updated) return;
    io.emit("quests_updated", await db.getQuests());
    io.emit("quest_completed", { quest: updated, by: socket.id });
  });

  socket.on("disconnect", () => {
    console.log("client disconnected:", socket.id);
  });
});

// --- Start ---
const PORT = process.env.PORT || 3001;

db.connect(process.env.MONGO_URI).then(() => {
  server.listen(PORT, () => console.log(`server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error("MongoDB connection failed:", err);
  process.exit(1);
});