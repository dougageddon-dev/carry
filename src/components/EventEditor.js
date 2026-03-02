// src/components/EventEditor.js
import { useState } from "react";
import { uid } from "../lib/storage";

const p = {
  warm: "#F5EDE0", accent: "#E8825A", green: "#7BAF8E",
  text: "#2A1F1A", muted: "#8C7B72", white: "#FFFFFF", bg: "#FDF8F3",
};

const EMOJIS = ["📅", "🏊", "⚽", "🎨", "🎵", "📚", "💊", "🏥", "🎂", "📋", "🚌", "⚡", "🏃", "🍎", "🎯", "🎭", "🏀", "🎾", "🧪", "🎪"];
const DAYS = ["Today", "Tomorrow", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", border: `1.5px solid ${p.warm}`, borderRadius: 10, padding: "10px 13px", fontSize: 13, color: p.text, background: p.white, outline: "none", fontFamily: "inherit" }} />
  );
}

export default function EventEditor({ event, people, onSave, onDelete, onClose }) {
  const isNew = !event;
  const [form, setForm] = useState(event || {
    id: uid(), emoji: "📅", title: "", sub: "", time: "", day: "Today",
    assignedTo: people[0] || "", isReminder: false, urgent: false,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, title: form.title.trim(), sub: form.sub.trim() });
  };

  return (
    <div style={overlay}>
      <div style={sheet}>
        <div style={{ width: 36, height: 4, background: p.warm, borderRadius: 2, margin: "0 auto 20px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: p.text }}>
            {isNew ? "Add event" : "Edit event"}
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, paddingBottom: 16 }}>

          {/* Type toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["Schedule item", false], ["Reminder", true]].map(([label, val]) => (
              <button key={label} onClick={() => set("isReminder", val)} style={{
                flex: 1, padding: "9px", borderRadius: 10, fontSize: 13, fontWeight: 500, border: `1.5px solid`,
                borderColor: form.isReminder === val ? p.accent : p.warm,
                background: form.isReminder === val ? "#FEF0E8" : p.white,
                color: form.isReminder === val ? p.accent : p.muted,
                cursor: "pointer", fontFamily: "inherit",
              }}>{label}</button>
            ))}
          </div>

          {/* Emoji */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: p.text, marginBottom: 8 }}>Icon</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => set("emoji", e)} style={{
                  width: 38, height: 38, borderRadius: 8, fontSize: 18,
                  border: `2px solid ${form.emoji === e ? p.accent : p.warm}`,
                  background: form.emoji === e ? "#FEF0E8" : p.white,
                  cursor: "pointer",
                }}>{e}</button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: p.text, marginBottom: 4 }}>Title *</div>
            <Input value={form.title} onChange={v => set("title", v)} placeholder={form.isReminder ? "e.g. Permission slip due" : "e.g. Swim practice — Lila"} />
          </div>

          {/* Detail */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: p.text, marginBottom: 4 }}>Details</div>
            <Input value={form.sub} onChange={v => set("sub", v)} placeholder="e.g. Aquatic Centre, Lane 3 · Bring cap & goggles" />
          </div>

          {!form.isReminder && (
            <>
              {/* Day */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: p.text, marginBottom: 6 }}>Day</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {DAYS.map(d => (
                    <button key={d} onClick={() => set("day", d)} style={{
                      padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1.5px solid`,
                      borderColor: form.day === d ? p.accent : p.warm,
                      background: form.day === d ? "#FEF0E8" : p.white,
                      color: form.day === d ? p.accent : p.muted,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>{d}</button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: p.text, marginBottom: 4 }}>Time</div>
                <Input value={form.time} onChange={v => set("time", v)} placeholder="e.g. 9:00 AM" type="time" />
              </div>

              {/* Assigned to */}
              {people.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: p.text, marginBottom: 6 }}>Assigned to</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {people.map(person => (
                      <button key={person} onClick={() => set("assignedTo", person)} style={{
                        flex: 1, padding: "9px", borderRadius: 10, fontSize: 13, fontWeight: 500, border: `1.5px solid`,
                        borderColor: form.assignedTo === person ? p.accent : p.warm,
                        background: form.assignedTo === person ? "#FEF0E8" : p.white,
                        color: form.assignedTo === person ? p.accent : p.muted,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>{person}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Urgent toggle (for reminders) */}
          {form.isReminder && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div onClick={() => set("urgent", !form.urgent)} style={{
                  width: 44, height: 24, borderRadius: 12, background: form.urgent ? p.accent : p.warm,
                  position: "relative", transition: "background 0.2s",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: p.white,
                    position: "absolute", top: 3, left: form.urgent ? 23 : 3, transition: "left 0.2s",
                  }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: p.text }}>Mark as urgent</span>
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ paddingTop: 12, borderTop: `1px solid ${p.warm}` }}>
          <button onClick={handleSave} disabled={!form.title.trim()} style={{
            width: "100%", background: form.title.trim() ? p.accent : p.warm, color: form.title.trim() ? p.white : p.muted,
            border: "none", borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600,
            cursor: form.title.trim() ? "pointer" : "default", fontFamily: "inherit", marginBottom: 8,
          }}>
            {isNew ? (form.isReminder ? "Add reminder" : "Add to schedule") : "Save changes"}
          </button>
          {!isNew && (
            <button onClick={() => { if (window.confirm("Remove this item?")) onDelete(event.id); }} style={{
              width: "100%", background: "transparent", color: "#C0392B", border: `1.5px solid #F5C6C2`,
              borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}>Remove</button>
          )}
        </div>
      </div>
    </div>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" };
const sheet = { width: "100%", maxWidth: 430, background: "#FDF8F3", borderRadius: "20px 20px 0 0", padding: "16px 20px 32px", maxHeight: "90vh", display: "flex", flexDirection: "column" };
const closeBtn = { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#8C7B72", padding: 4 };
