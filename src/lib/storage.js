// src/lib/storage.js
// All localStorage reads/writes go through here

const KEY = "carry_family_v1";

export function loadFamily() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveFamily(family) {
  try {
    localStorage.setItem(KEY, JSON.stringify(family));
  } catch (e) {
    console.error("Failed to save family data:", e);
  }
}

export function clearFamily() {
  localStorage.removeItem(KEY);
}

export function isOnboarded() {
  const f = loadFamily();
  return !!(f && f.primaryParent && f.primaryParent.name);
}

// Generate a simple unique id
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
