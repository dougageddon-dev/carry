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
  return "sms:" + clean + sep + "body=" + encodeURIComponent(body);
};

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
  bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderTop: "1px solid rgba(245,237,224,0.8)", display: "flex", padding: "8px 8px 24px" },
  bnavBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, border: "none", background: "none", cursor: "pointer" },
};

function parseLocalDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDay(val, endVal) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const fmtD = function(dt) {
    return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };
  var startStr = d.toDateString() === today.toDateString() ? "Today"
    : d.toDateString() === tomorrow.toDateString() ? "Tomorrow"
    : fmtD(d);
  if (endVal) {
    var e = new Date(endVal);
    if (!isNaN(e.getTime())) return startStr + " \u2013 " + fmtD(e);
  }
  return startStr;
}

if (typeof window !== "undefined") {
  setTimeout(firePendingNotifications, 1000);
}

var emojiColors = {
  "\uD83C\uDFCA": p.blueSoft,
  "\uD83D\uDC8A": p.purpleSoft,
  "\u26BD": p.greenSoft,
  "\uD83C\uDFD0": p.greenSoft,
  "\uD83D\uDC83": "#FFE4F0",
  "\uD83C\uDFB5": "#E8F4FF",
  "\uD83C\uDFE5": "#FFE0D6",
};

var MSG_TEMPLATES = [
  { key: "schedule",    label: "This week's schedule" },
  { key: "medications", label: "Medication reminder" },
  { key: "reminders",  label: "Reminders & deadlines" },
  { key: "kids",       label: "Kids info summary" },
  { key: "pickups",    label: "Drop-off & pick-up" },
];

function buildMessage(topics, family, fmt) {
  var coName = family.coParent.name;
  var myName = family.primaryParent.name;
  var lines = [];
  lines.push("Hi " + coName + "! Here's an update from " + myName);
  lines.push("");
  if (topics.includes("schedule")) {
    var events = (family.schedule || []).filter(function(e) { return !e.isReminder && !e.archived; });
    lines.push("SCHEDULE");
    if (!events.length) { lines.push("  No events scheduled."); }
    else { events.forEach(function(e) { lines.push("  " + (e.emoji || "") + " " + e.title + (e.day ? " - " + formatDay(e.day, e.endDay) : "")); }); }
    lines.push("");
  }
  if (topics.includes("reminders")) {
    var reminders = family.reminders || [];
    lines.push("REMINDERS");
    if (!reminders.length) { lines.push("  No reminders."); }
    else { reminders.forEach(function(r) { lines.push("  " + (r.urgent ? "!" : "-") + " " + (r.text || r.title || "") + (r.sub ? " - " + r.sub : "")); }); }
    lines.push("");
  }
  if (topics.includes("kids")) {
    lines.push("KIDS INFO");
    (family.kids || []).forEach(function(k) {
      lines.push("  " + (k.emoji || "") + " " + k.name + " (age " + k.age + ")");
      if (k.school) lines.push("    School: " + k.school);
      if (k.allergies) lines.push("    Allergies: " + k.allergies);
    });
    lines.push("");
  }
  lines.push("- " + myName);
  return lines.join("\n");
}

function TodayTab() {
  var ctx = useApp();
  var family = ctx.family;
  var addEvent = ctx.addEvent;
  var updateEvent = ctx.updateEvent;
  var archiveEvent = ctx.archiveEvent;
  var addReminder = ctx.addReminder;
  var updateReminder = ctx.updateReminder;
  var archiveReminder = ctx.archiveReminder;
  var unarchiveEvent = ctx.unarchiveEvent;
  var unarchiveReminder = ctx.unarchiveReminder;
  var fmt = ctx.fmt;

  var showEventEditorState = useState(false);
  var showEventEditor = showEventEditorState[0];
  var setShowEventEditor = showEventEditorState[1];

  var editingEventState = useState(null);
  var editingEvent = editingEventState[0];
  var setEditingEvent = editingEventState[1];

  var showReminderEditorState = useState(false);
  var showReminderEditor = showReminderEditorState[0];
  var setShowReminderEditor = showReminderEditorState[1];

  var editingReminderState = useState(null);
  var editingReminder = editingReminderState[0];
  var setEditingReminder = editingReminderState[1];

  var sendLoadingState = useState(false);
  var sendLoading = sendLoadingState[0];
  var setSendLoading = sendLoadingState[1];

  var sendDoneState = useState(false);
  var sendDone = sendDoneState[0];
  var setSendDone = sendDoneState[1];

  var showArchivedState = useState(false);
  var showArchived = showArchivedState[0];
  var setShowArchived = showArchivedState[1];

  var people = [family.primaryParent.name, family.coParent.name];

  var allEvents = (family.schedule || [])
    .filter(function(e) { return !e.isReminder && !e.archived; })
    .sort(function(a, b) { return new Date(a.day || 0) - new Date(b.day || 0); });

  var reminders = (family.reminders || []).filter(function(r) { return !r.archived; });
  var archivedEvents = (family.schedule || []).filter(function(e) { return !e.isReminder && e.archived; });
  var archivedReminders = (family.reminders || []).filter(function(r) { return r.archived; });
  var totalArchived = archivedEvents.length + archivedReminders.length;

  function handleSend() {
    setSendLoading(true);
    var phone = family.coParent.phone;
    var lines = ["Hi " + family.coParent.name + "! Here is our schedule:"];
    allEvents.forEach(function(e) {
      lines.push((e.emoji || "") + " " + e.title + (e.day ? " - " + formatDay(e.day, e.endDay) : ""));
    });
    lines.push("\n- " + family.primaryParent.name);
    if (phone) window.open(smsLink(phone, lines.join("\n")), "_blank");
    setSendLoading(false);
    setSendDone(true);
    setTimeout(function() { setSendDone(false); }, 3000);
  }

  return (
    <div style={{ padding: "16px 16px 100px" }}>

      {reminders.filter(function(r) { return r.urgent; }).map(function(r) {
        return (
          <div key={r.id} style={s.urgentStrip} onClick={function() { setEditingReminder(Object.assign({}, r, { isReminder: true })); setShowReminderEditor(true); }}>
            <div style={{ flex: 1 }}>
              <div style={s.urgentTitle}>{r.text}</div>
              {r.sub && <div style={s.urgentSub}>{r.sub}</div>}
            </div>
            <div style={{ fontSize: 20, opacity: 0.7 }}>{">"}</div>
          </div>
        );
      })}

      {family.coParent.name && (
        <div style={s.sendStrip}>
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: 14, fontWeight: 600, color: p.green, marginBottom: 1 }}>
              Send to {family.coParent.name}
            </strong>
            <span style={{ fontSize: 13, color: p.text }}>{allEvents.length} upcoming events</span>
          </div>
          <button style={s.sendBtn} onClick={handleSend} disabled={sendLoading}>
            {sendDone ? "Sent!" : sendLoading ? "..." : "Send"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 12 }}>
        <div style={s.sectionLabel}>Upcoming Events</div>
        <button onClick={function() { setEditingEvent(null); setShowEventEditor(true); }} style={s.addBtn}>+ Add event</button>
      </div>

      {allEvents.length === 0 && (
        <div style={s.emptyState}>
          <div style={{ fontSize: 16, color: p.muted, marginBottom: 14 }}>No events yet</div>
          <button onClick={function() { setEditingEvent(null); setShowEventEditor(true); }} style={Object.assign({}, s.sendBtn, { padding: "10px 24px", borderRadius: 20 })}>Add your first event</button>
        </div>
      )}

      {allEvents.map(function(item, idx) {
        var bg = emojiColors[item.emoji] || p.warm;
        var startDate = parseLocalDate(item.day);
        var now = new Date(); now.setHours(0, 0, 0, 0);
        var isPast = startDate && startDate < now && !item.endDay && !item.repeatWeekly;
        return (
          <SwipeableCard
            key={item.id}
            hintDelay={idx === 0 ? 2000 : 0}
            onDelete={function() { archiveEvent(item.id); }}
            onTap={function() { setEditingEvent(item); setShowEventEditor(true); }}
            style={Object.assign({}, s.card, { opacity: isPast ? 0.5 : 1 })}
          >
            <div style={s.cardRow}>
              <div style={Object.assign({}, s.timeDot, { background: bg })}>{item.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.cardTitle}>{item.title}</div>
                {item.sub && <div style={s.cardSub}>{item.sub}</div>}
                {item.day && (
                  <div style={{ marginTop: 5 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: item.allDay ? "#EBF4FF" : p.accentSoft, color: item.allDay ? p.blue : p.accent, borderRadius: 8, padding: "4px 10px", fontSize: 13, fontWeight: 700 }}>
                      {formatDay(item.day, item.endDay)}
                      {item.allDay ? " - All day" : ""}
                      {item.repeatWeekly ? " (weekly)" : ""}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {item.dropoffBy && <span style={Object.assign({}, s.tag, { background: "#FFF0E8", color: "#B05A2A" })}>Drop: {item.dropoffBy}{item.dropoffTime ? " - " + fmt(item.dropoffTime) : ""}</span>}
                  {item.pickupBy && <span style={Object.assign({}, s.tag, { background: "#EBF2FA", color: "#2A5080" })}>Pick up: {item.pickupBy}{item.pickupTime ? " - " + fmt(item.pickupTime) : ""}</span>}
                </div>
              </div>
            </div>
          </SwipeableCard>
        );
      })}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 12, paddingTop: 16, borderTop: "1px solid " + p.warm }}>
        <div style={s.sectionLabel}>Reminders</div>
        <button onClick={function() { setEditingReminder(null); setShowReminderEditor(true); }} style={s.addBtn}>+ Add reminder</button>
      </div>

      {reminders.filter(function(r) { return !r.urgent; }).map(function(r, idx) {
        return (
          <SwipeableCard
            key={r.id}
            hintDelay={idx === 0 ? 3500 : 0}
            onDelete={function() { archiveReminder(r.id); }}
            onTap={function() { setEditingReminder(Object.assign({}, r, { isReminder: true })); setShowReminderEditor(true); }}
            style={s.card}
          >
            <div style={s.cardRow}>
              <div style={Object.assign({}, s.timeDot, { background: p.warm })}>{r.emoji || "!"}</div>
              <div style={{ flex: 1 }}>
                <div style={Object.assign({}, s.cardTitle, { fontWeight: 400 })}>{r.text}</div>
                {r.sub && <div style={s.cardSub}>{r.sub}</div>}
              </div>
              <div style={{ fontSize: 20, color: p.muted }}>{">"}</div>
            </div>
          </SwipeableCard>
        );
      })}

      {reminders.length === 0 && (
        <div style={Object.assign({}, s.emptyState, { padding: "18px" })}>
          <div style={{ fontSize: 15, color: p.muted }}>No reminders yet</div>
        </div>
      )}

      {totalArchived > 0 && (
        <button onClick={function() { setShowArchived(function(v) { return !v; }); }} style={{ width: "100%", marginTop: 8, padding: "12px", borderRadius: 12, border: "1.5px solid " + p.warm, background: showArchived ? p.warm : "transparent", color: p.muted, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {showArchived ? "Hide" : "Show"} archive ({totalArchived})
        </button>
      )}

      {showArchived && (
        <div style={{ marginTop: 12 }}>
          <div style={Object.assign({}, s.sectionLabel, { marginBottom: 12, opacity: 0.6 })}>Archived</div>
          {archivedEvents.concat(archivedReminders).map(function(item) {
            return (
              <div key={item.id} style={Object.assign({}, s.card, { opacity: 0.6, marginBottom: 8 })}>
                <div style={s.cardRow}>
                  <div style={Object.assign({}, s.timeDot, { background: p.warm })}>{item.emoji || "+"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={Object.assign({}, s.cardTitle, { fontWeight: 400, textDecoration: "line-through" })}>{item.title || item.text}</div>
                  </div>
                  <button onClick={function() { if (item.isReminder) { unarchiveReminder(item.id); } else { unarchiveEvent(item.id); } }} style={{ background: p.warm, border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: p.muted, cursor: "pointer", fontFamily: "inherit" }}>
                    Restore
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showEventEditor && (
        <EventEditor event={editingEvent} people={people}
          onSave={function(ev) { if (editingEvent) { updateEvent(ev); } else { addEvent(ev); } setShowEventEditor(false); }}
          onDelete={function(id) { archiveEvent(id); setShowEventEditor(false); }}
          onClose={function() { setShowEventEditor(false); }} />
      )}
      {showReminderEditor && (
        <EventEditor
          event={editingReminder ? Object.assign({}, editingReminder, { isReminder: true }) : null}
          defaultIsReminder={true}
          people={people}
          onSave={function(ev) { var r = Object.assign({}, ev, { text: ev.title }); if (editingReminder) { updateReminder(r); } else { addReminder(r); } setShowReminderEditor(false); }}
          onDelete={function(id) { archiveReminder(id); setShowReminderEditor(false); }}
          onClose={function() { setShowReminderEditor(false); }} />
      )}
    </div>
  );
}

function KidsTab() {
  var ctx = useApp();
  var family = ctx.family;
  var addKid = ctx.addKid;
  var updateKid = ctx.updateKid;

  var showEditorState = useState(false);
  var showEditor = showEditorState[0];
  var setShowEditor = showEditorState[1];

  var editingKidState = useState(null);
  var editingKid = editingKidState[0];
  var setEditingKid = editingKidState[1];

  var avatarColors = ["#C0D8F0", "#C8E6D0", "#DDD0EE", "#F2C4A8", "#FFE4B5"];

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {family.kids.map(function(kid, i) {
        return (
          <div key={kid.id} style={s.kidCard} onClick={function() { setEditingKid(kid); setShowEditor(true); }}>
            <div style={s.kidHeader}>
              <div style={Object.assign({}, s.kidAvatar, { background: avatarColors[i % avatarColors.length] })}>{kid.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={s.kidName}>{kid.name}</div>
                <div style={{ fontSize: 15, color: p.muted }}>{kid.age} years old</div>
              </div>
              <div style={{ fontSize: 15, color: p.accent, fontWeight: 500 }}>Edit &gt;</div>
            </div>
            <div style={s.infoGrid}>
              {[
                ["School", kid.school], ["Teacher", kid.teacher],
                ["Next Appt", kid.nextAppt], ["Allergies", kid.allergies],
                ["Activities", kid.activities],
              ].filter(function(pair) { return pair[1]; }).map(function(pair) {
                return (
                  <div key={pair[0]} style={Object.assign({}, s.infoItem, { gridColumn: (pair[0] === "Allergies" || pair[0] === "Activities") ? "span 2" : undefined })}>
                    <div style={s.infoLabel}>{pair[0]}</div>
                    <div style={s.infoVal}>{pair[1]}</div>
                  </div>
                );
              })}
            </div>
            {kid.notes && <div style={s.notes}>{kid.notes}</div>}
          </div>
        );
      })}
      <button style={s.addKidBtn} onClick={function() { setEditingKid(null); setShowEditor(true); }}>
        <span style={{ fontSize: 26 }}>+</span>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Add another child</span>
      </button>
      {showEditor && (
        <KidEditor kid={editingKid}
          onSave={function(k) { if (editingKid) { updateKid(k); } else { addKid(k); } setShowEditor(false); }}
          onClose={function() { setShowEditor(false); }} />
      )}
    </div>
  );
}

function ShareTab() {
  var ctx = useApp();
  var family = ctx.family;
  var fmt = ctx.fmt;

  var selectedState = useState([]);
  var selected = selectedState[0];
  var setSelected = selectedState[1];

  var generatedState = useState("");
  var generated = generatedState[0];
  var setGenerated = generatedState[1];

  var sentState = useState(false);
  var sent = sentState[0];
  var setSent = sentState[1];

  function toggle(key) {
    setSelected(function(sel) {
      return sel.includes(key) ? sel.filter(function(k) { return k !== key; }) : sel.concat([key]);
    });
  }

  function generate() {
    if (!selected.length) return;
    setGenerated(buildMessage(selected, family, fmt));
  }

  function send() {
    var phone = family.coParent.phone || "";
    window.open(smsLink(phone, generated), "_blank");
    setSent(true);
    setTimeout(function() { setSent(false); }, 3000);
  }

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      {!family.coParent.phone && (
        <div style={{ background: "#FFF3CD", border: "1px solid #FFD700", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#856404" }}>
          Add {family.coParent.name}'s phone number in Settings to enable SMS sharing.
        </div>
      )}
      <div style={s.composeBox}>
        <div style={s.composeLabel}>What do you want to share?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {MSG_TEMPLATES.map(function(t) {
            return (
              <div key={t.key} onClick={function() { toggle(t.key); }} style={Object.assign({}, s.chip2, selected.includes(t.key) ? s.chip2Active : {})}>
                {t.label}
              </div>
            );
          })}
        </div>
        <button onClick={generate} disabled={!selected.length} style={Object.assign({}, s.sendBtn, { width: "100%", padding: "13px", fontSize: 15, borderRadius: 12, opacity: selected.length ? 1 : 0.5 })}>
          Generate message
        </button>
      </div>
      {generated ? (
        <div>
          <textarea style={s.textArea} value={generated} onChange={function(e) { setGenerated(e.target.value); }} rows={12} />
          <button onClick={send} style={Object.assign({}, s.sendBtn, { width: "100%", padding: "14px", fontSize: 15, borderRadius: 12, marginBottom: 16 })}>
            {sent ? "Sent!" : "Send via iMessage"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SettingsTab() {
  var ctx = useApp();
  var family = ctx.family;
  var setFamily = ctx.setFamily;
  var use24hr = ctx.use24hr;
  var setUse24hr = ctx.setUse24hr;

  var primaryState = useState(family.primaryParent);
  var primary = primaryState[0];
  var setPrimary = primaryState[1];

  var coParentState = useState(family.coParent);
  var coParent = coParentState[0];
  var setCoParent = coParentState[1];

  var savedState = useState(false);
  var saved = savedState[0];
  var setSaved = savedState[1];

  function save() {
    setFamily(function(f) { return Object.assign({}, f, { primaryParent: primary, coParent: coParent }); });
    setSaved(true);
    setTimeout(function() { setSaved(false); }, 2000);
  }

  return (
    <div style={{ padding: "20px 16px 100px" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: p.text, marginBottom: 20 }}>Settings</div>

      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: p.muted, marginBottom: 10 }}>Time format</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[["12-hour", false, "3:30 PM"], ["24-hour", true, "15:30"]].map(function(opt) {
          var label = opt[0]; var val = opt[1]; var ex = opt[2];
          return (
            <button key={label} onClick={function() { setUse24hr(val); }} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1.5px solid " + (use24hr === val ? p.accent : p.warm), background: use24hr === val ? p.accentSoft : p.white, color: use24hr === val ? p.accent : p.muted, cursor: "pointer", fontFamily: "inherit" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: use24hr === val ? p.accent : p.text }}>{label}</div>
              <div style={{ fontSize: 13, color: p.muted }}>{ex}</div>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: p.muted, marginBottom: 10 }}>Your info</div>
      {[
        ["Your name", primary.name, function(v) { setPrimary(function(pr) { return Object.assign({}, pr, { name: v }); }); }],
        ["Your phone", primary.phone || "", function(v) { setPrimary(function(pr) { return Object.assign({}, pr, { phone: v }); }); }],
      ].map(function(row) {
        return (
          <div key={row[0]} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: p.muted, marginBottom: 4 }}>{row[0]}</div>
            <input value={row[1]} onChange={function(e) { row[2](e.target.value); }} style={{ width: "100%", background: "#fff", border: "1.5px solid " + p.warm, borderRadius: 10, padding: "11px 14px", fontSize: 15, color: p.text, outline: "none" }} />
          </div>
        );
      })}

      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: p.muted, marginBottom: 10, marginTop: 20 }}>Co-parent info</div>
      {[
        ["Name", coParent.name, function(v) { setCoParent(function(cp) { return Object.assign({}, cp, { name: v }); }); }],
        ["Phone", coParent.phone || "", function(v) { setCoParent(function(cp) { return Object.assign({}, cp, { phone: v }); }); }],
      ].map(function(row) {
        return (
          <div key={row[0]} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: p.muted, marginBottom: 4 }}>{row[0]}</div>
            <input value={row[1]} onChange={function(e) { row[2](e.target.value); }} style={{ width: "100%", background: "#fff", border: "1.5px solid " + p.warm, borderRadius: 10, padding: "11px 14px", fontSize: 15, color: p.text, outline: "none" }} />
          </div>
        );
      })}

      <button onClick={save} style={Object.assign({}, s.sendBtn, { width: "100%", padding: "14px", fontSize: 15, borderRadius: 12, marginTop: 8 })}>
        {saved ? "Saved!" : "Save changes"}
      </button>
    </div>
  );
}

function NavIcon(props) {
  var name = props.name;
  var active = props.active;
  var c = active ? p.accent : p.muted;
  if (name === "today") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    );
  }
  if (name === "kids") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="3"/>
        <path d="M3 21v-2a5 5 0 0 1 5-5h2"/>
        <circle cx="17" cy="10" r="2.5"/>
        <path d="M13 21v-1.5a4 4 0 0 1 8 0V21"/>
      </svg>
    );
  }
  if (name === "find") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7"/>
        <line x1="16.5" y1="16.5" x2="22" y2="22"/>
      </svg>
    );
  }
  if (name === "share") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}

function AppInner() {
  var tabState = useState("today");
  var tab = tabState[0];
  var setTab = tabState[1];

  var ctx = useApp();
  var family = ctx.family;
  var setFamily = ctx.setFamily;

  if (!family) {
    return <Onboarding onComplete={function(data) { setFamily(data); }} />;
  }

  var navItems = [
    { key: "today", label: "Schedule" },
    { key: "kids", label: "Kids" },
    { key: "find", label: "Find" },
    { key: "share", label: "Share" },
    { key: "settings", label: "More" },
  ];

  return (
    <div>
      <style>{globalStyles}</style>
      <div style={s.app}>
        <div style={s.header}>
          <div style={s.headerTop}>
            <div>
              <div style={s.appName}>carry<span style={{ color: p.accent }}>.</span></div>
              <div style={s.headerSub}>{family.primaryParent.name + "'s family"}</div>
            </div>
            <div style={{ display: "flex" }}>
              {[family.primaryParent, family.coParent].map(function(person, i) {
                return (
                  <div key={person.name} style={Object.assign({}, s.avatar, { background: i === 0 ? p.purpleSoft : p.blueSoft, color: i === 0 ? p.purple : p.blue, marginLeft: i === 0 ? 0 : -8 })}>
                    {person.emoji || person.name[0]}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {tab === "today" && <TodayTab />}
        {tab === "kids" && <KidsTab />}
        {tab === "find" && <FindTab />}
        {tab === "share" && <ShareTab />}
        {tab === "settings" && <SettingsTab />}

        <div style={s.bottomNav}>
          {navItems.map(function(b) {
            var active = tab === b.key;
            return (
              <button key={b.key} style={s.bnavBtn} onClick={function() { setTab(b.key); }}>
                <div style={{ width: 44, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: active ? p.accentSoft : "transparent" }}>
                  <NavIcon name={b.key} active={active} />
                </div>
                <div style={{ fontSize: 11, fontWeight: active ? 600 : 500, color: active ? p.accent : p.muted, marginTop: 1 }}>{b.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
