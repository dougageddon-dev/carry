// src/lib/AppContext.js
import { createContext, useContext, useState, useCallback } from "react";
import { loadFamily, saveFamily, uid } from "./storage";

const AppContext = createContext(null);

// ─── Time formatting utility (exported for use everywhere) ────────────────────
export function formatTime(timeStr, use24hr = false) {
  if (!timeStr) return "";
  // Already formatted as "3:30 PM"
  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    if (use24hr) {
      let h = parseInt(match12[1]);
      const isPM = match12[3].toUpperCase() === "PM";
      if (isPM && h !== 12) h += 12;
      if (!isPM && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${match12[2]}`;
    }
    return `${match12[1]}:${match12[2]} ${match12[3].toUpperCase()}`;
  }
  // Already 24hr format "14:30"
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    if (use24hr) return `${String(parseInt(match24[1])).padStart(2,"0")}:${match24[2]}`;
    let h = parseInt(match24[1]);
    const period = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${match24[2]} ${period}`;
  }
  return timeStr;
}

export function AppProvider({ children }) {
  const [family, setFamilyRaw] = useState(() => loadFamily());

  const setFamily = useCallback((updater) => {
    setFamilyRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveFamily(next);
      return next;
    });
  }, []);

  // Clock preference (stored in family object)
  const use24hr = family?.settings?.use24hr || false;
  const setUse24hr = useCallback((val) => {
    setFamily(f => ({ ...f, settings: { ...(f.settings || {}), use24hr: val } }));
  }, [setFamily]);

  // Convenience formatter that uses current preference
  const fmt = useCallback((t) => formatTime(t, use24hr), [use24hr]);

  // Kid CRUD
  const addKid = useCallback((kid) => {
    setFamily(f => ({ ...f, kids: [...f.kids, { ...kid, id: kid.id || uid() }] }));
  }, [setFamily]);
  const updateKid = useCallback((kid) => {
    setFamily(f => ({ ...f, kids: f.kids.map(k => k.id === kid.id ? kid : k) }));
  }, [setFamily]);
  const removeKid = useCallback((kidId) => {
    setFamily(f => ({ ...f, kids: f.kids.filter(k => k.id !== kidId) }));
  }, [setFamily]);

  // Schedule CRUD
  const addEvent = useCallback((event) => {
    setFamily(f => ({ ...f, schedule: [...f.schedule, { ...event, id: event.id || uid() }] }));
  }, [setFamily]);
  const updateEvent = useCallback((event) => {
    setFamily(f => ({ ...f, schedule: f.schedule.map(e => e.id === event.id ? event : e) }));
  }, [setFamily]);
  const removeEvent = useCallback((eventId) => {
    setFamily(f => ({ ...f, schedule: f.schedule.filter(e => e.id !== eventId) }));
  }, [setFamily]);

  // Reminder CRUD
  const addReminder = useCallback((reminder) => {
    setFamily(f => ({ ...f, reminders: [...f.reminders, { ...reminder, id: reminder.id || uid() }] }));
  }, [setFamily]);
  const updateReminder = useCallback((reminder) => {
    setFamily(f => ({ ...f, reminders: f.reminders.map(r => r.id === reminder.id ? reminder : r) }));
  }, [setFamily]);
  const removeReminder = useCallback((reminderId) => {
    setFamily(f => ({ ...f, reminders: f.reminders.filter(r => r.id !== reminderId) }));
  }, [setFamily]);

  // Sent messages
  const addSentMessage = useCallback((msg) => {
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setFamily(f => ({
      ...f,
      sentMessages: [{ ...msg, id: uid(), date }, ...(f.sentMessages || [])].slice(0, 20)
    }));
  }, [setFamily]);

  const getFamilyContext = useCallback(() => {
    if (!family) return "";
    const kidsText = family.kids.map(k =>
      `${k.name} (age ${k.age}): school=${k.school}, doctor=${k.doctor}, allergies=${k.allergies}, meds=${(k.medications || []).join(", ")}, activities=${k.activities}`
    ).join("\n");
    return `Family: ${family.primaryParent.name} (primary) and ${family.coParent.name} (co-parent, phone: ${family.coParent.phone || "not set"})
Location: ${family.location?.city || ""}
Kids:\n${kidsText}
Schedule: ${(family.schedule || []).map(s => `${s.time || ""} ${s.day || ""} - ${s.title}`).join(", ") || "None"}
Reminders: ${(family.reminders || []).map(r => r.text).join(", ") || "None"}`;
  }, [family]);

  return (
    <AppContext.Provider value={{
      family, setFamily,
      use24hr, setUse24hr, fmt,
      addKid, updateKid, removeKid,
      addEvent, updateEvent, removeEvent,
      addReminder, updateReminder, removeReminder,
      addSentMessage, getFamilyContext,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
