// src/components/FindTab.js
import { useState, useRef, useEffect } from "react";
import { useApp } from "../lib/AppContext";

const FILTERS = ["All", "Arts", "Sports", "STEM", "Swimming", "Outdoor", "Music", "Dance"];

const FILTER_QUERIES = {
  "All": "kids activities classes",
  "Arts": "kids art classes studio",
  "Sports": "kids sports league club",
  "STEM": "kids stem coding robotics",
  "Swimming": "swimming lessons kids pool",
  "Outdoor": "kids outdoor camp nature",
  "Music": "music lessons kids school",
  "Dance": "dance studio classes kids",
};

const pal = {
  bg: "#FDF8F3", warm: "#F5EDE0", accent: "#E8825A", accentSoft: "#FEF0E8",
  green: "#7BAF8E", greenSoft: "#C8E6D0", blue: "#5A89B8", blueSoft: "#C0D8F0",
  text: "#2A1F1A", muted: "#8C7B72", white: "#FFFFFF",
};

// Geocode a city string → { lat, lng } using Google Geocoding via our places proxy
async function geocodeCity(city) {
  const res = await fetch("/api/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "geocode", params: { address: city } }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status === "OK" && data.results?.[0]) {
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}

// Search Places — uses Nearby Search (strict radius) when we have coords,
// falls back to Text Search (soft bias) otherwise.
async function searchPlaces(query, city, coords, radiusKm = 15) {
  const radiusM = radiusKm * 1000;

  let action, params;

  if (coords?.lat && coords?.lng) {
    // Nearby Search enforces the radius hard — results MUST be within it
    action = "nearbysearch";
    params = {
      location: `${coords.lat},${coords.lng}`,
      radius: radiusM,
      keyword: query,
    };
  } else {
    // No coords yet — fall back to text search with city appended
    action = "textsearch";
    params = {
      query: `${query} ${city}`,
      radius: radiusM,
    };
  }

  const res = await fetch("/api/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places: ${data.status} — ${data.error_message || ""}`);
  }
  return data.results || [];
}

// Fetch phone + website for a single place
async function fetchPlaceDetails(place_id) {
  try {
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "details",
        params: {
          place_id,
          fields: "formatted_phone_number,website,international_phone_number",
        },
      }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.result || {};
  } catch { return {}; }
}

const PRICE_LABELS = ["", "$", "$$", "$$$", "$$$$"];
const CATEGORY_EMOJI = {
  gym: "🤸", swim: "🏊", pool: "🏊", sport: "⚽", soccer: "⚽", hockey: "🏒",
  dance: "💃", music: "🎵", art: "🎨", science: "🧪", stem: "💻", coding: "💻",
  camp: "🏕️", outdoor: "🏕️", yoga: "🧘", martial: "🥋", karate: "🥋",
  tennis: "🎾", basketball: "🏀", baseball: "⚾", volleyball: "🏐",
  theatre: "🎭", theater: "🎭", chess: "♟️", tutor: "📚", school: "🏫",
};

function guessEmoji(name = "", types = []) {
  const lower = (name + " " + types.join(" ")).toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return "📍";
}

export default function FindTab() {
  const { family } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [details, setDetails] = useState({}); // place_id → { phone, website }
  const [saved, setSaved] = useState([]);
  const [coords, setCoords] = useState(
    family?.location?.lat && family?.location?.lng
      ? { lat: family.location.lat, lng: family.location.lng }
      : null
  );
  const [radiusKm, setRadiusKm] = useState(15);
  const city = family?.location?.city || "Victoria, BC";
  const kids = family?.kids || [];

  // Geocode city on mount whenever city changes
  useEffect(() => {
    if (city) {
      geocodeCity(city).then(c => {
        if (c) {
          console.log("Geocoded", city, "→", c);
          setCoords(c);
        } else {
          console.warn("Geocoding failed for:", city);
        }
      });
    }
  }, [city]);

  const handleSearch = async (overrideFilter) => {
    const activeFilter = overrideFilter ?? filter;
    const baseQuery = query.trim() || FILTER_QUERIES[activeFilter] || "kids activities";
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Geocode city if we don't have coords yet
      let searchCoords = coords;
      if (!searchCoords) {
        searchCoords = await geocodeCity(city);
        if (searchCoords) setCoords(searchCoords);
      }

      const places = await searchPlaces(baseQuery, city, searchCoords, radiusKm);
      setResults(places);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (id) => {
    setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const coParentName = family?.coParent?.name || "co-parent";
  const coParentPhone = family?.coParent?.phone;

  const sendToCoParent = (place) => {
    const lines = [];
    lines.push(`Hey! Found something great for the kids 👇`);
    lines.push("");
    lines.push(`📍 ${place.name}`);
    if (place.formatted_address) lines.push(`${place.formatted_address}`);
    if (place.phone) lines.push(`📞 ${place.phone}`);
    if (place.website) lines.push(`🌐 ${place.website}`);
    if (place.rating) lines.push(`⭐ ${place.rating}/5 (${place.user_ratings_total || "?"} reviews)`);
    if (place.opening_hours?.open_now !== undefined) {
      lines.push(place.opening_hours.open_now ? "🟢 Open right now" : "🔴 Currently closed");
    }
    if (place.price_level != null) {
      const prices = ["", "$", "$$", "$$$", "$$$$"];
      lines.push(`💰 ${prices[place.price_level] || "Free / Contact for pricing"}`);
    }
    lines.push("");
    lines.push(`What do you think? Worth checking out for the kids?`);

    const msg = lines.join("\n");
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const sep = isIOS ? "&" : "?";
    const clean = (coParentPhone || "").replace(/\D/g, "");
    window.open(`sms:${clean}${sep}body=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div style={{ padding: "20px 16px 100px" }}>

      {/* Search bar */}
      <div style={s.searchBox}>
        <span style={{ fontSize: 18 }}>🔍</span>
        <input
          style={s.searchInput}
          placeholder="swimming lessons, art camp, soccer..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
        />
        {query && (
          <button style={s.clearBtn} onClick={() => setQuery("")}>✕</button>
        )}
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        {FILTERS.map(f => (
          <button key={f}
            style={{ ...s.chip, ...(filter === f ? s.chipActive : {}) }}
            onClick={() => { setFilter(f); handleSearch(f); }}>
            {f}
          </button>
        ))}
      </div>

      {/* Radius picker */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, color: pal.muted, flexShrink: 0 }}>📍 Within</span>
        {[5, 10, 15, 25].map(km => (
          <button key={km}
            onClick={() => setRadiusKm(km)}
            style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 13, fontWeight: 500, border: "1.5px solid",
              borderColor: radiusKm === km ? pal.accent : pal.warm,
              background: radiusKm === km ? pal.accentSoft : "#fff",
              color: radiusKm === km ? pal.accent : pal.muted,
              cursor: "pointer", fontFamily: "inherit",
            }}>{km} km</button>
        ))}
      </div>

      {/* Search button */}
      <button style={s.searchBtn} onClick={() => handleSearch()} disabled={loading}>
        {loading ? "Searching…" : `🔍 Search near ${city}`}
      </button>

      {/* Context line + location debug */}
      {!loading && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: pal.muted }}>
            📍 {city}{kids.length ? ` · Ages ${kids.map(k => k.age).join(" & ")}` : ""}
          </div>
          {coords ? (
            <div style={{ fontSize: 12, color: "#7BAF8E", marginTop: 3 }}>
              ✅ Location locked: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#E8825A", marginTop: 3 }}>
              ⚠️ Resolving location… update your city in Settings if results look wrong
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "#FFF0EE", border: "1px solid #F2C4A8", borderRadius: 12, padding: 16, fontSize: 14, color: "#8C3A00", marginBottom: 12, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Search error</div>
          <div>{error}</div>
          <div style={{ marginTop: 8, fontSize: 13, color: pal.muted }}>
            Make sure <strong>GOOGLE_PLACES_API_KEY</strong> is set in Netlify → Site configuration → Environment variables, then redeploy.
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && [1,2,3].map(i => (
        <div key={i} style={{ ...s.card, opacity: 0.5 }}>
          <div style={{ height: 18, background: pal.warm, borderRadius: 8, marginBottom: 10, width: "70%" }} />
          <div style={{ height: 13, background: pal.warm, borderRadius: 8, width: "50%" }} />
        </div>
      ))}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div style={{ fontSize: 13, color: pal.muted, marginBottom: 12 }}>
          {results.length} places found near {city}
        </div>
      )}

      {results.map((r, i) => {
        const isOpen = expanded === i;
        const isSaved = saved.includes(r.place_id);
        const emoji = guessEmoji(r.name, r.types);
        const hours = r.opening_hours?.open_now;

        return (
          <div key={r.place_id || i} style={s.card}>
            {/* Card header — tappable */}
            <div style={s.cardTop} onClick={async () => {
              const next = isOpen ? null : i;
              setExpanded(next);
              if (next !== null && r.place_id && !details[r.place_id]) {
                const d = await fetchPlaceDetails(r.place_id);
                setDetails(prev => ({ ...prev, [r.place_id]: d }));
              }
            }}>
              <div style={{ ...s.emojiDot, background: pal.warm }}>{emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.cardName}>{r.name}</div>
                <div style={s.cardAddr}>{r.formatted_address}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {r.rating && (
                    <span style={s.badge}>⭐ {r.rating} ({r.user_ratings_total})</span>
                  )}
                  {r.price_level != null && (
                    <span style={s.badge}>{PRICE_LABELS[r.price_level] || "Free"}</span>
                  )}
                  {hours !== undefined && (
                    <span style={{ ...s.badge, color: hours ? "#2A7A4A" : "#C0392B", background: hours ? "#E8F5EE" : "#FFF0EE" }}>
                      {hours ? "Open now" : "Closed"}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 18, color: pal.muted, flexShrink: 0, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</div>
            </div>

            {/* Expanded actions */}
            {isOpen && (() => {
              const d = details[r.place_id] || {};
              const phone = d.formatted_phone_number || d.international_phone_number;
              const website = d.website || r.website;
              const isLoading = r.place_id && !details[r.place_id];
              return (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${pal.warm}` }}>
                  {isLoading && (
                    <div style={{ fontSize: 13, color: pal.muted, marginBottom: 10 }}>Loading contact info…</div>
                  )}
                  {/* Contact details */}
                  {(phone || website) && (
                    <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      {phone && (
                        <a href={`tel:${phone}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: pal.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📞</div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: pal.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Phone</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: pal.green }}>{phone}</div>
                          </div>
                        </a>
                      )}
                      {website && (
                        <a href={website} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: pal.blueSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🌐</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: pal.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Website</div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: pal.blue, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </div>
                          </div>
                        </a>
                      )}
                      {!phone && !isLoading && (
                        <div style={{ fontSize: 13, color: pal.muted, fontStyle: "italic" }}>No phone number listed</div>
                      )}
                    </div>
                  )}
                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => toggleSave(r.place_id)}
                      style={{ ...s.actionBtn, background: isSaved ? pal.accentSoft : pal.warm, color: isSaved ? pal.accent : pal.text }}>
                      {isSaved ? "✓ Saved" : "♡ Save"}
                    </button>
                    {phone && (
                      <a href={`tel:${phone}`} style={{ ...s.actionBtn, background: pal.greenSoft, color: pal.green, textDecoration: "none" }}>
                        📞 Call
                      </a>
                    )}
                    {coParentPhone && (
                      <button onClick={() => sendToCoParent({ ...r, website, phone })} style={{ ...s.actionBtn, background: "#F0EEF8", color: "#6A50A0" }}>
                        📱 Send to {coParentName}
                      </button>
                    )}
                    <a href={`https://www.google.com/maps/place/?q=place_id:${r.place_id}`} target="_blank" rel="noreferrer"
                      style={{ ...s.actionBtn, background: "#F0F0FF", color: "#5050C0", textDecoration: "none" }}>
                      🗺️ Maps
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}

      {/* No results */}
      {!loading && !error && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: pal.muted }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Search for activities near you</div>
          <div style={{ fontSize: 14 }}>Try "swimming lessons", "art camp", or tap a filter above</div>
        </div>
      )}
    </div>
  );
}

const s = {
  searchBox: { background: "#fff", border: "1.5px solid #F5EDE0", borderRadius: 14, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginBottom: 12 },
  searchInput: { border: "none", background: "none", flex: 1, fontFamily: "inherit", fontSize: 15, color: "#2A1F1A", outline: "none" },
  clearBtn: { border: "none", background: "none", color: "#8C7B72", cursor: "pointer", fontSize: 16 },
  filterRow: { display: "flex", gap: 8, marginBottom: 12, overflowX: "auto", paddingBottom: 4 },
  chip: { padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500, border: "1.5px solid #F5EDE0", background: "#fff", color: "#8C7B72", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 },
  chipActive: { background: "#E8825A", borderColor: "#E8825A", color: "#fff" },
  searchBtn: { width: "100%", background: "#E8825A", border: "none", color: "#fff", borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 16 },
  card: { background: "#fff", borderRadius: 16, padding: 16, marginBottom: 10, border: "1px solid #F5EDE0" },
  cardTop: { display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" },
  emojiDot: { width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 },
  cardName: { fontSize: 16, fontWeight: 600, color: "#2A1F1A", marginBottom: 3 },
  cardAddr: { fontSize: 13, color: "#8C7B72", lineHeight: 1.4 },
  badge: { display: "inline-block", background: "#F5EDE0", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 500, color: "#2A1F1A" },
  actionBtn: { padding: "9px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit" },
};
