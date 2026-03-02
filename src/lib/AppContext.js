// src/lib/AppContext.js
import { createContext, useContext, useState } from "react";

// Default family data - in production this would come from a database
const DEFAULT_FAMILY = {
  primaryParent: { name: "Sarah", emoji: "S", color: "#9B7BB8" },
  coParent: { name: "Marcus", emoji: "M", color: "#5A89B8" },
  location: { city: "Toronto, ON", lat: 43.6532, lng: -79.3832 },
  kids: [
    {
      id: "lila",
      name: "Lila",
      age: 7,
      emoji: "🦋",
      school: "Maplewood Elementary · Grade 2",
      teacher: "Ms. Hendricks",
      doctor: "Dr. Patel",
      doctorPhone: "(416) 555-0192",
      nextAppt: "Mar 6 · Annual checkup",
      allergies: "Peanuts, bee stings · EpiPen in backpack",
      medications: ["Zyrtec 10mg (morning)"],
      activities: "Swimming Tue/Thu · Ballet Friday",
      notes: "Needs water bottle daily. Library books due every Monday.",
    },
    {
      id: "theo",
      name: "Theo",
      age: 5,
      emoji: "🦕",
      school: "Maplewood JK · Room 4",
      teacher: "Ms. Bouchard",
      doctor: "Dr. Patel",
      doctorPhone: "(416) 555-0192",
      nextAppt: "May 12 · Follow-up",
      allergies: "None known",
      medications: ["Amoxicillin 250mg (with food, 2x/day)", "Flonase (morning)"],
      activities: "Soccer Sundays · Soccer Thursdays",
      notes: "Ear infection treatment ends Mar 8. Needs snow boots at school.",
    },
  ],
  schedule: [
    { id: 1, time: "9:00 AM", emoji: "🏊", title: "Swim practice — Lila", sub: "Aquatic Centre, Lane 3 · Bring cap & goggles", assignedTo: "Marcus", date: "today" },
    { id: 2, time: "12:30 PM", emoji: "💊", title: "Theo's medication", sub: "Amoxicillin 250mg · With food", assignedTo: "Sarah", date: "today" },
    { id: 3, time: "2:00 PM", emoji: "⚽", title: "Soccer game — Theo", sub: "Riverside Fields · Uniform: red jersey", assignedTo: "Marcus", date: "today" },
    { id: 4, time: "4:30 PM", emoji: "📚", title: "Homework + reading", sub: "30 min reading for both kids", assignedTo: "Sarah", date: "today" },
  ],
  reminders: [
    { id: 1, emoji: "🏊", text: "Swimming sign-up closes in 2 days", sub: "Spring session · Aquatic Centre · Ages 6–8", urgent: true },
    { id: 2, emoji: "📋", text: "Permission slip due — Theo's field trip (Wed)" },
    { id: 3, emoji: "🏥", text: "Lila's annual checkup — Dr. Patel (Thu 3pm)" },
    { id: 4, emoji: "🎂", text: "Emma's birthday party (Sat noon — gift needed!)" },
  ],
  sentMessages: [
    { id: 1, date: "Feb 25", preview: "Hi! Reminder: Lila has swim Thursday at 4pm (not 3:30). Theo's ear drops are in the medicine cabinet — twice a day with meals. Soccer Saturday is at Riverside Field, bring a snack for both kids. 🏊⚽" },
    { id: 2, date: "Feb 18", preview: "This week: Monday is a PD day — kids are home. Lila's book report is due Wed. Don't forget Theo's follow-up at Dr. Patel on Friday at 11am (he needs to fast from breakfast)." },
  ],
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [family, setFamily] = useState(DEFAULT_FAMILY);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  // Build a system context string for Claude
  const getFamilyContext = () => {
    const kidsText = family.kids.map((k) =>
      `${k.name} (age ${k.age}): school=${k.school}, doctor=${k.doctor}, allergies=${k.allergies}, meds=${k.medications.join(", ")}, activities=${k.activities}`
    ).join("\n");

    return `Family: ${family.primaryParent.name} (primary) and ${family.coParent.name} (co-parent)
Location: ${family.location.city}
Kids:\n${kidsText}
Today's schedule: ${family.schedule.map((s) => `${s.time} - ${s.title}`).join(", ")}`;
  };

  return (
    <AppContext.Provider value={{ family, setFamily, getFamilyContext, aiAssistantOpen, setAiAssistantOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
