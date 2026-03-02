// src/App.js
import { useState } from "react";
import { AppProvider, useApp } from "./lib/AppContext";
import AIAssistant from "./components/AIAssistant";
import FindTab from "./components/FindTab";
import { generateCoParentMessage } from "./lib/api";

const palette = {
  bg: "#FDF8F3", warm: "#F5EDE0", accent: "#E8825A", accentSoft: "#F2C4A8",
  green: "#7BAF8E", greenSoft: "#C8E6D0", blue: "#5A89B8", blueSoft: "#C0D8F0",
  purple: "#9B7BB8", purpleSoft: "#DDD0EE",
  text: "#2A1F1A", muted: "#8C7B72", white: "#FFFFFF",
};

// ─── Today Tab ────────────────────────────────────────────────────────────────
function TodayTab() {
  const { family } = useApp();
  const [sendLoading, setSendLoading] = useState(false);
  const [sendDone, setSendDone] = useState(false);

  const handleSend = async () => {
    setSendLoading(true);
    // In production: trigger generateCoParentMessage then open Messages deep link
    await new Promise((r) => setTimeout(r, 1200));
    setSendLoading(false);
    setSendDone(true);
    setTimeout(() => setSendDone(false), 3000);
  };

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={s.dateBadge}>Sunday, March 1 · 2026</div>

      {/* Urgent */}
      {family.reminders.filter((r) => r.urgent).map((r) => (
        <div key={r.id} style={s.urgentStrip}>
          <div style={{ fontSize: 22 }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={s.urgentTitle}>{r.text}</div>
            <div style={s.urgentSub}>{r.sub}</div>
          </div>
          <button style={s.urgentAction}>Sign Up</button>
        </div>
      ))}

      {/* Send strip */}
      <div style={s.sendStrip}>
        <div style={{ fontSize: 20 }}>📱</div>
        <div style={{ flex: 1, fontSize: 13, color: palette.text }}>
          <strong style={{ display: "block", fontSize: 12, fontWeight: 600, color: palette.green, marginBottom: 1 }}>
            Ready to send to {family.coParent.name}
          </strong>
          This week's full schedule + 2 reminders
        </div>
        <button style={s.sendBtn} onClick={handleSend} disabled={sendLoading}>
          {sendDone ? "✓ Sent!" : sendLoading ? "..." : "Send"}
        </button>
      </div>

      <div style={s.sectionLabel}>Today's Schedule</div>

      {family.schedule.map((item) => {
        const colors = {
          "🏊": { bg: palette.blueSoft, who: palette.blue },
          "💊": { bg: palette.purpleSoft, who: palette.purple },
          "⚽": { bg: palette.greenSoft, who: palette.green },
          "📚": { bg: palette.warm, who: palette.muted },
        };
        const c = colors[item.emoji] || { bg: palette.warm, who: palette.muted };
        return (
          <div key={item.id} style={s.card}>
            <div style={s.cardRow}>
              <div style={{ ...s.timeDot, background: c.bg }}>{item.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={s.cardTitle}>{item.title}</div>
                <div style={s.cardSub}>{item.sub}</div>
                <div style={s.whoBadge}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.who }} />
                  {item.assignedTo}
                </div>
              </div>
              <div style={s.cardTime}>{item.time}</div>
            </div>
          </div>
        );
      })}

      <div style={s.sectionLabel}>Upcoming This Week</div>
      {family.reminders.filter((r) => !r.urgent).map((r) => (
        <div key={r.id} style={s.card}>
          <div style={s.cardRow}>
            <div style={{ ...s.timeDot, background: palette.warm }}>{r.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ ...s.cardTitle, fontWeight: 400 }}>{r.text}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Kids Tab ─────────────────────────────────────────────────────────────────
function KidsTab() {
  const { family } = useApp();
  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {family.kids.map((kid, i) => (
        <div key={kid.id} style={s.kidCard}>
          <div style={s.kidHeader}>
            <div style={{ ...s.kidAvatar, background: i === 0 ? palette.blueSoft : palette.greenSoft }}>{kid.emoji}</div>
            <div>
              <div style={s.kidName}>{kid.name}</div>
              <div style={{ fontSize: 12, color: palette.muted }}>{kid.age} years old</div>
            </div>
          </div>
          <div style={s.infoGrid}>
            {[
              ["🏫 School", kid.school],
              ["👩‍🏫 Teacher", kid.teacher],
              ["🏥 Doctor", kid.doctor],
              ["📅 Next Appt", kid.nextAppt],
              ["⚠️ Allergies", kid.allergies],
              ["🎽 Activities", kid.activities],
            ].map(([label, val]) => (
              <div key={label} style={{ ...s.infoItem, gridColumn: label.includes("Allergies") || label.includes("Activities") ? "span 2" : undefined }}>
                <div style={s.infoLabel}>{label}</div>
                <div style={s.infoVal}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={s.infoLabel}>💊 Medications</div>
            {kid.medications.map((m) => (
              <span key={m} style={s.medTag}>{m}</span>
            ))}
          </div>
          {kid.notes && (
            <div style={s.notes}>📝 {kid.notes}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Share Tab ────────────────────────────────────────────────────────────────
const MSG_TEMPLATES = ["This week's schedule", "Medication reminder", "Doctor summary", "Upcoming deadlines", "Permission forms due"];

function ShareTab() {
  const { family, getFamilyContext } = useApp();
  const [selected, setSelected] = useState([]);
  const [generated, setGenerated] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sent, setSent] = useState(false);

  const toggle = (c) => setSelected((s) => s.includes(c) ? s.filter((x) => x !== c) : [...s, c]);

  const generate = async () => {
    if (!selected.length) return;
    setGenerating(true);
    try {
      const result = await generateCoParentMessage(selected, getFamilyContext());
      setGenerated(result?.message || "");
    } catch (err) {
      setGenerated("Could not generate message — check API key configuration.");
    } finally {
      setGenerating(false);
    }
  };

  const send = () => {
    // Open iMessage with pre-filled content
    const encoded = encodeURIComponent(generated || "");
    window.open(`sms:&body=${encoded}`, "_blank");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={s.composeBox}>
        <div style={s.composeLabel}>✨ Build a message for {family.coParent.name}</div>
        <div style={{ fontSize: 13, color: palette.muted, marginBottom: 10 }}>What should they know about?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {MSG_TEMPLATES.map((c) => (
            <div key={c} style={{ ...s.chip2, ...(selected.includes(c) ? s.chip2Active : {}) }} onClick={() => toggle(c)}>{c}</div>
          ))}
        </div>
        <button style={{ ...s.sendBtn, width: "100%", borderRadius: 12, padding: 12, marginBottom: 8 }} onClick={generate} disabled={generating || !selected.length}>
          {generating ? "✨ Writing with AI..." : "✨ Generate with AI"}
        </button>
        {generated && (
          <>
            <textarea
              style={s.textArea}
              value={generated}
              onChange={(e) => setGenerated(e.target.value)}
              rows={6}
            />
            <button style={{ ...s.sendBtn, width: "100%", borderRadius: 12, padding: 12, background: palette.green }} onClick={send}>
              {sent ? "✓ Opened Messages!" : `📱 Send via iMessage`}
            </button>
          </>
        )}
      </div>

      <div style={s.sectionLabel}>Recent Sends</div>
      {family.sentMessages.map((m) => (
        <div key={m.id} style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>Sent to {family.coParent.name}</div>
            <div style={{ fontSize: 11, color: palette.muted }}>{m.date}</div>
          </div>
          <div style={{ background: palette.warm, borderRadius: 12, padding: "10px 12px", fontSize: 13, color: palette.text, lineHeight: 1.5 }}>{m.preview}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button style={s.outlineBtn}>Resend</button>
            <button style={{ ...s.sendBtn, flex: 1, borderRadius: 10, padding: 9 }}>Edit & Send</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function AppInner() {
  const [tab, setTab] = useState("today");
  const [showAI, setShowAI] = useState(false);
  const { family } = useApp();

  return (
    <>
      <style>{globalStyles}</style>
      <div style={s.app}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerTop}>
            <div>
              <div style={s.appName}>carry<span style={{ color: palette.accent }}>.</span></div>
              <div style={s.headerSub}>Shared parenting, simplified</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ display: "flex" }}>
                {[family.primaryParent, family.coParent].map((p, i) => (
                  <div key={p.name} style={{ ...s.avatar, background: i === 0 ? palette.purpleSoft : palette.blueSoft, color: i === 0 ? palette.purple : palette.blue, marginLeft: i === 0 ? 0 : -8 }}>
                    {p.emoji}
                  </div>
                ))}
              </div>
              {/* AI button */}
              <button style={s.aiBtn} onClick={() => setShowAI(true)} title="Ask AI">✦</button>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={s.nav}>
          {[["today", "Today"], ["kids", "Kids"], ["find", "Find"], ["share", "Share"]].map(([k, v]) => (
            <button key={k} style={{ ...s.navBtn, ...(tab === k ? s.navBtnActive : {}) }} onClick={() => setTab(k)}>{v}</button>
          ))}
        </div>

        {/* Content */}
        {tab === "today" && <TodayTab />}
        {tab === "kids" && <KidsTab />}
        {tab === "find" && <FindTab />}
        {tab === "share" && <ShareTab />}

        {/* Bottom nav */}
        <div style={s.bottomNav}>
          {[
            { key: "today", icon: "📅", label: "Today" },
            { key: "kids", icon: "👧", label: "Kids" },
            { key: "find", icon: "🔍", label: "Find" },
            { key: "share", icon: "💬", label: "Share" },
          ].map((b) => (
            <button key={b.key} style={s.bnavBtn} onClick={() => setTab(b.key)}>
              <div style={{ fontSize: 20 }}>{b.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 500, color: tab === b.key ? palette.accent : palette.muted }}>{b.label}</div>
              {tab === b.key && <div style={{ width: 4, height: 4, borderRadius: "50%", background: palette.accent, margin: "0 auto" }} />}
            </button>
          ))}
        </div>

        {/* AI Assistant */}
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
  app: { maxWidth: 430, margin: "0 auto", background: "#FDF8F3", minHeight: "100vh", position: "relative", overflow: "hidden" },
  header: { padding: "52px 24px 16px", background: "#fff", borderBottom: "1px solid #F5EDE0" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  appName: { fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#2A1F1A", fontWeight: 700 },
  headerSub: { fontSize: 13, color: "#8C7B72", fontWeight: 300 },
  avatar: { width: 34, height: 34, borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 },
  aiBtn: { width: 34, height: 34, borderRadius: "50%", background: "#E8825A", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  nav: { display: "flex", background: "#fff", borderBottom: "1px solid #F5EDE0", padding: "0 12px", overflowX: "auto" },
  navBtn: { padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#8C7B72", border: "none", background: "none", cursor: "pointer", borderBottom: "2px solid transparent", whiteSpace: "nowrap" },
  navBtnActive: { color: "#E8825A", borderBottomColor: "#E8825A" },
  dateBadge: { fontSize: 12, fontWeight: 500, color: "#8C7B72", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 },
  urgentStrip: { background: "linear-gradient(135deg, #E8825A, #D4624A)", borderRadius: 16, padding: "16px 20px", marginBottom: 16, color: "#fff", display: "flex", alignItems: "center", gap: 12 },
  urgentTitle: { fontSize: 14, fontWeight: 600, marginBottom: 2 },
  urgentSub: { fontSize: 12, opacity: 0.85 },
  urgentAction: { background: "rgba(255,255,255,0.25)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer" },
  sendStrip: { background: "#C8E6D0", border: "1px solid #7BAF8E", borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 },
  sendBtn: { background: "#E8825A", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  sectionLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8C7B72", marginBottom: 10, marginTop: 20 },
  card: { background: "#fff", borderRadius: 16, padding: 16, marginBottom: 10, border: "1px solid #F5EDE0" },
  cardRow: { display: "flex", alignItems: "center", gap: 12 },
  timeDot: { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 },
  cardTitle: { fontSize: 14, fontWeight: 500, color: "#2A1F1A", marginBottom: 2 },
  cardSub: { fontSize: 12, color: "#8C7B72" },
  cardTime: { fontSize: 13, fontWeight: 600, color: "#E8825A" },
  whoBadge: { display: "inline-flex", alignItems: "center", gap: 5, background: "#F5EDE0", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500, color: "#2A1F1A", marginTop: 6 },
  kidCard: { background: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, border: "1px solid #F5EDE0" },
  kidHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  kidAvatar: { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
  kidName: { fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#2A1F1A", fontWeight: 700 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  infoItem: { background: "#F5EDE0", borderRadius: 12, padding: 12 },
  infoLabel: { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8C7B72", marginBottom: 4 },
  infoVal: { fontSize: 13, fontWeight: 500, color: "#2A1F1A" },
  medTag: { display: "inline-block", background: "#DDD0EE", color: "#9B7BB8", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600, marginRight: 4, marginTop: 4 },
  notes: { marginTop: 12, background: "#FFFBF7", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#8C7B72", lineHeight: 1.6 },
  composeBox: { background: "#fff", borderRadius: 16, padding: 16, border: "1.5px dashed #F2C4A8", marginBottom: 12 },
  composeLabel: { fontSize: 12, fontWeight: 600, color: "#E8825A", marginBottom: 8 },
  chip2: { background: "#F5EDE0", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#2A1F1A", cursor: "pointer", border: "1px solid transparent" },
  chip2Active: { background: "#F2C4A8", borderColor: "#E8825A", color: "#E8825A", fontWeight: 600 },
  textArea: { width: "100%", background: "#FDF8F3", border: "1.5px solid #F5EDE0", borderRadius: 12, padding: "10px 12px", fontSize: 13, color: "#2A1F1A", outline: "none", lineHeight: 1.6, marginBottom: 8, marginTop: 8 },
  outlineBtn: { flex: 1, background: "transparent", border: "1.5px solid #F5EDE0", color: "#8C7B72", padding: "8px", borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: "pointer" },
  bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid #F5EDE0", display: "flex", padding: "10px 0 24px" },
  bnavBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, border: "none", background: "none", cursor: "pointer" },
};
