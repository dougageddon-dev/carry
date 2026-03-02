// src/components/EventEditor.js
import { useState, useMemo } from "react";
import { uid } from "../lib/storage";

const p = {
  warm: "#F5EDE0", accent: "#E8825A", accentLight: "#FEF0E8", green: "#7BAF8E",
  text: "#2A1F1A", muted: "#8C7B72", white: "#FFFFFF", bg: "#FDF8F3",
  red: "#C0392B", redLight: "#F5C6C2",
};

const DAYS = ["Today", "Tomorrow", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Activity → emoji mapping. Used for smart icon matching as user types.
const ACTIVITY_EMOJIS = [
  { keywords: ["swim", "pool", "aqua", "water polo", "diving"], emoji: "🏊" },
  { keywords: ["soccer", "football"], emoji: "⚽" },
  { keywords: ["basketball", "hoops"], emoji: "🏀" },
  { keywords: ["baseball", "softball", "tee ball"], emoji: "⚾" },
  { keywords: ["hockey", "ice"], emoji: "🏒" },
  { keywords: ["tennis", "racket", "squash", "badminton"], emoji: "🎾" },
  { keywords: ["volleyball", "volley"], emoji: "🏐" },
  { keywords: ["gymnastics", "gym", "tumbling", "acro"], emoji: "🤸" },
  { keywords: ["dance", "ballet", "hip hop", "tap", "jazz", "ballroom"], emoji: "💃" },
  { keywords: ["music", "piano", "guitar", "violin", "drums", "band", "choir", "singing", "vocal"], emoji: "🎵" },
  { keywords: ["art", "paint", "draw", "craft", "pottery", "ceramics"], emoji: "🎨" },
  { keywords: ["karate", "martial", "taekwondo", "judo", "jiu jitsu", "wrestling"], emoji: "🥋" },
  { keywords: ["chess"], emoji: "♟️" },
  { keywords: ["coding", "computer", "tech", "robotics", "stem"], emoji: "💻" },
  { keywords: ["science", "chemistry", "lab", "biology"], emoji: "🧪" },
  { keywords: ["reading", "book", "library", "literacy"], emoji: "📚" },
  { keywords: ["math", "tutor", "homework", "study"], emoji: "✏️" },
  { keywords: ["run", "track", "cross country", "marathon", "jog"], emoji: "🏃" },
  { keywords: ["bike", "cycling", "cycle"], emoji: "🚴" },
  { keywords: ["climbing", "bouldering"], emoji: "🧗" },
  { keywords: ["ski", "snowboard", "slope"], emoji: "⛷️" },
  { keywords: ["skate", "skating", "roller"], emoji: "⛸️" },
  { keywords: ["rugby", "lacrosse"], emoji: "🏉" },
  { keywords: ["cheer", "pom"], emoji: "📣" },
  { keywords: ["theatre", "theater", "drama", "acting", "play"], emoji: "🎭" },
  { keywords: ["camp", "nature", "outdoor", "hiking", "trail"], emoji: "🏕️" },
  { keywords: ["yoga", "pilates", "stretch"], emoji: "🧘" },
  { keywords: ["archery", "bow"], emoji: "🏹" },
  { keywords: ["golf"], emoji: "⛳" },
  { keywords: ["surf", "board"], emoji: "🏄" },
  { keywords: ["doctor", "dentist", "appoint", "checkup", "physio", "therapy"], emoji: "🏥" },
  { keywords: ["medic", "pill", "prescription"], emoji: "💊" },
  { keywords: ["birthday", "party", "celebration", "event"], emoji: "🎂" },
  { keywords: ["school", "class", "lesson", "course"], emoji: "🏫" },
  { keywords: ["bus", "pickup", "drop", "carpool"], emoji: "🚌" },
  { keywords: ["lunch", "snack", "food", "eat"], emoji: "🍎" },
  { keywords: ["sleep", "nap", "bed"], emoji: "😴" },
  { keywords: ["playdate", "friend"], emoji: "👫" },
  { keywords: ["photo", "picture", "portrait"], emoji: "📸" },
  { keywords: ["show", "concert", "recital", "performance"], emoji: "🎪" },
  // fallback
  { keywords: [], emoji: "📅" },
];

// Return matching emojis based on title input
function getMatchingEmojis(title) {
  if (!title || title.trim().length < 2) return ACTIVITY_EMOJIS.map(a => a.emoji);
  const lower = title.toLowerCase();
  const matches = ACTIVITY_EMOJIS.filter(a =>
    a.keywords.some(k => lower.includes(k) || k.includes(lower.split(" ")[0]))
  );
  // Always show at least 8
  if (matches.length < 1) return ACTIVITY_EMOJIS.map(a => a.emoji);
  return [...new Set(matches.map(a => a.emoji))];
}

// Auto-suggest best emoji from title
function suggestEmoji(title) {
  if (!title) return "📅";
  const lower = title.toLowerCase();
  for (const { keywords, emoji } of ACTIVITY_EMOJIS) {
    if (keywords.some(k => lower.includes(k))) return emoji;
  }
  return "📅";
}

// ─── 12-hour time picker ──────────────────────────────────────────────────────
function TimePicker({ value, onChange }) {
  // value stored as "3:30 PM" style string
  const parse = (val) => {
    if (!val) return { hour: "", min: "00", period: "AM" };
    const m = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m) return { hour: m[1], min: m[2], period: m[3].toUpperCase() };
    // Handle 24hr input from old data
    const m24 = val.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) {
      let h = parseInt(m24[1]);
      const period = h >= 12 ? "PM" : "AM";
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return { hour: String(h), min: m24[2], period };
    }
    return { hour: "", min: "00", period: "AM" };
  };

  const { hour, min, period } = parse(value);

  const emit = (h, m, per) => {
    if (!h) { onChange(""); return; }
    onChange(`${h}:${m} ${per}`);
  };

  const inputStyle = {
    border: `1.5px solid ${p.warm}`, borderRadius: 10, padding: "10px 0",
    fontSize: 22, fontWeight: 700, color: p.text, background: p.white,
    outline: "none", fontFamily: "inherit", textAlign: "center", width: "100%",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* Hour */}
      <input
        type="number" min={1} max={12} placeholder="12"
        value={hour}
        onChange={e => {
          let v = e.target.value.replace(/\D/g, "");
          if (parseInt(v) > 12) v = "12";
          emit(v, min, period);
        }}
        style={{ ...inputStyle, flex: 1 }}
      />
      <span style={{ fontSize: 24, fontWeight: 700, color: p.muted }}>:</span>
      {/* Minutes */}
      <select
        value={min}
        onChange={e => emit(hour, e.target.value, period)}
        style={{ ...inputStyle, flex: 1, cursor: "pointer" }}
      >
        {["00","05","10","15","20","25","30","35","40","45","50","55"].map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      {/* AM/PM */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 0 }}>
        {["AM", "PM"].map(per => (
          <button key={per} onClick={() => emit(hour, min, per)} style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            border: `1.5px solid ${period === per ? p.accent : p.warm}`,
            background: period === per ? p.accent : p.white,
            color: period === per ? p.white : p.muted,
            cursor: "pointer", fontFamily: "inherit",
          }}>{per}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EventEditor({ event, people, onSave, onDelete, onClose }) {
  const isNew = !event;
  const [form, setForm] = useState(event || {
    id: uid(), emoji: "📅", title: "", sub: "", time: "", day: "Today",
    assignedTo: people[0] || "", pickupTime: "", pickupBy: "",
    isReminder: false, urgent: false,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Auto-suggest emoji when title changes
  const handleTitleChange = (val) => {
    const suggested = suggestEmoji(val);
    setForm(f => ({
      ...f,
      title: val,
      emoji: f.emoji === "📅" || getMatchingEmojis(f.title).includes(f.emoji) ? suggested : f.emoji,
    }));
  };

  const matchingEmojis = useMemo(() => getMatchingEmojis(form.title), [form.title]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, title: form.title.trim(), sub: (form.sub || "").trim() });
  };

  const canSave = form.title.trim().length > 0;

  return (
    <div style={overlay}>
      <div style={sheet}>
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, background: p.warm, borderRadius: 2, margin: "0 auto 16px" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: p.text }}>
            {isNew ? "Add event" : "Edit event"}
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, paddingRight: 2 }}>

          {/* Schedule / Reminder toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["📅 Schedule", false], ["🔔 Reminder", true]].map(([label, val]) => (
              <button key={label} onClick={() => set("isReminder", val)} style={{
                flex: 1, padding: "9px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                border: `1.5px solid ${form.isReminder === val ? p.accent : p.warm}`,
                background: form.isReminder === val ? p.accentLight : p.white,
                color: form.isReminder === val ? p.accent : p.muted,
                cursor: "pointer", fontFamily: "inherit",
              }}>{label}</button>
            ))}
          </div>

          {/* Title */}
          <div style={{ marginBottom: 12 }}>
            <div style={label}>Title *</div>
            <input
              value={form.title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder={form.isReminder ? "e.g. Permission slip due" : "e.g. Volleyball — Maya"}
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Smart emoji picker — filters as you type */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...label, marginBottom: 6 }}>
              Icon
              {form.title.length > 1 && <span style={{ fontWeight: 400, color: p.muted, marginLeft: 6 }}>— filtered by title</span>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {matchingEmojis.map(e => (
                <button key={e} onClick={() => set("emoji", e)} style={{
                  width: 40, height: 40, borderRadius: 10, fontSize: 20,
                  border: `2px solid ${form.emoji === e ? p.accent : p.warm}`,
                  background: form.emoji === e ? p.accentLight : p.white,
                  cursor: "pointer", transition: "all 0.15s",
                }}>{e}</button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div style={{ marginBottom: 12 }}>
            <div style={label}>Details / Location</div>
            <input value={form.sub || ""} onChange={e => set("sub", e.target.value)}
              placeholder="e.g. Riverside Gym, Court 2 · Bring knee pads"
              style={inputStyle} />
          </div>

          {!form.isReminder && (
            <>
              {/* Day chips */}
              <div style={{ marginBottom: 14 }}>
                <div style={label}>Day</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {DAYS.map(d => (
                    <button key={d} onClick={() => set("day", d)} style={{
                      padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                      border: `1.5px solid ${form.day === d ? p.accent : p.warm}`,
                      background: form.day === d ? p.accentLight : p.white,
                      color: form.day === d ? p.accent : p.muted,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>{d}</button>
                  ))}
                </div>
              </div>

              {/* Start time — 12hr picker */}
              <div style={{ marginBottom: 14 }}>
                <div style={label}>Start time</div>
                <TimePicker value={form.time} onChange={v => set("time", v)} />
              </div>

              {/* Pickup section */}
              <div style={{ background: "#F0F7FF", borderRadius: 12, padding: "14px", marginBottom: 14, border: `1px solid #C0D8F0` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2A5080", marginBottom: 10 }}>🚗 Pickup</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ ...label, color: "#2A5080" }}>Pickup time</div>
                  <TimePicker value={form.pickupTime || ""} onChange={v => set("pickupTime", v)} />
                </div>
                <div>
                  <div style={{ ...label, color: "#2A5080", marginBottom: 6 }}>Who's picking up?</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[...people, "Other"].map(person => (
                      <button key={person} onClick={() => set("pickupBy", person)} style={{
                        flex: 1, minWidth: 80, padding: "9px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                        border: `1.5px solid ${form.pickupBy === person ? "#5A89B8" : "#C0D8F0"}`,
                        background: form.pickupBy === person ? "#E8F0FA" : p.white,
                        color: form.pickupBy === person ? "#2A5080" : p.muted,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>{person}</button>
                    ))}
                  </div>
                  {form.pickupBy === "Other" && (
                    <input
                      value={form.pickupByOther || ""}
                      onChange={e => set("pickupByOther", e.target.value)}
                      placeholder="e.g. Grandma, Coach Tim..."
                      style={{ ...inputStyle, marginTop: 8 }}
                    />
                  )}
                </div>
              </div>

              {/* Assigned to */}
              {people.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={label}>Assigned to (drop-off / supervision)</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    {people.map(person => (
                      <button key={person} onClick={() => set("assignedTo", person)} style={{
                        flex: 1, padding: "9px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                        border: `1.5px solid ${form.assignedTo === person ? p.accent : p.warm}`,
                        background: form.assignedTo === person ? p.accentLight : p.white,
                        color: form.assignedTo === person ? p.accent : p.muted,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>{person}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Urgent toggle for reminders */}
          {form.isReminder && (
            <div style={{ marginBottom: 14 }}>
              <div onClick={() => set("urgent", !form.urgent)}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: form.urgent ? p.accent : p.warm, position: "relative", transition: "background 0.2s",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: p.white,
                    position: "absolute", top: 3, left: form.urgent ? 23 : 3, transition: "left 0.2s",
                  }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: p.text }}>Mark as urgent ⚡</span>
              </div>
            </div>
          )}

          {/* Bottom padding so content clears the sticky footer */}
          <div style={{ height: 16 }} />
        </div>

        {/* Sticky action footer — always visible */}
        <div style={{ paddingTop: 12, borderTop: `1px solid ${p.warm}`, background: p.bg }}>
          <button onClick={handleSave} disabled={!canSave} style={{
            width: "100%", background: canSave ? p.accent : p.warm,
            color: canSave ? p.white : p.muted,
            border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600,
            cursor: canSave ? "pointer" : "default", fontFamily: "inherit", marginBottom: 8,
            transition: "all 0.2s",
          }}>
            {isNew ? (form.isReminder ? "Add reminder" : "Add to schedule") : "Save changes"}
          </button>
          {!isNew && (
            <button onClick={() => { if (window.confirm("Remove this item?")) onDelete(event.id); }} style={{
              width: "100%", background: "transparent", color: p.red,
              border: `1.5px solid ${p.redLight}`, borderRadius: 12, padding: "12px",
              fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}>Remove event</button>
          )}
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200,
  display: "flex", alignItems: "flex-end", justifyContent: "center",
};
const sheet = {
  width: "100%", maxWidth: 430, background: "#FDF8F3",
  borderRadius: "20px 20px 0 0", padding: "16px 20px 28px",
  maxHeight: "92vh", display: "flex", flexDirection: "column",
  // Safe area for home indicator on iOS
  paddingBottom: "max(28px, env(safe-area-inset-bottom))",
};
const closeBtn = { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#8C7B72", padding: 4 };
const label = { fontSize: 12, fontWeight: 600, color: "#2A1F1A", marginBottom: 4 };
const inputStyle = {
  width: "100%", border: "1.5px solid #F5EDE0", borderRadius: 10,
  padding: "10px 13px", fontSize: 13, color: "#2A1F1A", background: "#FFFFFF",
  outline: "none", fontFamily: "inherit",
};
