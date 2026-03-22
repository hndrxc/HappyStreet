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
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
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
    
    //giant pathname switch
    switch (url.pathname){

        case "/auth/register": {
            if (req.method === "POST") {
                let body;
                try { body = await parseJsonBody(req); } catch (err) {
                    if (err && err.statusCode) { sendJson(res, err.statusCode, { error: err.message }); return; }
                    throw err;
                }
                const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
                const password = typeof body.password === "string" ? body.password : "";
                if (username.length < 3) { sendJson(res, 400, { error: "Username must be at least 3 characters" }); return; }
                if (password.length < 4) { sendJson(res, 400, { error: "Password must be at least 4 characters" }); return; }
                const existing = await db.getUserByUsername(username);
                if (existing) { sendJson(res, 409, { error: "Username already taken" }); return; }
                const hash = await bcrypt.hash(password, 10);
                const newUser = await db.createUser(username, hash);
                const token = jwt.sign({ userId: newUser._id.toString(), username: newUser.username }, JWT_SECRET, { expiresIn: "30d" });
                sendJson(res, 201, { token, user: { id: newUser._id.toString(), username: newUser.username, balance: newUser.balance } });
                return;
            }
            sendJson(res, 405, { error: "Method not allowed" });
            return;
        }

        case "/auth/login": {
            if (req.method === "POST") {
                let body;
                try { body = await parseJsonBody(req); } catch (err) {
                    if (err && err.statusCode) { sendJson(res, err.statusCode, { error: err.message }); return; }
                    throw err;
                }
                const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
                const password = typeof body.password === "string" ? body.password : "";
                if (!username || !password) { sendJson(res, 400, { error: "Username and password required" }); return; }
                const user = await db.getUserByUsername(username);
                if (!user) { sendJson(res, 401, { error: "Invalid username or password" }); return; }
                const match = await bcrypt.compare(password, user.pword_hash);
                if (!match) { sendJson(res, 401, { error: "Invalid username or password" }); return; }
                const token = jwt.sign({ userId: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: "30d" });
                sendJson(res, 200, { token, user: { id: user._id.toString(), username: user.username, balance: user.balance } });
                return;
            }
            sendJson(res, 405, { error: "Method not allowed" });
            return;
        }

        case "/auth/me": {
            if (req.method === "GET") {
                const payload = verifyToken(req);
                if (!payload) { sendJson(res, 401, { error: "Unauthorized" }); return; }
                const user = await db.getUser(payload.userId);
                if (!user) { sendJson(res, 404, { error: "User not found" }); return; }
                sendJson(res, 200, { id: user._id.toString(), username: user.username, balance: user.balance });
                return;
            }
            sendJson(res, 405, { error: "Method not allowed" });
            return;
        }

        case "/auth/logout":
            if (req.method === "POST") {
                sendJson(res, 200, { success: true });
                return;
            }
            sendJson(res, 405, { error: "Method not allowed" });
            return;

        case "/quests":
            if (req.method==="GET"){
            const quests = await db.getQuests();
            sendJson(res, 200, quests);
            return;

            }
            if (req.method==="POST"){
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
            if (req.method === "PUT"){


            }
            sendJson(res, 405, { error: "Method not allowed" });
            return;
            break;
        
        case "/hotspots/nearby":
            if (req.method === "GET"){
                const lat = parseFloat(url.searchParams.get("lat"));
                const lon = parseFloat(url.searchParams.get("lon"));
                const radius = parseFloat(url.searchParams.get("radius")) || 2000;

                if (isNaN(lat) || isNaN(lon)) {
                    sendJson(res, 400, { error: "lat and lon query params required" });
                    return;
                }

                const hotspots = await db.getNearbyHotspots(lat, lon, radius);
                sendJson(res, 200, hotspots);
                return;
            }
            if (req.method === "GET"){
                
            }
            if (req.method === "GET"){
                
            }
            sendJson(res, 405, { error: "Method not allowed" });
            return;
            break;
        
       


        case "/quests/nearby":
            if (req.method === "GET"){
                const lat = parseFloat(url.searchParams.get("lat"));
                const lon = parseFloat(url.searchParams.get("lon"));

                if (isNaN(lat) || isNaN(lon)) {
                    sendJson(res, 400, { error: "lat and lon query params required" });
                    return;
                }
                if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                    sendJson(res, 400, { error: "lat must be -90..90, lon must be -180..180" });
                    return;
                }

                const radius = parseFloat(url.searchParams.get("radius")) || 1000;
                const limit = parseInt(url.searchParams.get("limit"), 10) || 20;
                const category = url.searchParams.get("category") || undefined;
                const difficulty = url.searchParams.get("difficulty") || undefined;

                const quests = await db.getNearbyQuests({ lat, lon, radius, category, difficulty, limit });
                sendJson(res, 200, quests);
                return;
            }
            if (req.method === "GET"){
                
            }
            if (req.method === "GET"){
                
            }
            sendJson(res, 405, { error: "Method not allowed" });
            return;
            break;
        
        










    }
     if (url.pathname.startsWith("/hotspots/")) {
      const id = url.pathname.slice("/hotspots/".length);
      if (req.method === "GET") {
        const hotspot = await db.getHotspotById(id);
        if (!hotspot) { sendJson(res, 404, { error: "not found" }); return; }
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
  const hotspots = await db.getNearbyHotspots(lat, lon);
  socket.emit("hotspots_init", hotspots);
});


socket.on("join_quest", async ({ questId, userId, hotspotId }) => {
  try {
    await db.collection("hotspotTable").updateOne(
      { _id: new ObjectId(hotspotId), "questq_ids.quest_id": questId },
      { $addToSet: { "questq_ids.$[elem].recipient_ids": userId } },
      { arrayFilters: [{ "elem.quest_id": questId }] }
    );

    const hotspot = await db.getHotspotById(hotspotId);
    io.emit("hotspot_updated", {
      hotspot_id: hotspotId,
      name: hotspot.name,
      questq_ids: hotspot.questq_ids
    });
  } catch (err) {
    console.error("join_quest failed:", err);
  }
});

socket.on("quest_failed", async ({ tunnelId, userId }) => {
  try {
    const tunnel = await db.getTunnel(tunnelId);
    if (!tunnel) return;

    if (userId === tunnel.offerer_id) {
      await db.collection("hotspotTable").updateOne(
        { _id: new ObjectId(tunnel.hotspot_id), "questq_ids.quest_id": tunnel.quest_id },
        { $addToSet: { "questq_ids.$[elem].recipient_ids": tunnel.recipient_id } },
        { arrayFilters: [{ "elem.quest_id": tunnel.quest_id }] }
      );

      const hotspot = await db.getHotspotById(tunnel.hotspot_id);
      io.emit("hotspot_updated", {
        hotspot_id: tunnel.hotspot_id,
        name: hotspot.name,
        questq_ids: hotspot.questq_ids
      });
    }

    await db.deleteTunnel(tunnelId);
  } catch (err) {
    console.error("quest_failed error:", err);
  }
});

socket.on("complete_quest", async ({ questId, userId }) => {
  try {
    const updated = await db.completeQuest(questId);
    if (!updated) return;

    // Step 3 first — query before mutation
    const affectedHotspots = await db.collection("hotspotTable").find(
      { "questq_ids.quest_id": questId }
    ).toArray();

    
    await db.removeRecipientFromQueue(questId, userId);

    // Emit hotspot_updated with post-mutation state
    for (const hotspot of affectedHotspots) {
      const updated = await db.getHotspotById(hotspot._id);
      io.emit("hotspot_updated", {
        hotspot_id: hotspot._id,
        name: hotspot.name,
        questq_ids: updated.questq_ids
      });
    }

    
    io.emit("quest_completed", { quest: updated, by: userId });

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
