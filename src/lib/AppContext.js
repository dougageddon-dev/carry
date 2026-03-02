// src/lib/AppContext.js
import { createContext, useContext, useState, useCallback } from "react";
import { loadFamily, saveFamily, uid } from "./storage";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [family, setFamilyRaw] = useState(() => loadFamily()); // null if not onboarded

  // Always persist on every update
  const setFamily = useCallback((updater) => {
    setFamilyRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveFamily(next);
      return next;
    });
  }, []);

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
      sentMessages: [{ ...msg, id: uid(), date }, ...f.sentMessages].slice(0, 20)
    }));
  }, [setFamily]);

  // Claude context string
  const getFamilyContext = useCallback(() => {
    if (!family) return "";
    const kidsText = family.kids.map(k =>
      `${k.name} (age ${k.age}): school=${k.school}, doctor=${k.doctor}, allergies=${k.allergies}, meds=${(k.medications || []).join(", ")}, activities=${k.activities}`
    ).join("\n");
    const scheduleText = family.schedule.map(s => `${s.time || ""} ${s.day || ""} - ${s.title}`).join(", ");
    const remindersText = family.reminders.map(r => r.text).join(", ");
    return `Family: ${family.primaryParent.name} (primary) and ${family.coParent.name} (co-parent, phone: ${family.coParent.phone || "not set"})
Location: ${family.location ? family.location.city : ""}
Kids:\n${kidsText}
Schedule: ${scheduleText || "None added yet"}
Reminders: ${remindersText || "None"}`;
  }, [family]);

  return (
    <AppContext.Provider value={{
      family, setFamily,
      addKid, updateKid, removeKid,
      addEvent, updateEvent, removeEvent,
      addReminder, updateReminder, removeReminder,
      addSentMessage,
      getFamilyContext,
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
