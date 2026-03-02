// src/App.js
import { useState } from "react";
import { AppProvider, useApp } from "./lib/AppContext";
import AIAssistant from "./components/AIAssistant";
import FindTab from "./components/FindTab";
import Onboarding from "./components/Onboarding";
import KidEditor from "./components/KidEditor";
import EventEditor from "./components/EventEditor";
import { generateCoParentMessage } from "./lib/api";

const p = {
  bg: "#FDF8F3", warm: "#F5EDE0", accent: "#E8825A", accentSoft: "#F2C4A8",
  green: "#7BAF8E", greenSoft: "#C8E6D0", blue: "#5A89B8", blueSoft: "#C0D8F0",
  purple: "#9B7BB8", purpleSoft: "#DDD0EE",
  text: "#2A1F1A", muted: "#8C7B72", white: "#FFFFFF",
};

// iOS uses & to separate number/body; Android uses ?
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const smsLink = (phone, body) => {
  const sep = isIOS ? "&" : "?";
  const clean = phone.replace(/\D/g, "");
  return `sms:${clean}${sep}body=${encodeURIComponent(body)}`;
};

// ─── Today Tab ────────────────────────────────────────────────────────────────
function TodayTab() {
  const { family, addEvent, updateEvent, removeEvent, addReminder, updateReminder, removeReminder } = useApp();
  const [showEventEditor, setShowEventEditor] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showReminderEditor, setShowReminderEditor] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendDone, setSendDone] = useState(false);

  const people = [family.primaryParent.name, family.coParent.name];

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const handleSend = async () => {
    setSendLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const phone = family.coParent.phone;
    const text = `Hi ${family.coParent.name}! Here's today's schedule:\n${family.schedule.map(e => `• ${e.time || ""} ${e.title}`).join("\n")}`;
    if (phone) {
      window.open(smsLink(phone, text), "_blank");
    }
    setSendLoading(false);
    setSendDone(true);
    setTimeout(() => setSendDone(false), 3000);
  };

  const todaySchedule = family.schedule.filter(e => !e.isReminder);
  const reminders = family.reminders || [];

  const emojiColors = {
    "🏊": { bg: p.blueSoft, who: p.blue }, "💊": { bg: p.purpleSoft, who: p.purple },
    "⚽": { bg: p.greenSoft, who: p.green }, "📚": { bg: p.warm, who: p.muted },
    "🏥": { bg: "#FFE0D6", who: "#C0392B" }, "📅": { bg: p.warm, who: p.muted },
  };

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={s.dateBadge}>{today}</div>

      {/* Urgent reminders */}
      {reminders.filter(r => r.urgent).map(r => (
        <div key={r.id} style={s.urgentStrip} onClick={() => { setEditingReminder(r); setShowReminderEditor(true); }}>
          <div style={{ fontSize: 22 }}>{r.emoji || "⚡"}</div>
          <div style={{ flex: 1 }}>
            <div style={s.urgentTitle}>{r.text}</div>
            {r.sub && <div style={s.urgentSub}>{r.sub}</div>}
          </div>
          <div style={{ fontSize: 18, opacity: 0.7 }}>›</div>
        </div>
      ))}

      {/* Send strip */}
      {family.coParent.name && (
        <div style={s.sendStrip}>
          <div style={{ fontSize: 20 }}>📱</div>
          <div style={{ flex: 1, fontSize: 13, color: p.text }}>
            <strong style={{ display: "block", fontSize: 12, fontWeight: 600, color: p.green, marginBottom: 1 }}>
              Ready to send to {family.coParent.name}
            </strong>
            Today's schedule · {todaySchedule.length} items
          </div>
          <button style={s.sendBtn} onClick={handleSend} disabled={sendLoading}>
            {sendDone ? "✓ Done!" : sendLoading ? "…" : "Send"}
          </button>
        </div>
      )}

      {/* Schedule */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 10 }}>
        <div style={s.sectionLabel}>Today's Schedule</div>
        <button onClick={() => { setEditingEvent(null); setShowEventEditor(true); }} style={s.addBtn}>＋ Add event</button>
      </div>

      {todaySchedule.length === 0 && (
        <div style={s.emptyState}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
          <div style={{ fontSize: 14, color: p.muted }}>No schedule items yet</div>
          <button onClick={() => { setEditingEvent(null); setShowEventEditor(true); }} style={{ ...s.sendBtn, marginTop: 12, padding: "8px 20px" }}>Add your first item</button>
        </div>
      )}

      {todaySchedule.map(item => {
        const c = emojiColors[item.emoji] || { bg: p.warm, who: p.muted };
        return (
          <div key={item.id} style={s.card} onClick={() => { setEditingEvent(item); setShowEventEditor(true); }}>
            <div style={s.cardRow}>
              <div style={{ ...s.timeDot, background: c.bg }}>{item.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={s.cardTitle}>{item.title}</div>
                {item.sub && <div style={s.cardSub}>{item.sub}</div>}
                {item.assignedTo && (
                  <div style={s.whoBadge}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.who }} />
                    {item.assignedTo}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                {item.time && <div style={s.cardTime}>{item.time}</div>}
                {item.day && item.day !== "Today" && <div style={{ fontSize: 11, color: p.muted }}>{item.day}</div>}
              </div>
            </div>
          </div>
        );
      })}

      {/* Reminders */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 10 }}>
        <div style={s.sectionLabel}>Reminders</div>
        <button onClick={() => { setEditingReminder(null); setShowReminderEditor(true); }} style={s.addBtn}>＋ Add reminder</button>
      </div>

      {reminders.filter(r => !r.urgent).map(r => (
        <div key={r.id} style={s.card} onClick={() => { setEditingReminder(r); setShowReminderEditor(true); }}>
          <div style={s.cardRow}>
            <div style={{ ...s.timeDot, background: p.warm }}>{r.emoji || "📋"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ ...s.cardTitle, fontWeight: 400 }}>{r.text}</div>
              {r.sub && <div style={s.cardSub}>{r.sub}</div>}
            </div>
            <div style={{ fontSize: 18, color: p.muted }}>›</div>
          </div>
        </div>
      ))}

      {reminders.length === 0 && (
        <div style={s.emptyState}>
          <div style={{ fontSize: 14, color: p.muted }}>No reminders yet</div>
        </div>
      )}

      {/* Editors */}
      {showEventEditor && (
        <EventEditor
          event={editingEvent}
          people={people}
          onSave={ev => {
            editingEvent ? updateEvent(ev) : addEvent(ev);
            setShowEventEditor(false);
          }}
          onDelete={id => { removeEvent(id); setShowEventEditor(false); }}
          onClose={() => setShowEventEditor(false)}
        />
      )}

      {showReminderEditor && (
        <EventEditor
          event={editingReminder ? { ...editingReminder, isReminder: true } : null}
          people={people}
          onSave={ev => {
            const reminder = { ...ev, text: ev.title, isReminder: undefined };
            editingReminder ? updateReminder(reminder) : addReminder(reminder);
            setShowReminderEditor(false);
          }}
          onDelete={id => { removeReminder(id); setShowReminderEditor(false); }}
          onClose={() => setShowReminderEditor(false)}
        />
      )}
    </div>
  );
}

// ─── Kids Tab ─────────────────────────────────────────────────────────────────
function KidsTab() {
  const { family, addKid, updateKid, removeKid } = useApp();
  const [showEditor, setShowEditor] = useState(false);
  const [editingKid, setEditingKid] = useState(null);

  const avatarColors = ["#C0D8F0", "#C8E6D0", "#DDD0EE", "#F2C4A8", "#FFE4B5"];

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {family.kids.map((kid, i) => (
        <div key={kid.id} style={s.kidCard} onClick={() => { setEditingKid(kid); setShowEditor(true); }}>
          <div style={s.kidHeader}>
            <div style={{ ...s.kidAvatar, background: avatarColors[i % avatarColors.length] }}>{kid.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={s.kidName}>{kid.name}</div>
              <div style={{ fontSize: 12, color: p.muted }}>{kid.age} years old</div>
            </div>
            <div style={{ fontSize: 13, color: p.accent, fontWeight: 500 }}>Edit ›</div>
          </div>
          <div style={s.infoGrid}>
            {[
              ["🏫 School", kid.school],
              ["👩‍🏫 Teacher", kid.teacher],
              ["🏥 Doctor", kid.doctor],
              ["📅 Next Appt", kid.nextAppt],
              ["⚠️ Allergies", kid.allergies],
              ["🎽 Activities", kid.activities],
            ].filter(([, val]) => val).map(([label, val]) => (
              <div key={label} style={{ ...s.infoItem, gridColumn: label.includes("Allergies") || label.includes("Activities") ? "span 2" : undefined }}>
                <div style={s.infoLabel}>{label}</div>
                <div style={s.infoVal}>{val}</div>
              </div>
            ))}
          </div>
          {kid.medications && kid.medications.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={s.infoLabel}>💊 Medications</div>
              {kid.medications.map(m => (
                <span key={m} style={s.medTag}>{m}</span>
              ))}
            </div>
          )}
          {kid.notes && <div style={s.notes}>📝 {kid.notes}</div>}
        </div>
      ))}

      {/* Add kid */}
      <button onClick={() => { setEditingKid(null); setShowEditor(true); }} style={s.addKidBtn}>
        <span style={{ fontSize: 22 }}>+</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Add another child</span>
      </button>

      {showEditor && (
        <KidEditor
          kid={editingKid}
          onSave={kid => {
            editingKid ? updateKid(kid) : addKid(kid);
            setShowEditor(false);
          }}
          onDelete={id => { removeKid(id); setShowEditor(false); }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}

// ─── Share Tab ────────────────────────────────────────────────────────────────
const MSG_TEMPLATES = ["This week's schedule", "Medication reminder", "Doctor summary", "Upcoming deadlines", "Permission forms due"];

function ShareTab() {
  const { family, getFamilyContext, addSentMessage } = useApp();
  const [selected, setSelected] = useState([]);
  const [generated, setGenerated] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sent, setSent] = useState(false);

  const toggle = c => setSelected(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c]);

  const generate = async () => {
    if (!selected.length) return;
    setGenerating(true);
    try {
      const result = await generateCoParentMessage(selected, getFamilyContext());
      setGenerated(result?.message || "");
    } catch {
      setGenerated("Could not generate message — check API key configuration.");
    } finally {
      setGenerating(false);
    }
  };

  const send = () => {
    const phone = family.coParent.phone || "";
    const encoded = encodeURIComponent(generated || "");
    window.open(smsLink(phone, encoded), "_blank");
    addSentMessage({ preview: generated });
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {!family.coParent.phone && (
        <div style={{ background: "#FFF3CD", border: "1px solid #FFD700", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#856404", marginBottom: 16 }}>
          💡 Add {family.coParent.name}'s phone number in Settings to enable one-tap texting.
        </div>
      )}

      <div style={s.composeBox}>
        <div style={s.composeLabel}>✨ Build a message for {family.coParent.name}</div>
        <div style={{ fontSize: 13, color: p.muted, marginBottom: 10 }}>What should they know about?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {MSG_TEMPLATES.map(c => (
            <div key={c} style={{ ...s.chip2, ...(selected.includes(c) ? s.chip2Active : {}) }} onClick={() => toggle(c)}>{c}</div>
          ))}
        </div>
        <button style={{ ...s.sendBtn, width: "100%", borderRadius: 12, padding: 12, marginBottom: 8, background: selected.length ? p.accent : p.warm, color: selected.length ? p.white : p.muted }}
          onClick={generate} disabled={generating || !selected.length}>
          {generating ? "✨ Writing with AI…" : "✨ Generate with AI"}
        </button>
        {generated && (
          <>
            <textarea style={s.textArea} value={generated} onChange={e => setGenerated(e.target.value)} rows={6} />
            <button style={{ ...s.sendBtn, width: "100%", borderRadius: 12, padding: 12, background: p.green }} onClick={send}>
              {sent ? "✓ Opened Messages!" : "📱 Send via iMessage"}
            </button>
          </>
        )}
      </div>

      {family.sentMessages && family.sentMessages.length > 0 && (
        <>
          <div style={s.sectionLabel}>Recent Sends</div>
          {family.sentMessages.map(m => (
            <div key={m.id} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: p.text }}>Sent to {family.coParent.name}</div>
                <div style={{ fontSize: 11, color: p.muted }}>{m.date}</div>
              </div>
              <div style={{ background: p.warm, borderRadius: 12, padding: "10px 12px", fontSize: 13, color: p.text, lineHeight: 1.5 }}>{m.preview}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const { family, setFamily } = useApp();
  const [saved, setSaved] = useState(false);
  const [primary, setPrimary] = useState({ ...family.primaryParent });
  const [coParent, setCoParent] = useState({ ...family.coParent });

  const save = () => {
    setFamily(f => ({ ...f, primaryParent: primary, coParent }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Field = ({ label, value, onChange, placeholder, type = "text" }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: p.text, marginBottom: 4 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", border: `1.5px solid ${p.warm}`, borderRadius: 10, padding: "10px 13px", fontSize: 13, color: p.text, background: p.white, outline: "none", fontFamily: "inherit" }} />
    </div>
  );

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={s.kidCard}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: p.text, marginBottom: 16 }}>Your profile</div>
        <Field label="Your name" value={primary.name} onChange={v => setPrimary(x => ({ ...x, name: v }))} placeholder="Your first name" />
        <Field label="Your phone" value={primary.phone || ""} onChange={v => setPrimary(x => ({ ...x, phone: v }))} placeholder="+1 (555) 000-0000" type="tel" />
        <Field label="City / Neighbourhood" value={family.location?.city || ""} onChange={v => setFamily(f => ({ ...f, location: { ...f.location, city: v } }))} placeholder="e.g. Toronto, ON" />
      </div>

      <div style={s.kidCard}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: p.text, marginBottom: 16 }}>Co-parent</div>
        <Field label="Name" value={coParent.name} onChange={v => setCoParent(x => ({ ...x, name: v }))} placeholder="e.g. Marcus" />
        <Field label="Cell number" value={coParent.phone || ""} onChange={v => setCoParent(x => ({ ...x, phone: v }))} placeholder="+1 (555) 000-0000" type="tel" />
        <Field label="Relationship" value={coParent.relation || ""} onChange={v => setCoParent(x => ({ ...x, relation: v }))} placeholder="e.g. Dad" />
      </div>

      <button onClick={save} style={{ ...s.sendBtn, width: "100%", borderRadius: 12, padding: 14, fontSize: 14 }}>
        {saved ? "✓ Saved!" : "Save changes"}
      </button>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function AppInner() {
  const [tab, setTab] = useState("today");
  const [showAI, setShowAI] = useState(false);
  const { family, setFamily } = useApp();

  // Show onboarding if not set up
  if (!family) {
    return <Onboarding onComplete={data => setFamily(data)} />;
  }

  const navItems = [
    { key: "today", icon: "📅", label: "Today" },
    { key: "kids", icon: "👧", label: "Kids" },
    { key: "find", icon: "🔍", label: "Find" },
    { key: "share", icon: "💬", label: "Share" },
    { key: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <>
      <style>{globalStyles}</style>
      <div style={s.app}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerTop}>
            <div>
              <div style={s.appName}>carry<span style={{ color: p.accent }}>.</span></div>
              <div style={s.headerSub}>{family.primaryParent.name}'s family</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ display: "flex" }}>
                {[family.primaryParent, family.coParent].map((person, i) => (
                  <div key={person.name} style={{ ...s.avatar, background: i === 0 ? p.purpleSoft : p.blueSoft, color: i === 0 ? p.purple : p.blue, marginLeft: i === 0 ? 0 : -8 }}>
                    {person.emoji || person.name[0]}
                  </div>
                ))}
              </div>
              <button style={s.aiBtn} onClick={() => setShowAI(true)} title="Ask AI">✦</button>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={s.nav}>
          {navItems.map(({ key, label }) => (
            <button key={key} style={{ ...s.navBtn, ...(tab === key ? s.navBtnActive : {}) }} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {/* Content */}
        {tab === "today" && <TodayTab />}
        {tab === "kids" && <KidsTab />}
        {tab === "find" && <FindTab />}
        {tab === "share" && <ShareTab />}
        {tab === "settings" && <SettingsTab />}

        {/* Bottom nav */}
        <div style={s.bottomNav}>
          {navItems.map(b => (
            <button key={b.key} style={s.bnavBtn} onClick={() => setTab(b.key)}>
              <div style={{ fontSize: 18 }}>{b.icon}</div>
              <div style={{ fontSize: 9, fontWeight: 500, color: tab === b.key ? p.accent : p.muted }}>{b.label}</div>
              {tab === b.key && <div style={{ width: 4, height: 4, borderRadius: "50%", background: p.accent, margin: "0 auto" }} />}
            </button>
          ))}
        </div>

        {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
      </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F0EBE3; font-family: 'DM Sans', sans-serif; }
  button { font-family: 'DM Sans', sans-serif; }
  input, textarea { font-family: 'DM Sans', sans-serif; }
  textarea { resize: none; }
`;

const s = {
  app: { maxWidth: 430, margin: "0 auto", background: "#FDF8F3", minHeight: "100vh", position: "relative" },
  header: { padding: "52px 24px 16px", background: "#fff", borderBottom: "1px solid #F5EDE0" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  appName: { fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#2A1F1A", fontWeight: 700 },
  headerSub: { fontSize: 13, color: "#8C7B72", fontWeight: 300 },
  avatar: { width: 34, height: 34, borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 },
  aiBtn: { width: 34, height: 34, borderRadius: "50%", background: "#E8825A", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  nav: { display: "flex", background: "#fff", borderBottom: "1px solid #F5EDE0", padding: "0 4px", overflowX: "auto" },
  navBtn: { padding: "12px 10px", fontSize: 12, fontWeight: 500, color: "#8C7B72", border: "none", background: "none", cursor: "pointer", borderBottom: "2px solid transparent", whiteSpace: "nowrap" },
  navBtnActive: { color: "#E8825A", borderBottomColor: "#E8825A" },
  dateBadge: { fontSize: 12, fontWeight: 500, color: "#8C7B72", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 },
  urgentStrip: { background: "linear-gradient(135deg, #E8825A, #D4624A)", borderRadius: 16, padding: "16px 20px", marginBottom: 12, color: "#fff", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" },
  urgentTitle: { fontSize: 14, fontWeight: 600, marginBottom: 2 },
  urgentSub: { fontSize: 12, opacity: 0.85 },
  sendStrip: { background: "#C8E6D0", border: "1px solid #7BAF8E", borderRadius: 16, padding: "14px 16px", marginBottom: 4, display: "flex", alignItems: "center", gap: 12 },
  sendBtn: { background: "#E8825A", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  sectionLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8C7B72" },
  addBtn: { fontSize: 13, fontWeight: 600, color: "#E8825A", background: "#FEF0E8", border: "1.5px solid #F2C4A8", borderRadius: 20, cursor: "pointer", padding: "6px 14px", display: "flex", alignItems: "center", gap: 4 },
  card: { background: "#fff", borderRadius: 16, padding: 16, marginBottom: 10, border: "1px solid #F5EDE0", cursor: "pointer" },
  cardRow: { display: "flex", alignItems: "center", gap: 12 },
  timeDot: { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 },
  cardTitle: { fontSize: 14, fontWeight: 500, color: "#2A1F1A", marginBottom: 2 },
  cardSub: { fontSize: 12, color: "#8C7B72" },
  cardTime: { fontSize: 13, fontWeight: 600, color: "#E8825A" },
  whoBadge: { display: "inline-flex", alignItems: "center", gap: 5, background: "#F5EDE0", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500, color: "#2A1F1A", marginTop: 6 },
  emptyState: { background: "#fff", borderRadius: 16, padding: "28px 16px", border: "1px solid #F5EDE0", textAlign: "center", marginBottom: 10 },
  kidCard: { background: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, border: "1px solid #F5EDE0", cursor: "pointer" },
  kidHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  kidAvatar: { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
  kidName: { fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#2A1F1A", fontWeight: 700 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  infoItem: { background: "#F5EDE0", borderRadius: 12, padding: 12 },
  infoLabel: { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8C7B72", marginBottom: 4 },
  infoVal: { fontSize: 13, fontWeight: 500, color: "#2A1F1A" },
  medTag: { display: "inline-block", background: "#DDD0EE", color: "#9B7BB8", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600, marginRight: 4, marginTop: 4 },
  notes: { marginTop: 12, background: "#FFFBF7", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#8C7B72", lineHeight: 1.6 },
  addKidBtn: { width: "100%", background: "#fff", border: "2px dashed #F5EDE0", borderRadius: 16, padding: "18px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", color: "#8C7B72" },
  composeBox: { background: "#fff", borderRadius: 16, padding: 16, border: "1.5px dashed #F2C4A8", marginBottom: 12 },
  composeLabel: { fontSize: 12, fontWeight: 600, color: "#E8825A", marginBottom: 8 },
  chip2: { background: "#F5EDE0", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#2A1F1A", cursor: "pointer", border: "1px solid transparent" },
  chip2Active: { background: "#F2C4A8", borderColor: "#E8825A", color: "#E8825A", fontWeight: 600 },
  textArea: { width: "100%", background: "#FDF8F3", border: "1.5px solid #F5EDE0", borderRadius: 12, padding: "10px 12px", fontSize: 13, color: "#2A1F1A", outline: "none", lineHeight: 1.6, marginBottom: 8, marginTop: 8 },
  bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid #F5EDE0", display: "flex", padding: "10px 0 24px" },
  bnavBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, border: "none", background: "none", cursor: "pointer" },
};
