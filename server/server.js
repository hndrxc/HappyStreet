const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());

// --- In-memory store (swap with Postgres later) ---
let quests = [
  { id: 1, title: "Go for a walk", value: 100, completions: 0 },
  { id: 2, title: "Call a friend", value: 100, completions: 0 },
  { id: 3, title: "Cook a meal", value: 100, completions: 0 },
];

const VALUE_DROP    = 20;  // how much completing a quest drops its own value
const VALUE_RISE    = 5;   // how much completing a quest raises all others

// --- Value logic ---
function completeQuest(questId) {
  const quest = quests.find(q => q.id === questId);
  if (!quest) return null;

  quest.completions += 1;
  quest.value = Math.max(0, quest.value - VALUE_DROP);

  quests
    .filter(q => q.id !== questId)
    .forEach(q => { q.value += VALUE_RISE; });

  return quest;
}

// --- REST ---
app.get("/quests", (req, res) => {
  res.json(quests);
});

app.post("/quests", (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });

  const quest = {
    id: quests.length + 1,
    title,
    value: 100,
    completions: 0,
  };
  quests.push(quest);

  io.emit("quest_added", quest);         // broadcast to all clients
  res.status(201).json(quest);
});
panel-73-8
// --- Socket.io ---
io.on("connection", (socket) => {
  console.log("client connected:", socket.id);

  // Send current state on connect
  socket.emit("quests_init", quests);

  // Client emits this when a quest is completed
  socket.on("complete_quest", (questId) => {
    const updated = completeQuest(questId);
    if (!updated) return;

    // Broadcast updated full quest list to everyone
    io.emit("quests_updated", quests);

    // Also emit the specific quest that was completed
    io.emit("quest_completed", { quest: updated, by: socket.id });
  });

  socket.on("disconnect", () => {
    console.log("client disconnected:", socket.id);
  });
});

// --- Start ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});