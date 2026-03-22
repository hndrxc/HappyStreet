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
        joy_coins: user.joy_coins || 0,
        total_completions: user.total_completions || 0,
        hotspot_id: user.hotspot_id || null,
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

    if (url.pathname === "/hotspots") {
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

        const name = typeof body.name === "string" ? body.name.trim() : "";
        const lat = parseFloat(body.lat);
        const lon = parseFloat(body.lon);
        if (!name) {
          sendJson(res, 400, { error: "name required" });
          return;
        }
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          sendJson(res, 400, { error: "valid lat and lon required" });
          return;
        }
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          sendJson(res, 400, { error: "lat must be -90..90, lon must be -180..180" });
          return;
        }

        const hotspot = await db.createHotspot(name, lat, lon, {
          description: body.description || "",
          radius_meters: body.radius_meters || 500,
          category_bias: body.category_bias || null,
        });
        sendJson(res, 201, hotspot);
        return;
      }
      sendJson(res, 405, { error: "Method not allowed" });
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

    // --- Market routes ---
    if (url.pathname === "/market") {
      if (req.method !== "GET") { sendJson(res, 405, { error: "Method not allowed" }); return; }
      const stocks = await db.getAllStocks();
      sendJson(res, 200, stocks);
      return;
    }

    if (url.pathname.startsWith("/market/")) {
      const ticker = url.pathname.slice("/market/".length).toUpperCase();
      if (req.method !== "GET") { sendJson(res, 405, { error: "Method not allowed" }); return; }
      const stock = await db.getStockByTicker(ticker);
      if (!stock) { sendJson(res, 404, { error: "stock not found" }); return; }
      sendJson(res, 200, stock);
      return;
    }

    if (url.pathname === "/categories") {
      if (req.method !== "GET") { sendJson(res, 405, { error: "Method not allowed" }); return; }
      const cats = await db.getCategories();
      sendJson(res, 200, cats);
      return;
    }

    if (url.pathname === "/leaderboard") {
      if (req.method !== "GET") { sendJson(res, 405, { error: "Method not allowed" }); return; }
      const leaders = await db.getLeaderboard();
      sendJson(res, 200, leaders);
      return;
    }

    if (url.pathname.startsWith("/users/") && url.pathname.endsWith("/stats")) {
      const parts = url.pathname.split("/");
      const userId = parts[2];
      if (req.method !== "GET") { sendJson(res, 405, { error: "Method not allowed" }); return; }
      const stats = await db.getUserStats(userId);
      if (!stats) { sendJson(res, 404, { error: "user not found" }); return; }
      sendJson(res, 200, stats);
      return;
    }

    // GET /users/:userId/shares
    // POST /users/:userId/shares/:shareId/sell
    // POST /users/:userId/shares/sell-all
    if (url.pathname.startsWith("/users/") && url.pathname.includes("/shares")) {
      const parts = url.pathname.split("/"); // ["", "users", userId, "shares", ...]
      const userId = parts[2];

      if (url.pathname.endsWith("/shares") && req.method === "GET") {
        const payload = verifyToken(req);
        if (!payload || payload.userId !== userId) {
          sendJson(res, 401, { error: "Unauthorized" });
          return;
        }
        const shares = await db.getUserShares(userId);
        sendJson(res, 200, shares);
        return;
      }

      if (url.pathname.endsWith("/sell-all") && req.method === "POST") {
        const payload = verifyToken(req);
        if (!payload || payload.userId !== userId) {
          sendJson(res, 401, { error: "Unauthorized" });
          return;
        }
        const result = await db.sellAllUserShares(userId);
        sendJson(res, 200, result);
        return;
      }

      if (parts.length === 5 && parts[4] !== "sell-all" && req.method === "POST") {
        // POST /users/:userId/shares/:shareId/sell — but we're checking endsWith("/sell") via parts
      }

      if (parts.length === 6 && parts[5] === "sell" && req.method === "POST") {
        const shareId = parts[4];
        const payload = verifyToken(req);
        if (!payload || payload.userId !== userId) {
          sendJson(res, 401, { error: "Unauthorized" });
          return;
        }
        const result = await db.sellUserShare(shareId, userId);
        if (!result) { sendJson(res, 404, { error: "share not found" }); return; }
        sendJson(res, 200, result);
        return;
      }

      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    // GET /conversations  — get conversations for authenticated user
    // GET /conversations/:id/messages
    // POST /conversations/:id/messages
    // POST /conversations/:id/read
    if (url.pathname === "/unread-count") {
      if (req.method !== "GET") { sendJson(res, 405, { error: "Method not allowed" }); return; }
      const payload = verifyToken(req);
      if (!payload) { sendJson(res, 401, { error: "Unauthorized" }); return; }
      const count = await db.getUnreadCountsForUser(payload.userId);
      sendJson(res, 200, { unreadCount: count });
      return;
    }

    if (url.pathname === "/conversations") {
      if (req.method !== "GET") { sendJson(res, 405, { error: "Method not allowed" }); return; }
      const payload = verifyToken(req);
      if (!payload) { sendJson(res, 401, { error: "Unauthorized" }); return; }
      const conversations = await db.getConversationsByUser(payload.userId);
      sendJson(res, 200, conversations);
      return;
    }

    if (url.pathname.startsWith("/conversations/")) {
      const parts = url.pathname.split("/"); // ["", "conversations", id, "messages"]
      const convId = parts[2];

      if (parts[3] === "read" && req.method === "POST") {
        const payload = verifyToken(req);
        if (!payload) { sendJson(res, 401, { error: "Unauthorized" }); return; }
        await db.markMessagesRead(convId, payload.userId);
        sendJson(res, 200, { success: true });
        return;
      }

      if (parts[3] === "messages") {
        if (req.method === "GET") {
          const payload = verifyToken(req);
          if (!payload) { sendJson(res, 401, { error: "Unauthorized" }); return; }
          const messages = await db.getMessagesByConversation(convId);
          sendJson(res, 200, messages);
          return;
        }

        if (req.method === "POST") {
          const payload = verifyToken(req);
          if (!payload) { sendJson(res, 401, { error: "Unauthorized" }); return; }
          let body;
          try { body = await parseJsonBody(req); }
          catch (err) {
            if (err && err.statusCode) { sendJson(res, err.statusCode, { error: err.message }); return; }
            throw err;
          }
          const text = typeof body.text === "string" ? body.text.trim() : "";
          if (!text) { sendJson(res, 400, { error: "text required" }); return; }
          const msg = await db.createMessage(convId, payload.userId, text);

          // Also broadcast via socket for real-time
          try {
            const tunnel = await db.getTunnel(convId);
            if (tunnel) {
              const recipientId = String(tunnel.recipient_id);
              const offererId = String(tunnel.offerer_id || "");
              emitToUser(recipientId, "new_message", { conversationId: convId, message: msg });
              emitToUser(offererId, "new_message", { conversationId: convId, message: msg });
              const otherUserId = payload.userId === recipientId ? offererId : recipientId;
              await sendUnreadCount(otherUserId);
            }
          } catch (broadcastErr) {
            console.error("message broadcast failed:", broadcastErr);
          }

          sendJson(res, 201, msg);
          return;
        }

        sendJson(res, 405, { error: "Method not allowed" });
        return;
      }

      sendJson(res, 404, { error: "not found" });
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

// Track which hotspot each socket is near: socketId -> { hotspotId, userId, username }
const socketMeta = new Map();
// Track userId -> Set<socketId> for targeted emissions
const userSockets = new Map();

function emitToUser(userId, event, data) {
  const uid = String(userId);
  const sockets = userSockets.get(uid);
  if (!sockets || sockets.size === 0) {
    console.log(`emitToUser: no sockets for user ${uid}, event=${event} dropped`);
    return;
  }
  console.log(`emitToUser: sending ${event} to user ${uid} (${sockets.size} socket(s))`);
  for (const sid of sockets) {
    io.to(sid).emit(event, data);
  }
}

async function sendUnreadCount(userId) {
  try {
    const count = await db.getUnreadCountsForUser(userId);
    emitToUser(userId, "unread_update", { unreadCount: count });
  } catch (err) {
    console.error("sendUnreadCount failed:", err);
  }
}

io.on("connection", async (socket) => {
  console.log("client connected:", socket.id);
  try {
    socket.emit("quests_init", await db.getQuests());
    socket.emit("market_snapshot", await db.getAllStocks());
  } catch (err) {
    console.error("failed to emit init data:", err);
  }

  // Auth: register socket for targeted events
  socket.on("register_user", async ({ userId } = {}) => {
    if (!userId) return;
    const uid = String(userId);
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);
    socketMeta.set(socket.id, { ...socketMeta.get(socket.id), userId: uid });
    // Send initial unread count
    await sendUnreadCount(uid);
  });

  socket.on("update_location", async ({ lat, lon, userId, username } = {}) => {
    try {
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      const hotspots = await db.getNearbyHotspots(lat, lon);
      socket.emit("hotspots_init", hotspots);

      const previous = socketMeta.get(socket.id) || {};
      socketMeta.set(socket.id, {
        userId: userId || previous.userId || null,
        username: username || previous.username || null,
        lat,
        lon,
      });

      if (userId) {
        // Ensure user-socket mapping is up to date
        const uid = String(userId);
        if (!userSockets.has(uid)) userSockets.set(uid, new Set());
        userSockets.get(uid).add(socket.id);

        await db.updateUserLocation(userId, lat, lon);

        // Find the closest hotspot the user is physically inside
        const nearest = hotspots[0];
        const insideHotspot = nearest && nearest.distance_meters <= (nearest.radius_meters ?? 80);
        const userHotspotId = insideHotspot ? (nearest._id || nearest.id) : null;
        const userHotspotStr = userHotspotId ? String(userHotspotId) : null;
        await db.updateUserHotspot(userId, userHotspotStr);
        socket.emit("user_hotspot_changed", { hotspot_id: userHotspotStr });
      }
    } catch (err) {
      console.error("update_location failed:", err);
    }
  });

  socket.on("task_request", async (payload = {}) => {
    const { task, hotspotId, action, userId, description } = payload;
    if (!task || !hotspotId || !action) return;

    // Proximity check: user must be at this hotspot
    if (userId) {
      try {
        const reqUser = await db.getUser(userId);
        if (!reqUser || String(reqUser.hotspot_id || "") !== String(hotspotId)) {
          socket.emit("task_request_error", { error: "You must be at this hotspot" });
          return;
        }
      } catch (err) {
        console.error("task_request proximity check failed:", err);
        return;
      }
    }

    // Persist the requester to the quest queue with their description
    const questId = typeof task === "object" ? (task.id || task._id) : task;
    if (questId && hotspotId && userId) {
      try {
        const hotspot = await db.joinQuestQueue(hotspotId, questId, userId, description || "");
        if (hotspot) {
          io.emit("hotspot_updated", {
            hotspot_id: hotspot._id || hotspot.id,
            name: hotspot.name,
            heat_score: hotspot.heat_score || 0,
            questq_ids: hotspot.questq_ids || [],
            quest_ids: hotspot.quest_ids || [],
          });
        }
      } catch (err) {
        console.error("task_request queue write failed:", err);
      }
    }

    socket.emit("task_request_sent", { requestId: `${socket.id}_${Date.now()}`, task });
  });

  socket.on("quest_queue_accept", async (payload = {}) => {
    const { hotspotId, questId, userId } = payload;
    if (!hotspotId || !questId || !userId) return;

    try {
      // Proximity check
      const acceptUser = await db.getUser(userId);
      if (!acceptUser || String(acceptUser.hotspot_id || "") !== String(hotspotId)) {
        socket.emit("quest_accept_error", { error: "You must be at this hotspot" });
        return;
      }

      // Peek first to prevent self-acceptance without losing the queue entry
      const peeked = await db.peekQuestRecipient(hotspotId, questId);
      if (!peeked) {
        socket.emit("quest_accept_error", { error: "No one is waiting for this quest" });
        return;
      }

      // Prevent accepting your own request (check BEFORE dequeuing)
      if (String(peeked.recipientId) === String(userId)) {
        socket.emit("quest_accept_error", { error: "You cannot accept your own quest!" });
        return;
      }

      const dequeued = await db.dequeueQuestRecipient(hotspotId, questId);
      if (!dequeued) {
        socket.emit("quest_accept_error", { error: "No one is waiting for this quest" });
        return;
      }

      // Create a tunnel connecting acceptor (offerer) and requester (recipient)
      const tunnel = await db.createTunnel(questId, dequeued.recipientId, hotspotId);
      let tunnelId = null;
      if (tunnel) {
        tunnelId = tunnel._id.toString();
        await db.updateTunnelStatus(tunnelId, "MATCHED", {
          offerer_id: String(userId),
        });

        // Look up quest title and requester username for the initial message
        let questTitle = "Quest";
        let requesterName = "Someone";
        try {
          const { ObjectId } = require("mongodb");
          if (ObjectId.isValid(String(questId))) {
            const questDoc = await db.getDb().collection("questTable").findOne({ _id: new ObjectId(String(questId)) });
            if (questDoc) questTitle = questDoc.title;
          }
          const requesterDoc = await db.getUser(dequeued.recipientId);
          if (requesterDoc?.username) requesterName = requesterDoc.username;
        } catch { /* non-fatal */ }

        // Always send an initial message so conversations never start blank
        const firstMessageText = dequeued.description
          ? dequeued.description
          : `${requesterName} requested help with: ${questTitle}`;
        const autoMsg = await db.createMessage(tunnelId, dequeued.recipientId, firstMessageText);
        emitToUser(dequeued.recipientId, "new_message", { conversationId: tunnelId, message: autoMsg });
        emitToUser(userId, "new_message", { conversationId: tunnelId, message: autoMsg });

        // Notify both users about the new conversation
        const tunnelData = { tunnelId, questId, questTitle, recipientId: dequeued.recipientId, offererId: String(userId) };
        emitToUser(dequeued.recipientId, "tunnel_created", tunnelData);
        emitToUser(userId, "tunnel_created", tunnelData);

        // Send unread counts
        await sendUnreadCount(userId);
        await sendUnreadCount(dequeued.recipientId);
      }

      // Broadcast updated hotspot so panel refreshes
      const updatedHotspot = await db.getHotspotById(hotspotId);
      if (updatedHotspot) {
        io.emit("hotspot_updated", {
          hotspot_id: updatedHotspot._id || updatedHotspot.id,
          name: updatedHotspot.name,
          heat_score: updatedHotspot.heat_score || 0,
          questq_ids: updatedHotspot.questq_ids || [],
          quest_ids: updatedHotspot.quest_ids || [],
        });
      }

      socket.emit("quest_accepted", {
        questId,
        tunnelId,
        recipientId: dequeued.recipientId,
        description: dequeued.description,
      });
    } catch (err) {
      console.error("quest_queue_accept failed:", err);
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

  socket.on("quest_failed", async ({ tunnelId, userId } = {}) => {
    try {
      if (!tunnelId) return;
      const tunnel = await db.getTunnel(tunnelId);
      if (!tunnel) return;

      const failedByOfferer =
        userId != null && tunnel.offerer_id != null && String(userId) === String(tunnel.offerer_id);

      if (failedByOfferer) {
        await db.requeueQuestRecipient(tunnel.hotspot_id, tunnel.quest_id, tunnel.recipient_id);
        const hotspot = await db.getHotspotById(tunnel.hotspot_id);
        if (hotspot) {
          io.emit("hotspot_updated", {
            hotspot_id: hotspot._id || hotspot.id,
            name: hotspot.name,
            heat_score: hotspot.heat_score || 0,
            questq_ids: hotspot.questq_ids || [],
            quest_ids: hotspot.quest_ids || [],
          });
        }
      }

      await db.deleteTunnel(tunnelId);
    } catch (err) {
      console.error("quest_failed error:", err);
    }
  });

  socket.on("complete_quest", async (payload) => {
    try {
      const questId = typeof payload === "string" ? payload : payload?.questId;
      if (!questId) return;

      const happinessRating = typeof payload === "object" ? payload?.happinessRating : null;
      const conversationId = typeof payload === "object" ? payload?.conversationId : null;
      const requestedRecipientId =
        typeof payload === "object"
          ? (payload?.recipientId ?? payload?.userId ?? null)
          : null;

      // Tunnel-based completion: called from ChatView "Done" button
      if (conversationId) {
        const tunnel = await db.getTunnel(conversationId);
        if (!tunnel) {
          socket.emit("quest_completion_rejected", { questId, reason: "tunnel_not_found" });
          return;
        }

        // Mark tunnel as completed
        await db.updateTunnelStatus(conversationId, "COMPLETED");

        // Complete the quest (increment completions, award coins)
        const updated = await db.completeQuest(questId, {
          happinessRating: happinessRating || null,
          userId: String(tunnel.recipient_id),
          hotspotId: tunnel.hotspot_id ? String(tunnel.hotspot_id) : null,
        });

        if (updated) {
          io.emit("quests_updated", await db.getQuests());
          io.emit("quest_completed", {
            quest: updated,
            by: socket.id,
            recipient_id: String(tunnel.recipient_id),
            happinessRating: happinessRating || null,
            coinsEarned: updated.coin_reward || 0,
          });

          // Recalculate stock price
          if (updated.category) {
            try {
              const { recalculateStockPrice } = require("./market/pricing");
              const stockUpdate = await recalculateStockPrice(db.getDb(), updated.category);
              if (stockUpdate) io.emit("stock_updated", stockUpdate);
            } catch (priceErr) {
              console.error("stock recalculation failed:", priceErr);
            }
          }
        }

        // Notify both users the conversation is now locked
        const offererId = String(tunnel.offerer_id || "");
        const recipientId = String(tunnel.recipient_id);
        emitToUser(recipientId, "conversation_locked", { conversationId });
        emitToUser(offererId, "conversation_locked", { conversationId });
        return;
      }

      // Legacy queue-based completion (fallback)
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

      const updated = await db.completeQuest(questId, {
        happinessRating: happinessRating || null,
        userId: queueAssignment.recipient_id || null,
        hotspotId: queueAssignment.hotspot_id || null,
      });
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
        happinessRating: happinessRating || null,
        coinsEarned: updated.coin_reward || 0,
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

      // Recalculate stock price for the completed quest's category
      if (updated.category) {
        try {
          const { recalculateStockPrice } = require("./market/pricing");
          const stockUpdate = await recalculateStockPrice(db.getDb(), updated.category);
          if (stockUpdate) {
            io.emit("stock_updated", stockUpdate);
          }
        } catch (priceErr) {
          console.error("stock recalculation failed:", priceErr);
        }
      }
    } catch (err) {
      console.error("complete_quest failed:", err);
    }
  });

  // --- Real-time chat ---
  socket.on("chat_message", async ({ conversationId, text } = {}) => {
    const meta = socketMeta.get(socket.id);
    const userId = meta?.userId;
    if (!conversationId || !text || !userId) return;

    try {
      // Verify user is part of this conversation
      const tunnel = await db.getTunnel(conversationId);
      if (!tunnel) return;
      const recipientId = String(tunnel.recipient_id);
      const offererId = String(tunnel.offerer_id || "");
      if (userId !== recipientId && userId !== offererId) return;
      if (tunnel.status === "COMPLETED" || tunnel.status === "FAILED") return;

      const msg = await db.createMessage(conversationId, userId, text.trim());
      const otherUserId = userId === recipientId ? offererId : recipientId;

      // Send to both users
      emitToUser(userId, "new_message", { conversationId, message: msg });
      emitToUser(otherUserId, "new_message", { conversationId, message: msg });
      // Update unread for recipient
      await sendUnreadCount(otherUserId);
    } catch (err) {
      console.error("chat_message failed:", err);
    }
  });

  socket.on("mark_read", async ({ conversationId } = {}) => {
    const meta = socketMeta.get(socket.id);
    const userId = meta?.userId;
    if (!conversationId || !userId) return;

    try {
      await db.markMessagesRead(conversationId, userId);
      await sendUnreadCount(userId);
    } catch (err) {
      console.error("mark_read failed:", err);
    }
  });

  socket.on("disconnect", () => {
    const meta = socketMeta.get(socket.id);
    if (meta?.userId) {
      const sockets = userSockets.get(meta.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(meta.userId);
      }
    }
    socketMeta.delete(socket.id);
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
