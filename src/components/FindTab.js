// src/components/FindTab.js
import { useState, useRef, useEffect } from "react";
import { smartCampSearch, placesTextSearch } from "../lib/api";
import { useApp } from "../lib/AppContext";
import { useGoogleMaps } from "../hooks/useGoogleMaps";

const FILTERS = ["All", "Arts", "Sports", "STEM", "Swim", "Outdoor", "Music"];

const palette = {
  bg: "#FDF8F3", warm: "#F5EDE0", accent: "#E8825A", accentSoft: "#F2C4A8",
  green: "#7BAF8E", greenSoft: "#C8E6D0", blue: "#5A89B8", blueSoft: "#C0D8F0",
  text: "#2A1F1A", muted: "#8C7B72", white: "#FFFFFF",
};

export default function FindTab() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const { family } = useApp();
  const { isLoaded: mapsLoaded } = useGoogleMaps();

  // Initialize map when toggled
  useEffect(() => {
    if (showMap && mapsLoaded && mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: family.location.lat, lng: family.location.lng },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
      });
    }
  }, [showMap, mapsLoaded, family.location]);

  // Add markers when results change
  useEffect(() => {
    if (!mapInstanceRef.current || !results.length) return;
    results.forEach((r) => {
      if (r.lat && r.lng) {
        new window.google.maps.Marker({
          position: { lat: r.lat, lng: r.lng },
          map: mapInstanceRef.current,
          title: r.name,
        });
      }
    });
  }, [results]);

  const handleSearch = async () => {
    if (!query.trim() && filter === "All") return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const searchTerm = query || filter;
      const { aiSummary, rawPlaces } = await smartCampSearch(
        searchTerm,
        `${family.kids[0].age}-${family.kids[1].age}`,
        family.location.city,
        "Spring 2026"
      );

      // Merge AI summary with raw places data
      const combined = [];

      if (aiSummary?.length) {
        combined.push(...aiSummary.map((r) => ({ ...r, source: "ai" })));
      }

      if (rawPlaces?.length) {
        rawPlaces.slice(0, 4).forEach((p) => {
          combined.push({
            name: p.name,
            description: p.formatted_address,
            emoji: "📍",
            ageRange: "All ages",
            price: p.price_level ? "$".repeat(p.price_level) : "Contact for pricing",
            url: p.website || "#",
            rating: p.rating,
            lat: p.geometry?.location?.lat,
            lng: p.geometry?.location?.lng,
            source: "places",
            place_id: p.place_id,
          });
        });
      }

      setResults(combined);
    } catch (err) {
      setError("Search failed. Check your API keys in .env.local");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {/* Search bar */}
      <div style={s.searchBox}>
        <span>🔍</span>
        <input
          style={s.searchInput}
          placeholder="swimming lessons, art camp, soccer..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        {query && <button style={s.clearBtn} onClick={() => setQuery("")}>✕</button>}
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        {FILTERS.map((f) => (
          <button key={f} style={{ ...s.chip, ...(filter === f ? s.chipActive : {}) }} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Search button + map toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button style={s.searchBtn} onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "🔍 Search"}
        </button>
        <button style={{ ...s.searchBtn, background: showMap ? palette.blue : palette.warm, color: showMap ? "#fff" : palette.text, flex: 0, padding: "10px 16px" }}
          onClick={() => setShowMap((v) => !v)}>
          🗺️
        </button>
      </div>

      {/* Map */}
      {showMap && (
        <div ref={mapRef} style={{ height: 220, borderRadius: 16, marginBottom: 16, overflow: "hidden", border: `1px solid ${palette.warm}` }} />
      )}

      {/* Context */}
      {!loading && !results.length && (
        <div style={{ fontSize: 13, color: palette.muted, marginBottom: 14 }}>
          Spring Break · {family.location.city} · Kids ages {family.kids.map((k) => k.age).join(" & ")}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "#FFF0EE", border: "1px solid #F2C4A8", borderRadius: 12, padding: 14, fontSize: 13, color: palette.accent, marginBottom: 12 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && [1, 2, 3].map((i) => (
        <div key={i} style={{ ...s.card, opacity: 0.5 }}>
          <div style={{ height: 16, background: palette.warm, borderRadius: 8, marginBottom: 8 }} />
          <div style={{ height: 12, background: palette.warm, borderRadius: 8, width: "60%" }} />
        </div>
      ))}

      {/* Results */}
      {results.map((r, i) => (
        <div key={i} style={s.card} onClick={() => setSelectedPlace(selectedPlace?.name === r.name ? null : r)}>
          <div style={s.cardTop}>
            <div style={{ fontSize: 28 }}>{r.emoji || "🏫"}</div>
            <div style={{ flex: 1 }}>
              <div style={s.cardName}>{r.name}</div>
              <div style={s.cardMeta}>{r.ageRange} {r.dates ? `· ${r.dates}` : ""}</div>
              {r.description && <div style={{ fontSize: 12, color: palette.muted, marginTop: 2 }}>{r.description}</div>}
            </div>
            {r.rating && <div style={s.rating}>⭐ {r.rating}</div>}
          </div>

          {selectedPlace?.name === r.name && (
            <div style={s.expanded}>
              <div style={s.expandRow}>
                <span style={s.expandLabel}>Price</span>
                <span>{r.price || "Contact for pricing"}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={s.saveBtn}>Save</button>
                {r.url && r.url !== "#" && (
                  <a href={r.url} target="_blank" rel="noreferrer" style={s.enrollBtn}>Visit Site ↗</a>
                )}
                <button style={s.enrollBtnGreen}>Send to Marcus</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const s = {
  searchBox: { background: "#fff", border: `1.5px solid #F5EDE0`, borderRadius: 14, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginBottom: 12 },
  searchInput: { border: "none", background: "none", flex: 1, fontFamily: "inherit", fontSize: 14, color: "#2A1F1A", outline: "none" },
  clearBtn: { border: "none", background: "none", color: "#8C7B72", cursor: "pointer", fontSize: 14 },
  filterRow: { display: "flex", gap: 8, marginBottom: 12, overflowX: "auto", paddingBottom: 4 },
  chip: { padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1.5px solid #F5EDE0`, background: "#fff", color: "#8C7B72", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" },
  chipActive: { background: "#E8825A", borderColor: "#E8825A", color: "#fff" },
  searchBtn: { flex: 1, background: "#E8825A", border: "none", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  card: { background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 10, border: "1px solid #F5EDE0", cursor: "pointer" },
  cardTop: { display: "flex", gap: 12, alignItems: "flex-start" },
  cardName: { fontSize: 15, fontWeight: 600, color: "#2A1F1A", marginBottom: 2 },
  cardMeta: { fontSize: 12, color: "#8C7B72" },
  rating: { fontSize: 12, fontWeight: 600, color: "#2A1F1A", background: "#F5EDE0", padding: "3px 8px", borderRadius: 20 },
  expanded: { marginTop: 12, paddingTop: 12, borderTop: "1px solid #F5EDE0" },
  expandRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#2A1F1A", marginBottom: 4 },
  expandLabel: { fontWeight: 600, color: "#8C7B72", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" },
  saveBtn: { background: "transparent", border: "1.5px solid #F5EDE0", color: "#8C7B72", padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "inherit" },
  enrollBtn: { background: "#5A89B8", border: "none", color: "#fff", padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "none" },
  enrollBtnGreen: { background: "#7BAF8E", border: "none", color: "#fff", padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
};
