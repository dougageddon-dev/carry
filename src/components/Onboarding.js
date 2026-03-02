// src/components/Onboarding.js
import { useState } from "react";
import { uid } from "../lib/storage";

const p = {
  bg: "#FDF8F3", warm: "#F5EDE0", accent: "#E8825A", accentSoft: "#F2C4A8",
  green: "#7BAF8E", greenSoft: "#C8E6D0", blue: "#5A89B8",
  purple: "#9B7BB8", purpleSoft: "#DDD0EE",
  text: "#2A1F1A", muted: "#8C7B72", white: "#FFFFFF",
};

const KID_EMOJIS = ["🦋", "🦕", "🐻", "🦊", "🐼", "🦁", "🐸", "🐧", "🦄", "🐳", "🌻", "⭐"];


// ─── Shared UI helpers ───────────────────────────────────────────────────────

function StepHeader({ step, total, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < step ? p.accent : p.warm,
            transition: "background 0.3s"
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: p.accent, marginBottom: 6 }}>
        Step {step} of {total}
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: p.text, marginBottom: 6, lineHeight: 1.2 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 14, color: p.muted, lineHeight: 1.5 }}>{subtitle}</div>}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: p.text, marginBottom: 4 }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: p.muted, marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", maxLength }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        width: "100%", border: `1.5px solid ${p.warm}`, borderRadius: 12,
        padding: "11px 14px", fontSize: 14, color: p.text, background: p.white,
        outline: "none", fontFamily: "inherit",
      }}
    />
  );
}

function PrimaryBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", background: disabled ? p.warm : p.accent, color: disabled ? p.muted : p.white,
      border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 600,
      cursor: disabled ? "default" : "pointer", fontFamily: "inherit", marginTop: 8,
      transition: "all 0.2s",
    }}>{children}</button>
  );
}

function SecondaryBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", background: "transparent", color: p.muted,
      border: `1.5px solid ${p.warm}`, borderRadius: 14, padding: "12px", fontSize: 14, fontWeight: 500,
      cursor: "pointer", fontFamily: "inherit", marginTop: 8,
    }}>{children}</button>
  );
}

// ─── Step 1: Welcome ─────────────────────────────────────────────────────────

function WelcomeStep({ onNext }) {
  return (
    <div style={{ textAlign: "center", paddingTop: 40 }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🧡</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: p.text, marginBottom: 8 }}>
        carry<span style={{ color: p.accent }}>.</span>
      </div>
      <div style={{ fontSize: 16, color: p.muted, lineHeight: 1.6, marginBottom: 40, maxWidth: 280, margin: "0 auto 40px" }}>
        Your family's mental load, organized and shared — so nothing falls through the cracks.
      </div>
      <div style={{ textAlign: "left", background: p.white, borderRadius: 16, padding: 20, marginBottom: 24, border: `1px solid ${p.warm}` }}>
        {[
          ["📅", "Schedule & reminders in one place"],
          ["👧", "Complete profiles for each kid"],
          ["📱", "One-tap updates to your co-parent"],
          ["✦", "AI assistant that knows your family"],
        ].map(([icon, text]) => (
          <div key={text} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 20, width: 32, textAlign: "center" }}>{icon}</div>
            <div style={{ fontSize: 14, color: p.text }}>{text}</div>
          </div>
        ))}
      </div>
      <PrimaryBtn onClick={onNext}>Let's set up your family →</PrimaryBtn>
    </div>
  );
}

// ─── Step 2: Primary parent ───────────────────────────────────────────────────

function PrimaryParentStep({ data, onChange, onNext, onBack }) {
  const valid = data.name.trim().length > 0;
  return (
    <div>
      <StepHeader step={1} total={4} title="About you" subtitle="You're the primary organizer — the one who keeps track of everything." />
      <Field label="Your first name">
        <Input value={data.name} onChange={v => onChange({ ...data, name: v })} placeholder="e.g. Sarah" />
      </Field>
      <Field label="Your phone number" hint="Used for the co-parent texting feature">
        <Input value={data.phone} onChange={v => onChange({ ...data, phone: v })} placeholder="+1 (555) 000-0000" type="tel" />
      </Field>
      <Field label="Your city / neighbourhood" hint="Helps with camp and activity searches">
        <Input value={data.city} onChange={v => onChange({ ...data, city: v })} placeholder="e.g. Toronto, ON" />
      </Field>
      <PrimaryBtn onClick={onNext} disabled={!valid}>Continue →</PrimaryBtn>
    </div>
  );
}

// ─── Step 3: Co-parent ────────────────────────────────────────────────────────

function CoParentStep({ data, onChange, onNext, onBack }) {
  const valid = data.name.trim().length > 0;
  return (
    <div>
      <StepHeader step={2} total={4} title="Your co-parent" subtitle="Who will be receiving schedule updates and reminders?" />
      <Field label="Their first name">
        <Input value={data.name} onChange={v => onChange({ ...data, name: v })} placeholder="e.g. Marcus" />
      </Field>
      <Field label="Their cell number" hint="carry. will open iMessage pre-filled with updates">
        <Input value={data.phone} onChange={v => onChange({ ...data, phone: v })} placeholder="+1 (555) 000-0000" type="tel" />
      </Field>
      <Field label="Relationship to kids">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Dad", "Mom", "Grandparent", "Caregiver", "Other"].map(rel => (
            <button key={rel} onClick={() => onChange({ ...data, relation: rel })} style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
              background: data.relation === rel ? p.accent : p.warm,
              color: data.relation === rel ? p.white : p.text,
              border: "none", cursor: "pointer", fontFamily: "inherit",
            }}>{rel}</button>
          ))}
        </div>
      </Field>
      <PrimaryBtn onClick={onNext} disabled={!valid}>Continue →</PrimaryBtn>
      <SecondaryBtn onClick={onBack}>← Back</SecondaryBtn>
    </div>
  );
}

// ─── Step 4: First kid ────────────────────────────────────────────────────────

function FirstKidStep({ data, onChange, onNext, onBack }) {
  const [medInput, setMedInput] = useState("");
  const valid = data.name.trim().length > 0 && data.age;

  const addMed = () => {
    if (!medInput.trim()) return;
    onChange({ ...data, medications: [...(data.medications || []), medInput.trim()] });
    setMedInput("");
  };

  const removeMed = (i) => {
    onChange({ ...data, medications: data.medications.filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <StepHeader step={3} total={4} title={`Add your first child`} subtitle="You can add more kids after setup. Start with the basics — you can fill in more details later." />

      {/* Emoji picker */}
      <Field label="Pick an emoji">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {KID_EMOJIS.map(e => (
            <button key={e} onClick={() => onChange({ ...data, emoji: e })} style={{
              width: 44, height: 44, borderRadius: 12, fontSize: 22, border: `2px solid`,
              borderColor: data.emoji === e ? p.accent : p.warm,
              background: data.emoji === e ? p.accentSoft : p.white,
              cursor: "pointer",
            }}>{e}</button>
          ))}
        </div>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="First name">
          <Input value={data.name} onChange={v => onChange({ ...data, name: v })} placeholder="e.g. Lila" />
        </Field>
        <Field label="Age">
          <Input value={data.age} onChange={v => onChange({ ...data, age: v })} placeholder="e.g. 7" type="number" />
        </Field>
      </div>

      <Field label="School" hint="Optional">
        <Input value={data.school} onChange={v => onChange({ ...data, school: v })} placeholder="e.g. Maplewood Elementary · Grade 2" />
      </Field>

      <Field label="Teacher" hint="Optional">
        <Input value={data.teacher} onChange={v => onChange({ ...data, teacher: v })} placeholder="e.g. Ms. Hendricks" />
      </Field>

      <Field label="Doctor / Paediatrician" hint="Optional">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Input value={data.doctor} onChange={v => onChange({ ...data, doctor: v })} placeholder="Dr. Patel" />
          <Input value={data.doctorPhone} onChange={v => onChange({ ...data, doctorPhone: v })} placeholder="(416) 555-0000" type="tel" />
        </div>
      </Field>

      <Field label="Allergies" hint="Optional — enter 'None' if none">
        <Input value={data.allergies} onChange={v => onChange({ ...data, allergies: v })} placeholder="e.g. Peanuts, bee stings" />
      </Field>

      <Field label="Medications" hint="Optional — add one at a time">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={medInput}
            onChange={e => setMedInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addMed()}
            placeholder="e.g. Zyrtec 10mg (morning)"
            style={{ flex: 1, border: `1.5px solid ${p.warm}`, borderRadius: 12, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
          />
          <button onClick={addMed} style={{ background: p.accent, color: p.white, border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
        </div>
        {(data.medications || []).map((m, i) => (
          <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: p.purpleSoft, borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 500, color: p.purple, marginRight: 6, marginBottom: 6 }}>
            {m}
            <button onClick={() => removeMed(i)} style={{ background: "none", border: "none", color: p.purple, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        ))}
      </Field>

      <Field label="Activities" hint="Optional">
        <Input value={data.activities} onChange={v => onChange({ ...data, activities: v })} placeholder="e.g. Swimming Tue/Thu · Ballet Friday" />
      </Field>

      <Field label="Notes" hint="Anything the co-parent needs to know">
        <textarea
          value={data.notes}
          onChange={e => onChange({ ...data, notes: e.target.value })}
          placeholder="e.g. Needs water bottle daily. Library books due Monday."
          rows={3}
          style={{ width: "100%", border: `1.5px solid ${p.warm}`, borderRadius: 12, padding: "11px 14px", fontSize: 13, color: p.text, background: p.white, outline: "none", fontFamily: "inherit", resize: "none" }}
        />
      </Field>

      <PrimaryBtn onClick={onNext} disabled={!valid}>Continue →</PrimaryBtn>
      <SecondaryBtn onClick={onBack}>← Back</SecondaryBtn>
    </div>
  );
}

// ─── Step 5: Done ─────────────────────────────────────────────────────────────

function DoneStep({ primaryParent, coParent, kid, onFinish }) {
  return (
    <div style={{ textAlign: "center" }}>
      <StepHeader step={4} total={4} title="You're all set!" subtitle="" />
      <div style={{ fontSize: 56, marginBottom: 16 }}>{kid.emoji}</div>
      <div style={{ background: p.white, borderRadius: 16, padding: 20, border: `1px solid ${p.warm}`, textAlign: "left", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: p.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Your family</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.purpleSoft, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: p.purple }}>{primaryParent.name[0]}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: p.text }}>{primaryParent.name} (you)</div>
            {primaryParent.phone && <div style={{ fontSize: 12, color: p.muted }}>{primaryParent.phone}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: p.green }}>{coParent.name[0]}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: p.text }}>{coParent.name} ({coParent.relation || "Co-parent"})</div>
            {coParent.phone && <div style={{ fontSize: 12, color: p.muted }}>{coParent.phone}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F2C4A8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{kid.emoji}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: p.text }}>{kid.name}, age {kid.age}</div>
            {kid.school && <div style={{ fontSize: 12, color: p.muted }}>{kid.school}</div>}
          </div>
        </div>
      </div>
      <div style={{ background: "#C8E6D0", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#2A5A3A", marginBottom: 24, textAlign: "left" }}>
        💡 You can add more kids, schedule items, and reminders from the main app. Everything saves automatically.
      </div>
      <PrimaryBtn onClick={onFinish}>Open carry. →</PrimaryBtn>
    </div>
  );
}

// ─── Main Onboarding component ────────────────────────────────────────────────

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0); // 0=welcome, 1=primary, 2=coparent, 3=kid, 4=done
  const [primaryParent, setPrimaryParent] = useState({ name: "", phone: "", city: "" });
  const [coParent, setCoParent] = useState({ name: "", phone: "", relation: "Dad" });
  const [kid, setKid] = useState({
    emoji: "🦋", name: "", age: "", school: "", teacher: "",
    doctor: "", doctorPhone: "", allergies: "", medications: [], activities: "", notes: "",
  });

  const buildFamily = () => ({
    primaryParent: {
      name: primaryParent.name.trim(),
      phone: primaryParent.phone.trim(),
      emoji: primaryParent.name.trim()[0]?.toUpperCase() || "P",
      color: "#9B7BB8",
    },
    coParent: {
      name: coParent.name.trim(),
      phone: coParent.phone.trim(),
      relation: coParent.relation,
      emoji: coParent.name.trim()[0]?.toUpperCase() || "C",
      color: "#5A89B8",
    },
    location: { city: primaryParent.city.trim() || "Your city", lat: 43.6532, lng: -79.3832 },
    kids: [{
      id: uid(),
      name: kid.name.trim(),
      age: parseInt(kid.age) || 0,
      emoji: kid.emoji,
      school: kid.school.trim(),
      teacher: kid.teacher.trim(),
      doctor: kid.doctor.trim(),
      doctorPhone: kid.doctorPhone.trim(),
      nextAppt: "",
      allergies: kid.allergies.trim() || "None known",
      medications: kid.medications,
      activities: kid.activities.trim(),
      notes: kid.notes.trim(),
    }],
    schedule: [],
    reminders: [],
    sentMessages: [],
  });

  const finish = () => {
    const family = buildFamily();
    onComplete(family);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F0EBE3; font-family: 'DM Sans', sans-serif; }
        button { font-family: 'DM Sans', sans-serif; }
        input, textarea { font-family: 'DM Sans', sans-serif; }
      `}</style>
      <div style={{ maxWidth: 430, margin: "0 auto", background: p.bg, minHeight: "100vh", padding: "52px 24px 40px", overflowY: "auto" }}>
        {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
        {step === 1 && <PrimaryParentStep data={primaryParent} onChange={setPrimaryParent} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <CoParentStep data={coParent} onChange={setCoParent} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <FirstKidStep data={kid} onChange={setKid} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <DoneStep primaryParent={primaryParent} coParent={coParent} kid={kid} onFinish={finish} />}
      </div>
    </>
  );
}
