/**
 * Crafted Gear Inventory - Save/Load/Delete via localStorage
 */
const Inventory = (function() {
  const STORAGE_KEY = "maplestory_gear_inventory";

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAll(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items || []));
      return true;
    } catch (e) {
      return false;
    }
  }

  function save(name, gearConfig) {
    const items = loadAll();
    const id = "id_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const entry = {
      id,
      name: name || "Unnamed Gear",
      gearId: gearConfig.gearId,
      config: {
        stars: gearConfig.stars ?? 0,
        flameLines: gearConfig.flameLines ?? [],
        potLines: gearConfig.potLines ?? [],
        setPieceCount: gearConfig.setPieceCount ?? 0
      },
      savedAt: new Date().toISOString()
    };
    items.push(entry);
    saveAll(items);
    return entry;
  }

  function load(id) {
    const items = loadAll();
    return items.find(i => i.id === id);
  }

  function remove(id) {
    const items = loadAll().filter(i => i.id !== id);
    saveAll(items);
    return true;
  }

  function update(id, updates) {
    const items = loadAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates };
    saveAll(items);
    return items[idx];
  }

  return { loadAll, save, load, remove, update };
})();
