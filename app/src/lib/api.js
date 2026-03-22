const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "";

/** Convert GeoJSON [lon, lat] to Leaflet [lat, lon] */
export function geoToLeaflet(coords) {
  return [coords[1], coords[0]];
}

/** Format distance for display */
export function formatDistance(meters) {
  if (meters == null) return "Available anywhere";
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

export async function fetchNearbyHotspots(lat, lon, radius = 2000) {
  if (!BASE_URL) return [];
  const res = await fetch(
    `${BASE_URL}/hotspots/nearby?lat=${lat}&lon=${lon}&radius=${radius}`
  );
  if (!res.ok) throw new Error(`Failed to fetch hotspots: ${res.status}`);
  return res.json();
}

export async function fetchHotspotById(id) {
  if (!BASE_URL) return null;
  const res = await fetch(`${BASE_URL}/hotspots/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch hotspot: ${res.status}`);
  return res.json();
}

export async function fetchNearbyQuests({
  lat,
  lon,
  radius = 1000,
  category,
  difficulty,
  hotspotId,
  limit = 20,
}) {
  if (!BASE_URL) return [];
  const params = new URLSearchParams();
  if (lat != null) params.set("lat", lat);
  if (lon != null) params.set("lon", lon);
  params.set("radius", radius);
  params.set("limit", limit);
  if (category) params.set("category", category);
  if (difficulty) params.set("difficulty", difficulty);
  if (hotspotId) params.set("hotspot_id", hotspotId);
  const res = await fetch(`${BASE_URL}/quests/nearby?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch quests: ${res.status}`);
  return res.json();
}

export async function createQuest({ title, category }) {
  if (!BASE_URL) throw new Error("Server URL not configured");
  const res = await fetch(`${BASE_URL}/quests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, category }),
  });
  if (!res.ok) throw new Error(`Failed to create quest: ${res.status}`);
  return res.json();
}

export async function fetchAllQuests() {
  if (!BASE_URL) return [];
  const res = await fetch(`${BASE_URL}/quests`);
  if (!res.ok) throw new Error(`Failed to fetch quests: ${res.status}`);
  return res.json();
}

export async function authRegister(username, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Register failed");
  return data; // { token, user }
}

export async function authLogin(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data; // { token, user }
}

export async function authMe(token) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json(); // { id, username, balance }
}
