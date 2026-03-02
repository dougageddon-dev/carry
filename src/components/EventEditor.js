// src/components/EventEditor.js
import { useState, useMemo, useEffect } from "react";
import { uid } from "../lib/storage";
import MobileCalendar from "./MobileCalendar";

const p = {
  warm: "#F5EDE0", accent: "#E8825A", accentLight: "#FEF0E8", green: "#7BAF8E",
  blue: "#5A89B8", blueLight: "#EBF2FA", blueBorder: "#C0D8F0",
  text: "#2A1F1A", muted: "#8C7B72", white: "#FFFFFF", bg: "#FDF8F3",
  red: "#C0392B", redLight: "#F5C6C2",
};

// ─── Activity emoji map ───────────────────────────────────────────────────────
const ACTIVITY_EMOJIS = [
  { keywords: ["swim","pool","aqua","water polo","diving"], emoji: "🏊" },
  { keywords: ["soccer","football"], emoji: "⚽" },
  { keywords: ["basketball","hoops"], emoji: "🏀" },
  { keywords: ["baseball","softball","tee ball"], emoji: "⚾" },
  { keywords: ["hockey","ice"], emoji: "🏒" },
  { keywords: ["tennis","squash","badminton"], emoji: "🎾" },
  { keywords: ["volleyball","volley"], emoji: "🏐" },
  { keywords: ["gymnastics","gym","tumbling","acro"], emoji: "🤸" },
  { keywords: ["dance","ballet","hip hop","tap","jazz","ballroom"], emoji: "💃" },
  { keywords: ["music","piano","guitar","violin","drums","band","choir","singing","vocal"], emoji: "🎵" },
  { keywords: ["art","paint","draw","craft","pottery","ceramics"], emoji: "🎨" },
  { keywords: ["karate","martial","taekwondo","judo","jiu jitsu","wrestling"], emoji: "🥋" },
  { keywords: ["chess"], emoji: "♟️" },
  { keywords: ["coding","computer","tech","robotics","stem"], emoji: "💻" },
  { keywords: ["science","chemistry","lab","biology"], emoji: "🧪" },
  { keywords: ["reading","book","library","literacy"], emoji: "📚" },
  { keywords: ["math","tutor","homework","study"], emoji: "✏️" },
  { keywords: ["run","track","cross country","jog"], emoji: "🏃" },
  { keywords: ["bike","cycling","cycle"], emoji: "🚴" },
  { keywords: ["climbing","bouldering"], emoji: "🧗" },
  { keywords: ["ski","snowboard","slope"], emoji: "⛷️" },
  { keywords: ["skate","skating","roller"], emoji: "⛸️" },
  { keywords: ["rugby","lacrosse"], emoji: "🏉" },
  { keywords: ["cheer","pom"], emoji: "📣" },
  { keywords: ["theatre","theater","drama","acting","play"], emoji: "🎭" },
  { keywords: ["camp","nature","outdoor","hiking","trail"], emoji: "🏕️" },
  { keywords: ["yoga","pilates","stretch"], emoji: "🧘" },
  { keywords: ["archery","bow"], emoji: "🏹" },
  { keywords: ["golf"], emoji: "⛳" },
  { keywords: ["surf","board"], emoji: "🏄" },
  { keywords: ["doctor","dentist","appoint","checkup","physio","therapy"], emoji: "🏥" },
  { keywords: ["medic","pill","prescription"], emoji: "💊" },
  { keywords: ["birthday","party","celebration"], emoji: "🎂" },
  { keywords: ["school","class","lesson","course"], emoji: "🏫" },
  { keywords: ["bus","pickup","drop","carpool"], emoji: "🚌" },
  { keywords: ["lunch","snack","food","eat"], emoji: "🍎" },
  { keywords: ["playdate","friend"], emoji: "👫" },
  { keywords: ["show","concert","recital","performance"], emoji: "🎪" },
  { keywords: ["photo","picture","portrait"], emoji: "📸" },
  { keywords: ["appointment","meeting"], emoji: "📋" },
];

function getMatchingEmojis(title) {
  if (!title || title.trim().length < 2) return ACTIVITY_EMOJIS.map(a => a.emoji);
  const lower = title.toLowerCase();
  const matches = ACTIVITY_EMOJIS.filter(a =>
    a.keywords.some(k => lower.includes(k) || k.startsWith(lower.split(" ")[0]))
  );
  return matches.length ? [...new Set(matches.map(a => a.emoji))] : ACTIVITY_EMOJIS.map(a => a.emoji);
}

function suggestEmoji(title) {
  if (!title) return "📅";
  const lower = title.toLowerCase();
  for (const { keywords, emoji } of ACTIVITY_EMOJIS) {
    if (keywords.some(k => lower.includes(k))) return emoji;
  }
  return "📅";
}

// ─── Parse a stored time string → { hour, min, period } ──────────────────────
function parseTime(val) {
  if (!val) return { hour: "", min: "00", period: "AM" };
  const m12 = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) return { hour: m12[1], min: m12[2], period: m12[3].toUpperCase() };
  const m24 = val.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    let h = parseInt(m24[1]);
    const period = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return { hour: String(h), min: m24[2], period };
  }
  return { hour: "", min: "00", period: "AM" };
}

// ─── Controlled 12-hour time picker ──────────────────────────────────────────
// Uses local state so typing in the hour field works correctly.
function TimePicker({ value, onChange }) {
  const parsed = parseTime(value);
  const [hour, setHour] = useState(parsed.hour);
  const [min, setMin] = useState(parsed.min);
  const [period, setPeriod] = useState(parsed.period);

  // Sync inward if value prop changes from outside (e.g. form reset)
  useEffect(() => {
    const p2 = parseTime(value);
    setHour(p2.hour);
    setMin(p2.min);
    setPeriod(p2.period);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (h, m, per) => {
    onChange(h ? `${h}:${m} ${per}` : "");
  };

  const handleHourChange = (raw) => {
    let v = raw.replace(/\D/g, "");
    if (v.length > 2) v = v.slice(-2);
    if (parseInt(v) > 12) v = "12";
    setHour(v);
    emit(v, min, period);
  };

  const handleMinChange = (m) => {
    setMin(m);
    emit(hour, m, period);
  };

  const handlePeriod = (per) => {
    setPeriod(per);
    emit(hour, min, per);
  };

  const inputStyle = {
    flex: 1, border: `1.5px solid ${p.warm}`, borderRadius: 10,
    padding: "12px 0", fontSize: 22, fontWeight: 700,
    color: p.text, background: p.white, outline: "none",
    fontFamily: "inherit", textAlign: "center",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        type="text" inputMode="numeric"
        value={hour}
        placeholder="–"
        onChange={e => handleHourChange(e.target.value)}
        style={inputStyle}
      />
      <span style={{ fontSize: 24, fontWeight: 700, color: p.muted }}>:</span>
      <select
        value={min}
        onChange={e => handleMinChange(e.target.value)}
        style={{ ...inputStyle, cursor: "pointer" }}
      >
        {["00","05","10","15","20","25","30","35","40","45","50","55"].map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {["AM", "PM"].map(per => (
          <button
            key={per}
            type="button"
            onClick={() => handlePeriod(per)}
            style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 15, fontWeight: 700,
              border: `1.5px solid ${period === per ? p.accent : p.warm}`,
              background: period === per ? p.accent : p.white,
              color: period === per ? p.white : p.muted,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >{per}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Person picker ────────────────────────────────────────────────────────────
function PersonPicker({ label, value, onChange, people }) {
  const [customVal, setCustomVal] = useState(
    value && !people.includes(value) && value !== "TBD" ? value : ""
  );
  const options = [...people, "Other", "TBD"];
  const isOther = value && !people.includes(value) && value !== "TBD";

  return (
    <div>
      <div style={lbl}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
        {options.map(opt => (
          <button key={opt} type="button"
            onClick={() => onChange(opt === "Other" ? (customVal || "") : opt)}
            style={{
              padding: "9px 14px", borderRadius: 10, fontSize: 15, fontWeight: 500,
              border: `1.5px solid ${(opt === "Other" ? isOther : value === opt) ? p.accent : p.warm}`,
              background: (opt === "Other" ? isOther : value === opt) ? p.accentLight : p.white,
              color: (opt === "Other" ? isOther : value === opt) ? p.accent : p.muted,
              cursor: "pointer", fontFamily: "inherit",
            }}>{opt}</button>
        ))}
      </div>
      {isOther && (
        <input value={customVal}
          onChange={e => { setCustomVal(e.target.value); onChange(e.target.value); }}
          placeholder="e.g. Grandma, Coach Tim…"
          style={{ ...inputSt, marginTop: 8 }} />
      )}
    </div>
  );
}

// ─── Day picker: week strip + calendar ───────────────────────────────────────
function DayPicker({ value, onChange }) {
  const [showCal, setShowCal] = useState(false);
  const today = new Date();
  const weekDays = [];
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(d);
  }
  const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const isWeekDaySelected = (d) => {
    if (!value) return false;
    if (value.includes("T") || value.match(/^\d{4}-/)) {
      const sel = new Date(value);
      return sel.getFullYear() === d.getFullYear() && sel.getMonth() === d.getMonth() && sel.getDate() === d.getDate();
    }
    const name = d.toLocaleDateString("en-US", { weekday: "long" });
    if (value === "Today") return d.toDateString() === today.toDateString();
    const tom = new Date(today); tom.setDate(today.getDate() + 1);
    if (value === "Tomorrow") return d.toDateString() === tom.toDateString();
    return name === value;
  };

  const isFurtherSelected = value && (value.includes("T") || value.match(/^\d{4}-/)) && !weekDays.some(d => isWeekDaySelected(d));
  const furtherLabel = isFurtherSelected
    ? new Date(value).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : "Pick a date further out…";

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={lbl}>Day</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginTop: 8 }}>
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isSel = isWeekDaySelected(d);
          return (
            <button key={i} type="button" onClick={() => onChange(d.toISOString())} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "10px 0", borderRadius: 12,
              border: `1.5px solid ${isSel ? p.accent : isToday ? "#F2C4A8" : p.warm}`,
              background: isSel ? p.accent : isToday ? p.accentLight : p.white,
              color: isSel ? p.white : isPast ? "#ccc" : p.text,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{DOW[d.getDay()]}</span>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{d.getDate()}</span>
              <span style={{ fontSize: 10, color: isSel ? "rgba(255,255,255,0.7)" : p.muted }}>{MON[d.getMonth()]}</span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={() => setShowCal(true)} style={{
        width: "100%", marginTop: 8, padding: "12px", borderRadius: 12,
        border: `1.5px solid ${isFurtherSelected ? p.accent : p.warm}`,
        background: isFurtherSelected ? p.accentLight : p.white,
        color: isFurtherSelected ? p.accent : p.muted,
        fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <span>📆</span><span>{furtherLabel}</span>
      </button>
      {showCal && (
        <MobileCalendar
          selected={value && (value.includes("T") || value.match(/^\d{4}-/)) ? value : null}
          onChange={iso => { onChange(iso); setShowCal(false); }}
          onClose={() => setShowCal(false)}
        />
      )}
    </div>
  );
}

// ─── Notification picker for reminders ───────────────────────────────────────
function NotificationPicker({ notifyDate, notifyTime, onDateChange, onTimeChange }) {
  const [showCal, setShowCal] = useState(false);

  const displayDate = notifyDate
    ? new Date(notifyDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : null;

  const requestPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  return (
    <div style={{ background: "#F0F5FF", borderRadius: 14, padding: 16, border: "1px solid #C0D0F0", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1A3A80" }}>Remind me</div>
        <div style={{ fontSize: 12, color: p.muted, marginLeft: "auto" }}>iOS &amp; Android</div>
      </div>

      {/* Date */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ ...lbl, color: "#1A3A80", marginBottom: 6 }}>On this date</div>
        <button type="button" onClick={() => { requestPermission(); setShowCal(true); }} style={{
          width: "100%", padding: "12px 14px", borderRadius: 10, textAlign: "left",
          border: `1.5px solid ${notifyDate ? "#5A7ABF" : "#C0D0F0"}`,
          background: notifyDate ? "#E8F0FF" : p.white,
          color: notifyDate ? "#1A3A80" : p.muted,
          fontSize: 15, fontWeight: notifyDate ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>📅</span>
          <span>{displayDate || "Choose a date…"}</span>
        </button>
      </div>

      {/* Time */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ ...lbl, color: "#1A3A80", marginBottom: 6 }}>At this time</div>
        <TimePicker value={notifyTime || ""} onChange={onTimeChange} />
      </div>

      {notifyDate && notifyTime && (
        <div style={{ background: "#D8E8FF", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#1A3A80", lineHeight: 1.5 }}>
          ✅ You'll get a notification on {displayDate} at {notifyTime}
          <div style={{ fontSize: 12, color: "#5A7ABF", marginTop: 4 }}>
            Make sure notifications are enabled for this browser/app in your phone settings.
          </div>
        </div>
      )}

      <button type="button" onClick={() => { onDateChange(""); onTimeChange(""); }} style={{
        background: "none", border: "none", color: p.muted, fontSize: 13, cursor: "pointer",
        padding: "6px 0 0", fontFamily: "inherit",
      }}>Clear reminder</button>

      {showCal && (
        <MobileCalendar
          selected={notifyDate || null}
          onChange={iso => { onDateChange(iso); setShowCal(false); }}
          onClose={() => setShowCal(false)}
        />
      )}
    </div>
  );
}

// ─── Main EventEditor ─────────────────────────────────────────────────────────
export default function EventEditor({ event, people, onSave, onDelete, onClose }) {
  const isNew = !event;
  const [form, setForm] = useState(event || {
    id: uid(), emoji: "📅", title: "", sub: "",
    time: "", day: new Date().toISOString(),
    dropoffBy: "", dropoffTime: "",
    pickupBy: "", pickupTime: "",
    isReminder: false, urgent: false,
    notifyDate: "", notifyTime: "",
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleTitleChange = (val) => {
    const suggested = suggestEmoji(val);
    setForm(f => ({
      ...f, title: val,
      emoji: f.emoji === "📅" ? suggested : f.emoji,
    }));
  };

  const matchingEmojis = useMemo(() => getMatchingEmojis(form.title), [form.title]);
  const canSave = form.title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    // Schedule web notification if date+time set and permission granted
    if (form.isReminder && form.notifyDate && form.notifyTime) {
      scheduleNotification(form);
    }
    onSave({ ...form, title: form.title.trim(), sub: (form.sub || "").trim() });
  };

  return (
    <div style={overlay}>
      <div style={sheet}>
        <div style={{ width: 40, height: 4, background: p.warm, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: p.text }}>
            {isNew ? "Add event" : "Edit event"}
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: p.muted, padding: 4 }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Type toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[["📅 Schedule", false], ["🔔 Reminder", true]].map(([label, val]) => (
              <button key={label} type="button" onClick={() => set("isReminder", val)} style={{
                flex: 1, padding: "11px", borderRadius: 12, fontSize: 15, fontWeight: 500,
                border: `1.5px solid ${form.isReminder === val ? p.accent : p.warm}`,
                background: form.isReminder === val ? p.accentLight : p.white,
                color: form.isReminder === val ? p.accent : p.muted,
                cursor: "pointer", fontFamily: "inherit",
              }}>{label}</button>
            ))}
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <div style={lbl}>Title *</div>
            <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
              placeholder={form.isReminder ? "e.g. Permission slip due" : "e.g. Volleyball — Maya"}
              style={inputSt} autoFocus />
          </div>

          {/* Smart emoji */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ ...lbl, marginBottom: 8 }}>
              Icon
              {form.title.length > 1 && <span style={{ fontWeight: 400, color: p.muted, fontSize: 13, marginLeft: 6 }}>filtered by title</span>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {matchingEmojis.map(e => (
                <button key={e} type="button" onClick={() => set("emoji", e)} style={{
                  width: 46, height: 46, borderRadius: 12, fontSize: 22,
                  border: `2px solid ${form.emoji === e ? p.accent : p.warm}`,
                  background: form.emoji === e ? p.accentLight : p.white,
                  cursor: "pointer", transition: "all 0.15s",
                }}>{e}</button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div style={{ marginBottom: 14 }}>
            <div style={lbl}>Details / Location</div>
            <input value={form.sub || ""} onChange={e => set("sub", e.target.value)}
              placeholder="e.g. Riverside Gym, Court 2" style={inputSt} />
          </div>

          {!form.isReminder && (
            <>
              <DayPicker value={form.day} onChange={v => set("day", v)} />
              <div style={{ marginBottom: 18 }}>
                <div style={lbl}>Start time</div>
                <TimePicker value={form.time} onChange={v => set("time", v)} />
              </div>
              <div style={{ background: "#FFF5F0", borderRadius: 14, padding: 16, border: "1px solid #FFD5C0", marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#8C3A00", marginBottom: 14 }}>🚗 Drop-off</div>
                <div style={{ marginBottom: 14 }}>
                  <div style={lbl}>Drop-off time</div>
                  <TimePicker value={form.dropoffTime || ""} onChange={v => set("dropoffTime", v)} />
                </div>
                <PersonPicker label="Who's dropping off?" value={form.dropoffBy || ""} onChange={v => set("dropoffBy", v)} people={people} />
              </div>
              <div style={{ background: "#F0F7FF", borderRadius: 14, padding: 16, border: "1px solid #C0D8F0", marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A4A80", marginBottom: 14 }}>🏁 Pick-up</div>
                <div style={{ marginBottom: 14 }}>
                  <div style={lbl}>Pick-up time</div>
                  <TimePicker value={form.pickupTime || ""} onChange={v => set("pickupTime", v)} />
                </div>
                <PersonPicker label="Who's picking up?" value={form.pickupBy || ""} onChange={v => set("pickupBy", v)} people={people} />
              </div>
            </>
          )}

          {form.isReminder && (
            <>
              {/* Notification date + time */}
              <NotificationPicker
                notifyDate={form.notifyDate || ""}
                notifyTime={form.notifyTime || ""}
                onDateChange={v => set("notifyDate", v)}
                onTimeChange={v => set("notifyTime", v)}
              />
              {/* Urgent toggle */}
              <div style={{ marginBottom: 14 }}>
                <div type="button" onClick={() => set("urgent", !form.urgent)}
                  style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <div style={{ width: 50, height: 28, borderRadius: 14, background: form.urgent ? p.accent : p.warm, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: p.white, position: "absolute", top: 3, left: form.urgent ? 25 : 3, transition: "left 0.2s" }} />
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 500, color: p.text }}>Mark as urgent ⚡</span>
                </div>
              </div>
            </>
          )}

          <div style={{ height: 16 }} />
        </div>

        {/* Sticky footer */}
        <div style={{ paddingTop: 12, borderTop: `1px solid ${p.warm}`, background: p.bg }}>
          <button type="button" onClick={handleSave} disabled={!canSave} style={{
            width: "100%", background: canSave ? p.accent : p.warm,
            color: canSave ? p.white : p.muted, border: "none", borderRadius: 12,
            padding: "15px", fontSize: 16, fontWeight: 600,
            cursor: canSave ? "pointer" : "default", fontFamily: "inherit", marginBottom: 8,
          }}>
            {isNew ? (form.isReminder ? "Add reminder" : "Add to schedule") : "Save changes"}
          </button>
          {!isNew && (
            <button type="button" onClick={() => { if (window.confirm("Remove this item?")) onDelete(event.id); }} style={{
              width: "100%", background: "transparent", color: p.red,
              border: `1.5px solid ${p.redLight}`, borderRadius: 12, padding: "13px",
              fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}>Remove</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Schedule a Web Notification (best-effort) ────────────────────────────────
function scheduleNotification(reminder) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!reminder.notifyDate || !reminder.notifyTime) return;

  const parsed = parseTime(reminder.notifyTime);
  if (!parsed.hour) return;

  const notifyAt = new Date(reminder.notifyDate);
  let h = parseInt(parsed.hour);
  if (parsed.period === "PM" && h !== 12) h += 12;
  if (parsed.period === "AM" && h === 12) h = 0;
  notifyAt.setHours(h, parseInt(parsed.min), 0, 0);

  const msUntil = notifyAt.getTime() - Date.now();
  if (msUntil <= 0) return;

  // Store in localStorage so a service worker or page-reload can re-schedule
  const key = `carry_notify_${reminder.id}`;
  localStorage.setItem(key, JSON.stringify({
    id: reminder.id,
    title: reminder.title || reminder.text,
    body: reminder.sub || "carry. reminder",
    fireAt: notifyAt.toISOString(),
  }));

  // Fire via setTimeout if the page is still open
  if (msUntil < 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      // eslint-disable-next-line no-new
      new Notification(`carry. · ${reminder.title || reminder.text}`, {
        body: reminder.sub || "",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
      localStorage.removeItem(key);
    }, msUntil);
  }
}

// Fire any pending notifications stored from previous sessions
export function firePendingNotifications() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const prefix = "carry_notify_";
  Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => {
    try {
      const n = JSON.parse(localStorage.getItem(k));
      const msUntil = new Date(n.fireAt).getTime() - Date.now();
      if (msUntil <= 0) {
        // Overdue — fire immediately
        // eslint-disable-next-line no-new
        new Notification(`carry. · ${n.title}`, { body: n.body, icon: "/favicon.ico" });
        localStorage.removeItem(k);
      } else if (msUntil < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          // eslint-disable-next-line no-new
          new Notification(`carry. · ${n.title}`, { body: n.body, icon: "/favicon.ico" });
          localStorage.removeItem(k);
        }, msUntil);
      }
    } catch (e) { localStorage.removeItem(k); }
  });
}

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" };
const sheet = { width: "100%", maxWidth: 430, background: "#FDF8F3", borderRadius: "22px 22px 0 0", padding: "16px 20px 28px", maxHeight: "93vh", display: "flex", flexDirection: "column", paddingBottom: "max(28px, env(safe-area-inset-bottom))" };
const lbl = { fontSize: 14, fontWeight: 600, color: "#2A1F1A", marginBottom: 4 };
const inputSt = { width: "100%", border: "1.5px solid #F5EDE0", borderRadius: 10, padding: "12px 14px", fontSize: 16, color: "#2A1F1A", background: "#FFFFFF", outline: "none", fontFamily: "inherit" };
