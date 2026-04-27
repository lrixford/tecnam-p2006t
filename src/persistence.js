const memoryFallback = new Map();

function safeGetStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const probeKey = '__probe__';
    localStorage.setItem(probeKey, '1');
    localStorage.removeItem(probeKey);
    return localStorage;
  } catch {
    return null;
  }
}

export function load(key) {
  const storage = safeGetStorage();
  try {
    const raw = storage ? storage.getItem(key) : memoryFallback.get(key);
    if (raw == null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function save(key, value) {
  const storage = safeGetStorage();
  const raw = JSON.stringify(value);
  try {
    if (storage) storage.setItem(key, raw);
    else memoryFallback.set(key, raw);
    return true;
  } catch {
    memoryFallback.set(key, raw);
    return false;
  }
}

export function clear(key) {
  const storage = safeGetStorage();
  try {
    if (storage) storage.removeItem(key);
  } catch {
    // ignore
  }
  memoryFallback.delete(key);
}

export const KEYS = {
  empty:   'tecnam.p2006t.empty.v2',    // v2: stores moment_lb_ft instead of arm_ft
  loadout: 'tecnam.p2006t.loadout.v1',  // per-flight loadout (occupants, fuel, baggage, taxi, burnoff)
};
