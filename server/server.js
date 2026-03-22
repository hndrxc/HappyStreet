require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const db = require("./db");

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const MAX_JSON_BODY_BYTES = 1024 * 1024; // 1MB

const server = http.createServer(requestHandler);
const io = new Server(server, { cors: { origin: "*" } });

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    let settled = false;

    req.on("data", (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_JSON_BODY_BYTES) {
        settled = true;
        reject({ statusCode: 413, message: "payload too large" });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (settled) return;
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject({ statusCode: 400, message: "invalid json" });
      }
    });

    req.on("error", (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

async function requestHandler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && url.pathname === "/quests") {
      const quests = await db.getQuests();
      sendJson(res, 200, quests);
      return;
    }

    if (req.method === "POST" && url.pathname === "/quests") {
      let body;
      try {
        body = await parseJsonBody(req);
      } catch (err) {
        if (err && err.statusCode) {
          sendJson(res, err.statusCode, { error: err.message });
          return;
        }
        throw err;
      }

      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) {
        sendJson(res, 400, { error: "title required" });
        return;
      }

      if (body.category !== undefined && typeof body.category !== "string") {
        sendJson(res, 400, { error: "category must be a string" });
        return;
      }

      const categoryInput = typeof body.category === "string" ? body.category.trim() : "";
      if (categoryInput && !db.isValidCategory(categoryInput)) {
        sendJson(res, 400, { error: "invalid category" });
        return;
      }
      const category = categoryInput || db.DEFAULT_CATEGORY;

      const quest = await db.createQuest(title, 100, category);
      io.emit("quest_added", quest);
      sendJson(res, 201, quest);
      return;
    }

    sendJson(res, 404, { error: "not found" });
  } catch (err) {
    console.error("request handling failed:", err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "internal server error" });
    } else {
      res.end();
    }
  }
}

// --- Socket.io ---
io.on("connection", async (socket) => {
  console.log("client connected:", socket.id);
  try {
    socket.emit("quests_init", await db.getQuests());
  } catch (err) {
    console.error("failed to emit quests_init:", err);
  }

  socket.on("complete_quest", async (questId) => {
    try {
      const updated = await db.completeQuest(questId);
      if (!updated) return;
      io.emit("quests_updated", await db.getQuests());
      io.emit("quest_completed", { quest: updated, by: socket.id });
    } catch (err) {
      console.error("complete_quest failed:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("client disconnected:", socket.id);
  });
});

// --- Start ---
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

db.connect(MONGODB_URI).then(() => {
  server.listen(PORT, () => console.log(`server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error("MongoDB connection failed:", err);
  process.exit(1);
});
