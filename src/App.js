// src/App.js
import { useState } from "react";
import { AppProvider, useApp } from "./lib/AppContext";
import FindTab from "./components/FindTab";
import Onboarding from "./components/Onboarding";
import KidEditor from "./components/KidEditor";
import EventEditor from "./components/EventEditor";
import { generateCoParentMessage } from "./lib/api";
import SwipeableCard from "./components/SwipeableCard";
import { firePendingNotifications } from "./components/EventEditor";

const p = {
  bg: "#FDF8F3", warm: "#F5EDE0", accent: "#E8825A", accentSoft: "#F2C4A8",
  green: "#7BAF8E", greenSoft: "#C8E6D0", blue: "#5A89B8", blueSoft: "#C0D8F0",
  purple: "#9B7BB8", purpleSoft: "#DDD0EE",
  text: "#2A1F1A", muted: "#8C7B72", white: "#FFFFFF",
};

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const smsLink = (phone, body) => {
  const sep = isIOS ? "&" : "?";
  const clean = phone.replace(/\D/g, "");
  return `sms:${clean}${sep}body=${encodeURIComponent(body)}`;
};

// Format an ISO date string or named day for display
function formatDay(val) {
  if (!val) return "";
  if (val.includes("T") || val.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(val);
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  return val;
}

// Fire any pending reminder notifications on load
if (typeof window !== "undefined") {
  setTimeout(firePendingNotifications, 1000);
}

// ─── Today Tab ────────────────────────────────────────────────────────────────
function TodayTab() {
  const { family, addEvent, updateEvent, removeEvent, addReminder, updateReminder, removeReminder, fmt } = useApp();
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
    await new Promise(r => setTimeout(r, 800));
    const phone = family.coParent.phone;
    const text = `Hi ${family.coParent.name}! Here's today's schedule:\n${(family.schedule || []).map(e => `• ${fmt(e.time) || ""} ${e.title}`).join("\n")}`;
    if (phone) window.open(smsLink(phone, text), "_blank");
    setSendLoading(false); setSendDone(true);
    setTimeout(() => setSendDone(false), 3000);
  };

  const schedule = (family.schedule || []).filter(e => !e.isReminder);
  const reminders = family.reminders || [];

  const emojiColors = {
    "🏊": p.blueSoft, "💊": p.purpleSoft, "⚽": p.greenSoft,
    "🏐": p.greenSoft, "💃": "#FFE4F0", "🎵": "#E8F4FF",
    "🏥": "#FFE0D6", "📅": p.warm,
  };

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={s.dateBadge}>{today}</div>

      {reminders.filter(r => r.urgent).map(r => (
        <div key={r.id} style={s.urgentStrip} onClick={() => { setEditingReminder({ ...r, isReminder: true }); setShowReminderEditor(true); }}>
          <div style={{ fontSize: 26 }}>{r.emoji || "⚡"}</div>
          <div style={{ flex: 1 }}>
            <div style={s.urgentTitle}>{r.text}</div>
            {r.sub && <div style={s.urgentSub}>{r.sub}</div>}
          </div>
          <div style={{ fontSize: 20, opacity: 0.7 }}>›</div>
        </div>
      ))}

      {family.coParent.name && (
        <div style={s.sendStrip}>
          <div style={{ fontSize: 22 }}>📱</div>
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: 14, fontWeight: 600, color: p.green, marginBottom: 1 }}>
              Ready to send to {family.coParent.name}
            </strong>
            <span style={{ fontSize: 13, color: p.text }}>Today's schedule · {schedule.length} items</span>
          </div>
          <button style={s.sendBtn} onClick={handleSend} disabled={sendLoading}>
            {sendDone ? "✓ Done!" : sendLoading ? "…" : "Send"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 12 }}>
        <div style={s.sectionLabel}>Today's Schedule</div>
        <button onClick={() => { setEditingEvent(null); setShowEventEditor(true); }} style={s.addBtn}>＋ Add event</button>
      </div>

      {schedule.length === 0 && (
        <div style={s.emptyState}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
          <div style={{ fontSize: 16, color: p.muted, marginBottom: 14 }}>No events yet</div>
          <button onClick={() => { setEditingEvent(null); setShowEventEditor(true); }} style={{ ...s.sendBtn, padding: "10px 24px", borderRadius: 20 }}>Add your first event</button>
        </div>
      )}

      {schedule.map((item, idx) => {
        const bg = emojiColors[item.emoji] || p.warm;
        // Hint the first card periodically so users discover swipe-to-delete
        const hintDelay = idx === 0 && schedule.length > 0 ? 2000 : 0;
        return (
          <SwipeableCard
            key={item.id}
            hintDelay={hintDelay}
            onDelete={() => removeEvent(item.id)}
            onTap={() => { setEditingEvent(item); setShowEventEditor(true); }}
            style={s.card}
          >
            <div style={s.cardRow}>
              <div style={{ ...s.timeDot, background: bg }}>{item.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.cardTitle}>{item.title}</div>
                {item.sub && <div style={s.cardSub}>{item.sub}</div>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {item.day && <span style={s.tag}>{formatDay(item.day)}</span>}
                  {item.dropoffBy && <span style={{ ...s.tag, background: "#FFF0E8", color: "#B05A2A" }}>Drop: {item.dropoffBy}{item.dropoffTime ? ` · ${fmt(item.dropoffTime)}` : ""}</span>}
                  {item.pickupBy && <span style={{ ...s.tag, background: "#EBF2FA", color: "#2A5080" }}>Pick up: {item.pickupBy}{item.pickupTime ? ` · ${fmt(item.pickupTime)}` : ""}</span>}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                {item.time && <div style={s.cardTime}>{fmt(item.time)}</div>}
              </div>
            </div>
          </SwipeableCard>
        );
      })}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 12 }}>
        <div style={s.sectionLabel}>Reminders</div>
        <button onClick={() => { setEditingReminder(null); setShowReminderEditor(true); }} style={s.addBtn}>＋ Add reminder</button>
      </div>

      {reminders.filter(r => !r.urgent).map((r, idx) => (
        <SwipeableCard
          key={r.id}
          hintDelay={idx === 0 && reminders.filter(x => !x.urgent).length > 0 ? 3500 : 0}
          onDelete={() => removeReminder(r.id)}
          onTap={() => { setEditingReminder({ ...r, isReminder: true }); setShowReminderEditor(true); }}
          style={s.card}
        >
          <div style={s.cardRow}>
            <div style={{ ...s.timeDot, background: p.warm }}>{r.emoji || "📋"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ ...s.cardTitle, fontWeight: 400 }}>{r.text}</div>
              {r.sub && <div style={s.cardSub}>{r.sub}</div>}
              {r.notifyDate && r.notifyTime && (
                <div style={{ marginTop: 5 }}>
                  <span style={{ ...s.tag, background: "#E8F0FF", color: "#1A3A80" }}>
                    🔔 {new Date(r.notifyDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})} · {fmt(r.notifyTime)}
                  </span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 20, color: p.muted }}>›</div>
          </div>
        </SwipeableCard>
      ))}
      {reminders.length === 0 && <div style={{ ...s.emptyState, padding: "18px" }}><div style={{ fontSize: 15, color: p.muted }}>No reminders yet</div></div>}

      {showEventEditor && (
        <EventEditor event={editingEvent} people={people}
          onSave={ev => { editingEvent ? updateEvent(ev) : addEvent(ev); setShowEventEditor(false); }}
          onDelete={id => { removeEvent(id); setShowEventEditor(false); }}
          onClose={() => setShowEventEditor(false)} />
      )}
      {showReminderEditor && (
        <EventEditor
          event={editingReminder ? { ...editingReminder, isReminder: true } : { isReminder: true }}
          people={people}
          onSave={ev => { const r = { ...ev, text: ev.title }; editingReminder ? updateReminder(r) : addReminder(r); setShowReminderEditor(false); }}
          onDelete={id => { removeReminder(id); setShowReminderEditor(false); }}
          onClose={() => setShowReminderEditor(false)} />
      )}
    </div>
  );
}

// ─── Kids Tab ─────────────────────────────────────────────────────────────────
function KidsTab() {
  const { family, addKid, updateKid, removeKid } = useApp();
  const [showEditor, setShowEditor] = useState(false);
  const [editingKid, setEditingKid] = useState(null);
  const avatarColors = ["#C0D8F0","#C8E6D0","#DDD0EE","#F2C4A8","#FFE4B5"];

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {family.kids.map((kid, i) => (
        <div key={kid.id} style={s.kidCard} onClick={() => { setEditingKid(kid); setShowEditor(true); }}>
          <div style={s.kidHeader}>
            <div style={{ ...s.kidAvatar, background: avatarColors[i % avatarColors.length] }}>{kid.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={s.kidName}>{kid.name}</div>
              <div style={{ fontSize: 15, color: p.muted }}>{kid.age} years old</div>
            </div>
            <div style={{ fontSize: 15, color: p.accent, fontWeight: 500 }}>Edit ›</div>
          </div>
          <div style={s.infoGrid}>
            {[
              ["🏫 School", kid.school], ["👩‍🏫 Teacher", kid.teacher],
              ["🏥 Doctor", kid.doctor], ["📅 Next Appt", kid.nextAppt],
              ["⚠️ Allergies", kid.allergies], ["🎽 Activities", kid.activities],
            ].filter(([,v]) => v).map(([label, val]) => (
              <div key={label} style={{ ...s.infoItem, gridColumn: label.includes("Allergies")||label.includes("Activities") ? "span 2" : undefined }}>
                <div style={s.infoLabel}>{label}</div>
                <div style={s.infoVal}>{val}</div>
              </div>
            ))}
          </div>
          {kid.medications?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={s.infoLabel}>💊 Medications</div>
              {kid.medications.map(m => <span key={m} style={s.medTag}>{m}</span>)}
            </div>
          )}
          {kid.notes && <div style={s.notes}>📝 {kid.notes}</div>}
        </div>
      ))}
      <button onClick={() => { setEditingKid(null); setShowEditor(true); }} style={s.addKidBtn}>
        <span style={{ fontSize: 26 }}>+</span>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Add another child</span>
      </button>
      {showEditor && (
        <KidEditor kid={editingKid}
          onSave={kid => { editingKid ? updateKid(kid) : addKid(kid); setShowEditor(false); }}
          onDelete={id => { removeKid(id); setShowEditor(false); }}
          onClose={() => setShowEditor(false)} />
      )}
    </div>
  );
}

// ─── Share Tab ────────────────────────────────────────────────────────────────
const MSG_TEMPLATES = ["This week's schedule","Medication reminder","Doctor summary","Upcoming deadlines","Permission forms due"];

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
    } catch { setGenerated("Could not generate — check API key configuration."); }
    finally { setGenerating(false); }
  };

  const send = () => {
    const phone = family.coParent.phone || "";
    window.open(smsLink(phone, generated), "_blank");
    addSentMessage({ preview: generated });
    setSent(true); setTimeout(() => setSent(false), 3000);
  };

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {!family.coParent.phone && (
        <div style={{ background: "#FFF3CD", border: "1px solid #FFD700", borderRadius: 12, padding: "14px 16px", fontSize: 15, color: "#856404", marginBottom: 16 }}>
          💡 Add {family.coParent.name}'s phone number in Settings to enable texting.
        </div>
      )}
      <div style={s.composeBox}>
        <div style={s.composeLabel}>✨ Build a message for {family.coParent.name}</div>
        <div style={{ fontSize: 14, color: p.muted, marginBottom: 12 }}>What should they know about?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {MSG_TEMPLATES.map(c => (
            <div key={c} onClick={() => toggle(c)} style={{ ...s.chip2, ...(selected.includes(c) ? s.chip2Active : {}) }}>{c}</div>
          ))}
        </div>
        <button onClick={generate} disabled={generating || !selected.length} style={{
          width: "100%", borderRadius: 12, padding: "13px", fontSize: 16, fontWeight: 600, border: "none",
          background: selected.length ? p.accent : p.warm, color: selected.length ? p.white : p.muted,
          cursor: selected.length ? "pointer" : "default", fontFamily: "inherit", marginBottom: 8,
        }}>{generating ? "✨ Writing with AI…" : "✨ Generate with AI"}</button>
        {generated && (
          <>
            <textarea style={s.textArea} value={generated} onChange={e => setGenerated(e.target.value)} rows={6} />
            <button onClick={send} style={{ ...s.sendBtn, width: "100%", borderRadius: 12, padding: "13px", fontSize: 15, background: p.green }}>
              {sent ? "✓ Opened Messages!" : "📱 Send via iMessage"}
            </button>
          </>
        )}
      </div>
      {(family.sentMessages || []).length > 0 && (
        <>
          <div style={{ ...s.sectionLabel, marginBottom: 12 }}>Recent Sends</div>
          {family.sentMessages.map(m => (
            <div key={m.id} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: p.text }}>Sent to {family.coParent.name}</div>
                <div style={{ fontSize: 13, color: p.muted }}>{m.date}</div>
              </div>
              <div style={{ background: p.warm, borderRadius: 12, padding: "12px", fontSize: 14, color: p.text, lineHeight: 1.6 }}>{m.preview}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const { family, setFamily, use24hr, setUse24hr } = useApp();
  const [saved, setSaved] = useState(false);
  const [primary, setPrimary] = useState({ ...family.primaryParent });
  const [coParent, setCoParent] = useState({ ...family.coParent });

  const save = () => {
    setFamily(f => ({ ...f, primaryParent: primary, coParent }));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const SField = ({ label, value, onChange, placeholder, type = "text" }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: p.text, marginBottom: 5 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", border: `1.5px solid ${p.warm}`, borderRadius: 10, padding: "12px 14px", fontSize: 16, color: p.text, background: p.white, outline: "none", fontFamily: "inherit" }} />
    </div>
  );

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {/* Clock preference */}
      <div style={{ ...s.kidCard, cursor: "default" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: p.text, marginBottom: 16 }}>⏰ Time format</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[["12-hour", false, "3:30 PM"], ["24-hour", true, "15:30"]].map(([label, val, example]) => (
            <button key={label} onClick={() => setUse24hr(val)} style={{
              flex: 1, padding: "14px 10px", borderRadius: 14, textAlign: "center",
              border: `2px solid ${use24hr === val ? p.accent : p.warm}`,
              background: use24hr === val ? p.accentSoft : p.white,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: use24hr === val ? p.accent : p.text, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: use24hr === val ? p.accent : p.muted }}>{example}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: p.muted, marginTop: 10, textAlign: "center" }}>
          All times in the app update instantly
        </div>
      </div>

      <div style={{ ...s.kidCard, cursor: "default" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: p.text, marginBottom: 16 }}>Your profile</div>
        <SField label="Your name" value={primary.name} onChange={v => setPrimary(x => ({ ...x, name: v }))} placeholder="Your first name" />
        <SField label="Your phone" value={primary.phone || ""} onChange={v => setPrimary(x => ({ ...x, phone: v }))} placeholder="+1 (555) 000-0000" type="tel" />
        <SField label="City / Neighbourhood" value={family.location?.city || ""} onChange={v => setFamily(f => ({ ...f, location: { ...f.location, city: v } }))} placeholder="e.g. Victoria, BC" />
      </div>

      <div style={{ ...s.kidCard, cursor: "default" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: p.text, marginBottom: 16 }}>Co-parent</div>
        <SField label="Name" value={coParent.name} onChange={v => setCoParent(x => ({ ...x, name: v }))} placeholder="e.g. Marcus" />
        <SField label="Cell number" value={coParent.phone || ""} onChange={v => setCoParent(x => ({ ...x, phone: v }))} placeholder="+1 (555) 000-0000" type="tel" />
        <SField label="Relationship" value={coParent.relation || ""} onChange={v => setCoParent(x => ({ ...x, relation: v }))} placeholder="e.g. Dad" />
      </div>

      <button onClick={save} style={{ ...s.sendBtn, width: "100%", borderRadius: 14, padding: "15px", fontSize: 16 }}>
        {saved ? "✓ Saved!" : "Save changes"}
      </button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function AppInner() {
  const [tab, setTab] = useState("today");
  const { family, setFamily } = useApp();

  if (!family) return <Onboarding onComplete={data => setFamily(data)} />;

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
        <div style={s.header}>
          <div style={s.headerTop}>
            <div>
              <div style={s.appName}>carry<span style={{ color: p.accent }}>.</span></div>
              <div style={s.headerSub}>{family.primaryParent.name}'s family</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ display: "flex" }}>
                {[family.primaryParent, family.coParent].map((person, i) => (
                  <div key={person.name} style={{ ...s.avatar, background: i===0?p.purpleSoft:p.blueSoft, color: i===0?p.purple:p.blue, marginLeft: i===0?0:-8 }}>
                    {person.emoji || person.name[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={s.nav}>
          {navItems.map(({ key, label }) => (
            <button key={key} style={{ ...s.navBtn, ...(tab===key ? s.navBtnActive : {}) }} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {tab === "today" && <TodayTab />}
        {tab === "kids" && <KidsTab />}
        {tab === "find" && <FindTab />}
        {tab === "share" && <ShareTab />}
        {tab === "settings" && <SettingsTab />}

        <div style={s.bottomNav}>
          {navItems.map(b => (
            <button key={b.key} style={s.bnavBtn} onClick={() => setTab(b.key)}>
              <div style={{ fontSize: 20 }}>{b.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: tab===b.key ? p.accent : p.muted }}>{b.label}</div>
              {tab === b.key && <div style={{ width: 4, height: 4, borderRadius: "50%", background: p.accent, margin: "0 auto" }} />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>;
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F0EBE3; font-family: 'DM Sans', sans-serif; font-size: 16px; }
  button { font-family: 'DM Sans', sans-serif; }
  input, textarea, select { font-family: 'DM Sans', sans-serif; }
  textarea { resize: none; }
`;

const s = {
  app: { maxWidth: 430, margin: "0 auto", background: "#FDF8F3", minHeight: "100vh", position: "relative" },
  header: { padding: "52px 24px 18px", background: "#fff", borderBottom: "1px solid #F5EDE0" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  appName: { fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#2A1F1A", fontWeight: 700 },
  headerSub: { fontSize: 15, color: "#8C7B72", fontWeight: 300 },
  avatar: { width: 36, height: 36, borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 },
  nav: { display: "flex", background: "#fff", borderBottom: "1px solid #F5EDE0", padding: "0 4px", overflowX: "auto" },
  navBtn: { padding: "13px 10px", fontSize: 13, fontWeight: 500, color: "#8C7B72", border: "none", background: "none", cursor: "pointer", borderBottom: "2px solid transparent", whiteSpace: "nowrap" },
  navBtnActive: { color: "#E8825A", borderBottomColor: "#E8825A" },
  dateBadge: { fontSize: 13, fontWeight: 500, color: "#8C7B72", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 },
  urgentStrip: { background: "linear-gradient(135deg,#E8825A,#D4624A)", borderRadius: 16, padding: "18px 20px", marginBottom: 12, color: "#fff", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" },
  urgentTitle: { fontSize: 16, fontWeight: 600, marginBottom: 2 },
  urgentSub: { fontSize: 14, opacity: 0.85 },
  sendStrip: { background: "#C8E6D0", border: "1px solid #7BAF8E", borderRadius: 16, padding: "15px 16px", marginBottom: 4, display: "flex", alignItems: "center", gap: 12 },
  sendBtn: { background: "#E8825A", border: "none", color: "#fff", padding: "9px 18px", borderRadius: 20, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  sectionLabel: { fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8C7B72" },
  addBtn: { fontSize: 14, fontWeight: 600, color: "#E8825A", background: "#FEF0E8", border: "1.5px solid #F2C4A8", borderRadius: 20, cursor: "pointer", padding: "7px 16px" },
  card: { background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 10, border: "1px solid #F5EDE0", cursor: "pointer" },
  cardRow: { display: "flex", alignItems: "flex-start", gap: 12 },
  timeDot: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
  cardTitle: { fontSize: 16, fontWeight: 500, color: "#2A1F1A", marginBottom: 2 },
  cardSub: { fontSize: 14, color: "#8C7B72" },
  cardTime: { fontSize: 16, fontWeight: 700, color: "#E8825A" },
  tag: { display: "inline-block", background: "#F5EDE0", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 500, color: "#2A1F1A" },
  emptyState: { background: "#fff", borderRadius: 16, padding: "32px 16px", border: "1px solid #F5EDE0", textAlign: "center", marginBottom: 10 },
  kidCard: { background: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, border: "1px solid #F5EDE0", cursor: "pointer" },
  kidHeader: { display: "flex", alignItems: "center", gap: 14, marginBottom: 16 },
  kidAvatar: { width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 },
  kidName: { fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#2A1F1A", fontWeight: 700 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  infoItem: { background: "#F5EDE0", borderRadius: 12, padding: 12 },
  infoLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8C7B72", marginBottom: 4 },
  infoVal: { fontSize: 14, fontWeight: 500, color: "#2A1F1A" },
  medTag: { display: "inline-block", background: "#DDD0EE", color: "#9B7BB8", borderRadius: 20, padding: "5px 12px", fontSize: 13, fontWeight: 600, marginRight: 4, marginTop: 4 },
  notes: { marginTop: 12, background: "#FFFBF7", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#8C7B72", lineHeight: 1.6 },
  addKidBtn: { width: "100%", background: "#fff", border: "2px dashed #F5EDE0", borderRadius: 16, padding: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer", color: "#8C7B72" },
  composeBox: { background: "#fff", borderRadius: 16, padding: 18, border: "1.5px dashed #F2C4A8", marginBottom: 14 },
  composeLabel: { fontSize: 14, fontWeight: 600, color: "#E8825A", marginBottom: 8 },
  chip2: { background: "#F5EDE0", borderRadius: 20, padding: "7px 14px", fontSize: 14, color: "#2A1F1A", cursor: "pointer", border: "1px solid transparent" },
  chip2Active: { background: "#F2C4A8", borderColor: "#E8825A", color: "#E8825A", fontWeight: 600 },
  textArea: { width: "100%", background: "#FDF8F3", border: "1.5px solid #F5EDE0", borderRadius: 12, padding: "12px", fontSize: 15, color: "#2A1F1A", outline: "none", lineHeight: 1.6, marginBottom: 10, marginTop: 8 },
  bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid #F5EDE0", display: "flex", padding: "10px 0 24px" },
  bnavBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, border: "none", background: "none", cursor: "pointer" },
  whoBadge: { display: "inline-flex", alignItems: "center", gap: 5, background: "#F5EDE0", borderRadius: 20, padding: "4px 10px", fontSize: 13, fontWeight: 500, color: "#2A1F1A", marginTop: 6 },
};
