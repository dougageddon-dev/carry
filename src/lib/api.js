// src/lib/api.js
// Centralized API client for all backend calls

const BASE = process.env.NODE_ENV === "development" ? "" : "";

// ─── Claude AI ────────────────────────────────────────────────────────────────

export async function askClaude({ messages, systemContext, requestType = "chat", maxTokens = 1024 }) {
  const res = await fetch(`${BASE}/api/claude`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, systemContext, requestType, maxTokens }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  return res.json();
}

// Convenience: single user message
export async function claudeChat(userMessage, systemContext) {
  return askClaude({
    messages: [{ role: "user", content: userMessage }],
    systemContext,
  });
}

// Generate a co-parent update message
export async function generateCoParentMessage(topics, familyContext) {
  const prompt = `Generate a friendly, concise iMessage-style update for the co-parent covering these topics: ${topics.join(", ")}.
Keep it practical and warm. Use a few emoji for readability. Max 3-4 short paragraphs.`;
  return askClaude({
    messages: [{ role: "user", content: prompt }],
    systemContext: familyContext,
  });
}

// Summarize search results for camps/activities
export async function summarizeCampResults(searchResults, childAge, dates) {
  const prompt = `Here are web search results for kids' camps/activities. 
Child age: ${childAge}. Dates needed: ${dates}.
Results: ${JSON.stringify(searchResults.slice(0, 5))}

Summarize the top 3 most relevant options in this JSON format:
[{ "name": "", "description": "", "ageRange": "", "dates": "", "price": "", "url": "", "emoji": "" }]
Return ONLY the JSON array.`;

  return askClaude({
    messages: [{ role: "user", content: prompt }],
    requestType: "structured",
    maxTokens: 800,
  });
}

// ─── Web Search ───────────────────────────────────────────────────────────────

export async function webSearch(query, count = 10) {
  const res = await fetch(`${BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, count }),
  });
  if (!res.ok) throw new Error(`Search error: ${res.status}`);
  return res.json();
}

// Search for kids camps/activities in a location
export async function searchCamps(activity, location, childAge, dates) {
  const query = `${activity} camp kids ${childAge} years ${location} ${dates}`;
  return webSearch(query, 10);
}

// ─── Google Places ────────────────────────────────────────────────────────────

export async function placesTextSearch(query, location, type) {
  const res = await fetch(`${BASE}/api/places`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "textsearch",
      params: { query, location, type },
    }),
  });
  if (!res.ok) throw new Error(`Places error: ${res.status}`);
  return res.json();
}

export async function placesNearby(location, keyword, radius = 5000) {
  const res = await fetch(`${BASE}/api/places`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "nearbysearch",
      params: { location, keyword, radius },
    }),
  });
  if (!res.ok) throw new Error(`Places error: ${res.status}`);
  return res.json();
}

export async function placeDetails(place_id, fields) {
  const res = await fetch(`${BASE}/api/places`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "details",
      params: { place_id, fields },
    }),
  });
  if (!res.ok) throw new Error(`Places error: ${res.status}`);
  return res.json();
}

export async function placesAutocomplete(input, types = "address") {
  const res = await fetch(`${BASE}/api/places`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "autocomplete",
      params: { input, types },
    }),
  });
  if (!res.ok) throw new Error(`Places error: ${res.status}`);
  return res.json();
}

// ─── Search + AI combo ────────────────────────────────────────────────────────

// Search web for camps, then use Claude to summarize results intelligently
export async function smartCampSearch(query, childAge, location, dates) {
  try {
    const searchQuery = `${query} ${location} kids camp ${dates} registration`;
    const [searchResults, placesResults] = await Promise.allSettled([
      webSearch(searchQuery, 8),
      placesTextSearch(`${query} for kids ${location}`, location),
    ]);

    const webData = searchResults.status === "fulfilled" ? searchResults.value.results : [];
    const placesData = placesResults.status === "fulfilled" ? (placesResults.value.results || []) : [];

    // Use Claude to synthesize and summarize
    const summary = await summarizeCampResults(
      [...webData, ...placesData.map((p) => ({ title: p.name, url: p.website, description: p.formatted_address }))],
      childAge,
      dates
    );

    return {
      success: true,
      aiSummary: summary.data,
      rawSearch: webData,
      rawPlaces: placesData,
    };
  } catch (err) {
    console.error("Smart search error:", err);
    return { success: false, error: err.message };
  }
}
