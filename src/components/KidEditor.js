// src/components/KidEditor.js
import { useState } from "react";
import { uid } from "../lib/storage";

const p = {
  warm: "#F5EDE0", accent: "#E8825A", accentSoft: "#F2C4A8",
  purple: "#9B7BB8", purpleSoft: "#DDD0EE",
  text: "#2A1F1A", muted: "#8C7B72", white: "#FFFFFF", bg: "#FDF8F3",
};

const KID_EMOJIS = ["🦋", "🦕", "🐻", "🦊", "🐼", "🦁", "🐸", "🐧", "🦄", "🐳", "🌻", "⭐", "🎈", "🚀", "🌈", "🎯"];

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: p.text, marginBottom: 3 }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: p.muted, marginBottom: 5 }}>{hint}</div>}
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", border: `1.5px solid ${p.warm}`, borderRadius: 10, padding: "10px 13px", fontSize: 13, color: p.text, background: p.white, outline: "none", fontFamily: "inherit" }} />
  );
}

export default function KidEditor({ kid, onSave, onDelete, onClose }) {
  const isNew = !kid;
  const [medInput, setMedInput] = useState("");
  const [form, setForm] = useState(kid || {
    id: uid(), emoji: "🦋", name: "", age: "", school: "", teacher: "",
    doctor: "", doctorPhone: "", nextAppt: "", allergies: "", medications: [], activities: "", notes: "",
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addMed = () => {
    if (!medInput.trim()) return;
    set("medications", [...(form.medications || []), medInput.trim()]);
    setMedInput("");
  };

  const removeMed = (i) => set("medications", form.medications.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim(), age: parseInt(form.age) || 0 });
  };

  return (
    <div style={overlay}>
      <div style={sheet}>
        {/* Handle bar */}
        <div style={{ width: 36, height: 4, background: p.warm, borderRadius: 2, margin: "0 auto 20px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: p.text }}>
            {isNew ? "Add a child" : `Edit ${kid.name}`}
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, paddingBottom: 20 }}>
          {/* Emoji */}
          <Field label="Pick an emoji">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {KID_EMOJIS.map(e => (
                <button key={e} onClick={() => set("emoji", e)} style={{
                  width: 42, height: 42, borderRadius: 10, fontSize: 20,
                  border: `2px solid ${form.emoji === e ? p.accent : p.warm}`,
                  background: form.emoji === e ? p.accentSoft : p.white,
                  cursor: "pointer",
                }}>{e}</button>
              ))}
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="First name *">
              <Input value={form.name} onChange={v => set("name", v)} placeholder="e.g. Lila" />
            </Field>
            <Field label="Age *">
              <Input value={form.age} onChange={v => set("age", v)} placeholder="7" type="number" />
            </Field>
          </div>

          <Field label="School">
            <Input value={form.school} onChange={v => set("school", v)} placeholder="e.g. Maplewood Elementary · Grade 2" />
          </Field>

          <Field label="Teacher">
            <Input value={form.teacher} onChange={v => set("teacher", v)} placeholder="e.g. Ms. Hendricks" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Doctor">
              <Input value={form.doctor} onChange={v => set("doctor", v)} placeholder="Dr. Patel" />
            </Field>
            <Field label="Doctor phone">
              <Input value={form.doctorPhone} onChange={v => set("doctorPhone", v)} placeholder="(555) 000-0000" type="tel" />
            </Field>
          </div>

          <Field label="Next appointment">
            <Input value={form.nextAppt} onChange={v => set("nextAppt", v)} placeholder="e.g. Mar 6 · Annual checkup" />
          </Field>

          <Field label="Allergies">
            <Input value={form.allergies} onChange={v => set("allergies", v)} placeholder="e.g. Peanuts · EpiPen in backpack" />
          </Field>

          <Field label="Medications" hint="Press Add or Enter after each one">
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={medInput} onChange={e => setMedInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addMed()}
                placeholder="e.g. Zyrtec 10mg (morning)"
                style={{ flex: 1, border: `1.5px solid ${p.warm}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
              <button onClick={addMed} style={{ background: p.accent, color: p.white, border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Add</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(form.medications || []).map((m, i) => (
                <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: p.purpleSoft, borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 500, color: p.purple }}>
                  {m}
                  <button onClick={() => removeMed(i)} style={{ background: "none", border: "none", color: p.purple, cursor: "pointer", fontSize: 15, padding: 0, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          </Field>

          <Field label="Activities">
            <Input value={form.activities} onChange={v => set("activities", v)} placeholder="e.g. Swimming Tue/Thu · Ballet Friday" />
          </Field>

          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Anything the co-parent should know..."
              rows={3}
              style={{ width: "100%", border: `1.5px solid ${p.warm}`, borderRadius: 10, padding: "10px 13px", fontSize: 13, color: p.text, background: p.white, outline: "none", fontFamily: "inherit", resize: "none" }} />
          </Field>
        </div>

        {/* Actions */}
        <div style={{ paddingTop: 12, borderTop: `1px solid ${p.warm}` }}>
          <button onClick={handleSave} disabled={!form.name.trim()} style={{
            width: "100%", background: form.name.trim() ? p.accent : p.warm, color: form.name.trim() ? p.white : p.muted,
            border: "none", borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, cursor: form.name.trim() ? "pointer" : "default", fontFamily: "inherit", marginBottom: 8,
          }}>
            {isNew ? "Add child" : "Save changes"}
          </button>
          {!isNew && (
            <button onClick={() => { if (window.confirm(`Remove ${kid.name}?`)) onDelete(kid.id); }} style={{
              width: "100%", background: "transparent", color: "#C0392B", border: `1.5px solid #F5C6C2`,
              borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}>Remove {kid.name}</button>
          )}
        </div>
      </div>
    </div>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" };
const sheet = { width: "100%", maxWidth: 430, background: "#FDF8F3", borderRadius: "20px 20px 0 0", padding: "16px 20px 32px", maxHeight: "90vh", display: "flex", flexDirection: "column" };
const closeBtn = { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#8C7B72", padding: 4 };
