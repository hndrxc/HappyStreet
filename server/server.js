require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const MAX_JSON_BODY_BYTES = 1024 * 1024; // 1MB

const server = http.createServer(requestHandler);
const io = new Server(server, { cors: { origin: "*" } });

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function verifyToken(req) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
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

    if (url.pathname === "/auth/register") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }

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

      const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";
      if (username.length < 3) {
        sendJson(res, 400, { error: "Username must be at least 3 characters" });
        return;
      }
      if (password.length < 4) {
        sendJson(res, 400, { error: "Password must be at least 4 characters" });
        return;
      }

      const existing = await db.getUserByUsername(username);
      if (existing) {
        sendJson(res, 409, { error: "Username already taken" });
        return;
      }

      const hash = await bcrypt.hash(password, 10);
      const newUser = await db.createUser(username, hash);
      const token = jwt.sign(
        { userId: newUser._id.toString(), username: newUser.username },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      sendJson(res, 201, {
        token,
        user: { id: newUser._id.toString(), username: newUser.username, balance: newUser.balance },
      });
      return;
    }

    if (url.pathname === "/auth/login") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }

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

      const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";
      if (!username || !password) {
        sendJson(res, 400, { error: "Username and password required" });
        return;
      }

      const user = await db.getUserByUsername(username);
      if (!user) {
        sendJson(res, 401, { error: "Invalid username or password" });
        return;
      }

      const match = await bcrypt.compare(password, user.pword_hash);
      if (!match) {
        sendJson(res, 401, { error: "Invalid username or password" });
        return;
      }

      const token = jwt.sign(
        { userId: user._id.toString(), username: user.username },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      sendJson(res, 200, {
        token,
        user: { id: user._id.toString(), username: user.username, balance: user.balance },
      });
      return;
    }

    if (url.pathname === "/auth/me") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }

      const payload = verifyToken(req);
      if (!payload) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }

      const user = await db.getUser(payload.userId);
      if (!user) {
        sendJson(res, 404, { error: "User not found" });
        return;
      }

      sendJson(res, 200, {
        id: user._id.toString(),
        username: user.username,
        balance: user.balance,
      });
      return;
    }

    if (url.pathname === "/auth/logout") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }
      sendJson(res, 200, { success: true });
      return;
    }

    if (url.pathname === "/quests") {
      if (req.method === "GET") {
        const quests = await db.getQuests();
        sendJson(res, 200, quests);
        return;
      }

      if (req.method === "POST") {
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

      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    if (url.pathname === "/hotspots/nearby") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }

      const lat = parseFloat(url.searchParams.get("lat"));
      const lon = parseFloat(url.searchParams.get("lon"));
      const radiusParam = parseFloat(url.searchParams.get("radius"));
      const radius = Number.isFinite(radiusParam) && radiusParam > 0 ? radiusParam : 10000;

      if (isNaN(lat) || isNaN(lon)) {
        sendJson(res, 400, { error: "lat and lon query params required" });
        return;
      }
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        sendJson(res, 400, { error: "lat must be -90..90, lon must be -180..180" });
        return;
      }

      console.log("[API] GET /hotspots/nearby", { lat, lon, radius });
      const hotspots = await db.getNearbyHotspots(lat, lon, radius);
      console.log("[API] GET /hotspots/nearby result", { count: hotspots.length });
      sendJson(res, 200, hotspots);
      return;
    }

    if (url.pathname === "/quests/nearby") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }

      const lat = parseFloat(url.searchParams.get("lat"));
      const lon = parseFloat(url.searchParams.get("lon"));
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

      const radiusParam = parseFloat(url.searchParams.get("radius"));
      const radius = Number.isFinite(radiusParam) && radiusParam > 0 ? radiusParam : 1000;
      const limitParam = parseInt(url.searchParams.get("limit"), 10);
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20;
      const category = url.searchParams.get("category") || undefined;
      const difficulty = url.searchParams.get("difficulty") || undefined;
      const hotspotId = url.searchParams.get("hotspot_id") || undefined;

      if (!hasCoords && !hotspotId) {
        sendJson(res, 400, { error: "lat/lon or hotspot_id query params required" });
        return;
      }

      if (hasCoords && (lat < -90 || lat > 90 || lon < -180 || lon > 180)) {
        sendJson(res, 400, { error: "lat must be -90..90, lon must be -180..180" });
        return;
      }

      const quests = await db.getNearbyQuests({
        lat: hasCoords ? lat : undefined,
        lon: hasCoords ? lon : undefined,
        radius,
        category,
        difficulty,
        hotspotId,
        limit,
      });
      sendJson(res, 200, quests);
      return;
    }

    if (url.pathname.startsWith("/hotspots/")) {
      const id = url.pathname.slice("/hotspots/".length);
      if (req.method === "GET") {
        console.log("[API] GET /hotspots/:id", { id });
        const hotspot = await db.getHotspotById(id);
        if (!hotspot) {
          console.log("[API] GET /hotspots/:id result", { found: false });
          sendJson(res, 404, { error: "not found" });
          return;
        }
        console.log("[API] GET /hotspots/:id result", { found: true, hotspotId: hotspot._id || hotspot.id });
        sendJson(res, 200, hotspot);
        return;
      }
      sendJson(res, 405, { error: "Method not allowed" });
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

  socket.on("update_location", async ({ lat, lon }) => {
    try {
      const hotspots = await db.getNearbyHotspots(lat, lon);
      socket.emit("hotspots_init", hotspots);
    } catch (err) {
      console.error("update_location failed:", err);
    }
  });

  socket.on("join_quest", async (payload) => {
    try {
      const questId = payload?.questId;
      const userId = payload?.userId;
      const hotspotId = payload?.hotspotId;
      if (!questId || !userId || !hotspotId) return;

      const hotspot = await db.joinQuestQueue(hotspotId, questId, userId);
      if (!hotspot) return;

      io.emit("hotspot_updated", {
        hotspot_id: hotspot._id || hotspot.id,
        name: hotspot.name,
        heat_score: hotspot.heat_score || 0,
        questq_ids: hotspot.questq_ids || [],
        quest_ids: hotspot.quest_ids || [],
      });
    } catch (err) {
      console.error("join_quest failed:", err);
    }
  });

  socket.on("complete_quest", async (payload) => {
    try {
      const questId = typeof payload === "string" ? payload : payload?.questId;
      if (!questId) return;
      const requestedRecipientId =
        typeof payload === "object"
          ? (payload?.recipientId ?? payload?.userId ?? null)
          : null;

      const queueAssignment = await db.acquireQuestRecipientForCompletion(
        questId,
        requestedRecipientId
      );
      if (!queueAssignment) {
        socket.emit("quest_completion_rejected", {
          questId,
          reason: "no_recipient_available",
        });
        return;
      }

      const updated = await db.completeQuest(questId);
      if (!updated) {
        await db.requeueQuestRecipient(
          queueAssignment.hotspot_id,
          queueAssignment.quest_key,
          queueAssignment.recipient_id
        );
        socket.emit("quest_completion_rejected", {
          questId,
          reason: "quest_not_found",
        });
        return;
      }

      io.emit("quests_updated", await db.getQuests());
      io.emit("quest_completed", {
        quest: updated,
        by: socket.id,
        recipient_id: queueAssignment.recipient_id,
      });
      if (queueAssignment.hotspot) {
        io.emit("hotspot_updated", {
          hotspot_id: queueAssignment.hotspot._id || queueAssignment.hotspot.id,
          name: queueAssignment.hotspot.name,
          heat_score: queueAssignment.hotspot.heat_score || 0,
          questq_ids: queueAssignment.hotspot.questq_ids || [],
          quest_ids: queueAssignment.hotspot.quest_ids || [],
        });
      }
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
