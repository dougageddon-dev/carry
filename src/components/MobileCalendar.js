// src/components/MobileCalendar.js
import { useState } from "react";

const p = {
  accent: "#E8825A", accentLight: "#FEF0E8", warm: "#F5EDE0",
  text: "#2A1F1A", muted: "#8C7B72", white: "#FFFFFF", bg: "#FDF8F3",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(d) { return isSameDay(d, new Date()); }

export default function MobileCalendar({ selected, onChange, onClose }) {
  const today = new Date();
  const initDate = selected ? new Date(selected) : today;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [picked, setPicked] = useState(selected || null);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const goToday = () => {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  };

  // Build grid cells
  const cells = [];
  // Prev month spillover
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, month: "prev" });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: "cur" });
  }
  // Next month spillover to fill 6 rows
  let next = 1;
  while (cells.length < 42) {
    cells.push({ day: next++, month: "next" });
  }

  const selectCell = (cell) => {
    if (cell.month !== "cur") return;
    const date = new Date(viewYear, viewMonth, cell.day);
    setPicked(date.toISOString());
  };

  const confirm = () => {
    if (picked) onChange(picked);
    onClose();
  };

  const pickedDate = picked ? new Date(picked) : null;

  return (
    <div style={overlay}>
      <div style={sheet}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: p.warm, borderRadius: 2, margin: "0 auto 20px" }} />

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button onClick={prevMonth} style={navBtn}>‹</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: p.text }}>
              {MONTHS[viewMonth]}
            </div>
            <div style={{ fontSize: 14, color: p.muted }}>{viewYear}</div>
          </div>
          <button onClick={nextMonth} style={navBtn}>›</button>
        </div>

        {/* Today shortcut */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <button onClick={goToday} style={{
            background: "none", border: `1.5px solid ${p.warm}`, borderRadius: 20,
            padding: "5px 16px", fontSize: 13, color: p.muted, cursor: "pointer", fontFamily: "inherit",
          }}>Go to today</button>
        </div>

        {/* Day of week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
          {DOW.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: p.muted, padding: "4px 0" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((cell, i) => {
            const isOtherMonth = cell.month !== "cur";
            const date = cell.month === "cur" ? new Date(viewYear, viewMonth, cell.day)
              : cell.month === "prev" ? new Date(viewYear, viewMonth - 1, cell.day)
              : new Date(viewYear, viewMonth + 1, cell.day);
            const isTodayCell = isToday(date);
            const isPicked = pickedDate && isSameDay(date, pickedDate);
            const isPast = !isOtherMonth && date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <button key={i} onClick={() => selectCell(cell)} disabled={isOtherMonth} style={{
                border: "none",
                borderRadius: 12,
                padding: "12px 0",
                fontSize: 17,
                fontWeight: isPicked || isTodayCell ? 700 : 400,
                background: isPicked ? p.accent : isTodayCell ? p.accentLight : "transparent",
                color: isPicked ? p.white : isOtherMonth ? "#CCC" : isPast ? p.muted : isTodayCell ? p.accent : p.text,
                cursor: isOtherMonth ? "default" : "pointer",
                fontFamily: "inherit",
                position: "relative",
                outline: isTodayCell && !isPicked ? `2px solid ${p.accent}` : "none",
                outlineOffset: -2,
              }}>
                {cell.day}
              </button>
            );
          })}
        </div>

        {/* Selected date display */}
        <div style={{ marginTop: 20, padding: "14px 16px", background: p.warm, borderRadius: 12, textAlign: "center" }}>
          {pickedDate ? (
            <div style={{ fontSize: 16, fontWeight: 600, color: p.text }}>
              {pickedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
          ) : (
            <div style={{ fontSize: 15, color: p.muted }}>Tap a date to select</div>
          )}
        </div>

        {/* Confirm */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{
            flex: 1, background: p.warm, border: "none", borderRadius: 12, padding: 14,
            fontSize: 15, fontWeight: 600, color: p.muted, cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
          <button onClick={confirm} disabled={!picked} style={{
            flex: 2, background: picked ? p.accent : "#ddd", border: "none", borderRadius: 12, padding: 14,
            fontSize: 15, fontWeight: 600, color: picked ? p.white : "#aaa", cursor: picked ? "pointer" : "default", fontFamily: "inherit",
          }}>Confirm date</button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300,
  display: "flex", alignItems: "flex-end", justifyContent: "center",
};
const sheet = {
  width: "100%", maxWidth: 430, background: "#FDF8F3",
  borderRadius: "24px 24px 0 0", padding: "16px 20px 36px",
  maxHeight: "95vh", overflowY: "auto",
};
const navBtn = {
  width: 44, height: 44, borderRadius: "50%", background: "#F5EDE0", border: "none",
  fontSize: 22, fontWeight: 700, cursor: "pointer", color: "#2A1F1A",
  display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
};
