/**
 * MapleStory Gear Comparison - Main Application
 */
(function() {
  let GEAR_DATA = [];
  let COMPARISON_SLOTS = [];
  let selectedSlotId = null;

  async function loadData() {
    const [gearRes, flamesRes, potentialRes, setEffectsRes] = await Promise.all([
      fetch("data/gear.json"),
      fetch("data/flames.json"),
      fetch("data/potential.json"),
      fetch("data/setEffects.json")
    ]);
    GEAR_DATA = (await gearRes.json()).gear || [];
    const flames = await flamesRes.json();
    const potential = await potentialRes.json();
    const setEffects = await setEffectsRes.json();
    
    window.FLAME_DATA = flames;
    window.POTENTIAL_DATA = potential;
    window.SET_EFFECTS_DATA = setEffects;
  }

  function getGearById(id) {
    return GEAR_DATA.find(g => g.id === id);
  }

  function getConfigFromSlot(slotEl) {
    const gearA = getGearById(slotEl.querySelector(".gear-a")?.value);
    const gearB = getGearById(slotEl.querySelector(".gear-b")?.value);
    const configA = {
      stars: (parseInt(slotEl.querySelector(".stars-a")?.value, 10) || 0),
      flameLines: parseFlameLines(slotEl, "a"),
      potLines: parsePotLines(slotEl, "a"),
      setPieceCount: (parseInt(slotEl.querySelector(".set-a")?.value, 10) || 0)
    };
    const configB = {
      stars: (parseInt(slotEl.querySelector(".stars-b")?.value, 10) || 0),
      flameLines: parseFlameLines(slotEl, "b"),
      potLines: parsePotLines(slotEl, "b"),
      setPieceCount: (parseInt(slotEl.querySelector(".set-b")?.value, 10) || 0)
    };
    return { gearA, gearB, configA, configB };
  }

  function parseFlameLines(slotEl, side) {
    const lines = [];
    for (let i = 0; i < 4; i++) {
      const statSel = slotEl.querySelector(`.flame-${side}-stat-${i}`);
      const tierSel = slotEl.querySelector(`.flame-${side}-tier-${i}`);
      if (!statSel?.value || !tierSel?.value) continue;
      const tier = parseInt(tierSel.value, 10);
      if (Number.isNaN(tier) || tier < 1 || tier > 7) continue;
      lines.push({ stat: statSel.value, tier });
    }
    return lines;
  }

  function parsePotLines(slotEl, side) {
    const lines = [];
    for (let i = 0; i < 3; i++) {
      const lineSel = slotEl.querySelector(`.pot-${side}-line-${i}`);
      const rankSel = slotEl.querySelector(`.pot-${side}-rank-${i}`);
      const valInp = slotEl.querySelector(`.pot-${side}-val-${i}`);
      if (lineSel?.value) {
        lines.push({ lineId: lineSel.value, rank: rankSel?.value || "unique", value: parseFloat(valInp?.value) || undefined });
      }
    }
    return lines;
  }

  function createComparisonSlot(slotFilter) {
    const id = "slot_" + Date.now();
    const slotEl = document.createElement("div");
    slotEl.className = "comparison-slot";
    slotEl.id = id;
    slotEl.dataset.slotFilter = slotFilter || "hat";
    slotEl.dataset.gearA = "";
    slotEl.dataset.gearB = "";
    
    const gearOptions = GEAR_DATA.filter(g => g.slot === (slotFilter || "hat"))
      .map(g => `<option value="${g.id}">${g.name}</option>`).join("");
    
    slotEl.innerHTML = `
      <div class="slot-header">
        <select class="slot-filter" data-slot-id="${id}">
          ${["hat","overall","shoes","gloves","cape","shoulder","weapon","ring","pendant"].map(s => 
            `<option value="${s}" ${s === (slotFilter||"hat") ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <button class="btn-remove-slot" data-slot-id="${id}">Remove</button>
      </div>
      <div class="slot-body">
        <div class="gear-col">
          <label>Gear A</label>
          <select class="gear-select gear-a" data-slot-id="${id}"><option value="">-- Select --</option>${gearOptions}</select>
          <label>Stars</label><input type="number" class="stars-a" min="0" max="25" value="17">
          <label>Set pieces</label><input type="number" class="set-a" min="0" max="7" value="7">
          <div class="flames-a"></div>
          <div class="pot-a"></div>
        </div>
        <div class="gear-col">
          <label>Gear B</label>
          <select class="gear-select gear-b" data-slot-id="${id}"><option value="">-- Select --</option>${gearOptions}</select>
          <label>Stars</label><input type="number" class="stars-b" min="0" max="25" value="17">
          <label>Set pieces</label><input type="number" class="set-b" min="0" max="7" value="7">
          <div class="flames-b"></div>
          <div class="pot-b"></div>
        </div>
        <div class="diff-col">
          <label>Difference (B - A)</label>
          <div id="diff-${id}" class="stat-diff"></div>
        </div>
      </div>
    `;
    
    renderFlameInputs(slotEl, "a");
    renderFlameInputs(slotEl, "b");
    renderPotInputs(slotEl, "a");
    renderPotInputs(slotEl, "b");
    
    bindSlotEvents(slotEl);
    return slotEl;
  }

  function renderFlameInputs(slotEl, side) {
    const container = slotEl.querySelector(`.flames-${side}`);
    if (!container || !window.FLAME_DATA) return;
    let html = "<label>Flames</label>";
    const types = window.FLAME_DATA.flameTypes || [];
    const opts = types.map(t => `<option value="${t.stat}">${t.name}</option>`).join("");
    for (let i = 0; i < 4; i++) {
      html += `<div class="flame-row">
        <select class="flame-${side}-stat-${i}"><option value="">--</option>${opts}</select>
        <select class="flame-${side}-tier-${i}"><option value="">--</option>${[1,2,3,4,5,6,7].map(t=>`<option value="${t}">T${t}</option>`).join("")}</select>
      </div>`;
    }
    container.innerHTML = html;
  }

  function renderPotInputs(slotEl, side) {
    const container = slotEl.querySelector(`.pot-${side}`);
    if (!container || !window.POTENTIAL_DATA) return;
    const weaponLines = window.POTENTIAL_DATA.weapon?.lines || [];
    const armorLines = window.POTENTIAL_DATA.armor?.lines || [];
    const lines = [...weaponLines, ...armorLines];
    let html = "<label>Potential</label>";
    for (let i = 0; i < 3; i++) {
      const opts = lines.map(l => `<option value="${l.id}">${l.name}</option>`).join("");
      html += `<div class="pot-row">
        <select class="pot-${side}-line-${i}"><option value="">--</option>${opts}</select>
        <select class="pot-${side}-rank-${i}"><option value="rare">Rare</option><option value="epic">Epic</option><option value="unique" selected>Unique</option><option value="legendary">Leg</option></select>
        <input type="number" class="pot-${side}-val-${i}" placeholder="value" min="0" step="1">
      </div>`;
    }
    container.innerHTML = html;
  }

  function bindSlotEvents(slotEl) {
    const sid = slotEl.id;
    const update = () => updateSlotDiff(sid);
    
    slotEl.querySelectorAll(".gear-select, .stars-a, .stars-b, .set-a, .set-b").forEach(el => el.addEventListener("change", update));
    slotEl.querySelectorAll(".flames-a select, .flames-b select, .pot-a select, .pot-b select").forEach(el => el.addEventListener("change", update));
    slotEl.querySelectorAll("input").forEach(el => el.addEventListener("input", update));
    
    slotEl.querySelector(".btn-remove-slot")?.addEventListener("click", () => {
      const parent = document.getElementById("comparisons-container");
      if (parent && parent.children.length > 1) {
        slotEl.remove();
        updateTotalDiff();
      }
    });
    
    slotEl.querySelector(".slot-filter")?.addEventListener("change", (e) => {
      const filter = e.target.value;
      slotEl.dataset.slotFilter = filter;
      const opts = GEAR_DATA.filter(g => g.slot === filter).map(g => `<option value="${g.id}">${g.name}</option>`).join("");
      slotEl.querySelectorAll(".gear-select").forEach(sel => {
        const v = sel.value;
        sel.innerHTML = "<option value=\"\">-- Select --</option>" + opts;
        const gear = GEAR_DATA.find(g => g.slot === filter && g.id === v);
        if (gear) sel.value = gear.id;
      });
      update();
    });
  }

  function updateSlotDiff(slotId) {
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;
    const { gearA, gearB, configA, configB } = getConfigFromSlot(slotEl);
    slotEl.dataset.gearA = gearA?.id || "";
    slotEl.dataset.gearB = gearB?.id || "";
    
    const diff = gearA && gearB ? Calculator.calculateDifference(
      gearA, configA, gearB, configB, { setEffects: window.SET_EFFECTS_DATA }
    ) : Calculator.EMPTY_STATS;
    
    UI.renderStatDiff(diff, "diff-" + slotId);
    updateTotalDiff();
  }

  function updateTotalDiff() {
    const container = document.getElementById("comparisons-container");
    if (!container) return;
    const diffs = [];
    container.querySelectorAll(".comparison-slot").forEach(slotEl => {
      const { gearA, gearB, configA, configB } = getConfigFromSlot(slotEl);
      if (gearA && gearB) {
        diffs.push(Calculator.calculateDifference(gearA, configA, gearB, configB, { setEffects: window.SET_EFFECTS_DATA }));
      }
    });
    const total = Calculator.sumStats(diffs);
    UI.renderStatDiff(total, "total-diff");
  }

  function addComparisonSlot(slotFilter) {
    const container = document.getElementById("comparisons-container");
    if (!container) return;
    const el = createComparisonSlot(slotFilter);
    container.appendChild(el);
  }

  function renderInventory() {
    const list = document.getElementById("inventory-list");
    if (!list) return;
    const items = Inventory.loadAll();
    list.innerHTML = items.map(item => `
      <div class="inventory-item" data-id="${item.id}">
        <span class="inv-name">${item.name}</span>
        <div class="inv-actions">
          <button class="btn-load-a" data-id="${item.id}">Load A</button>
          <button class="btn-load-b" data-id="${item.id}">Load B</button>
          <button class="btn-delete" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `).join("") || "<p class=\"muted\">No saved gear</p>";
    
    list.querySelectorAll(".btn-load-a").forEach(btn => {
      btn.addEventListener("click", () => loadInventoryToSlot(btn.dataset.id, "a"));
    });
    list.querySelectorAll(".btn-load-b").forEach(btn => {
      btn.addEventListener("click", () => loadInventoryToSlot(btn.dataset.id, "b"));
    });
    list.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        Inventory.remove(btn.dataset.id);
        renderInventory();
      });
    });
  }

  function loadInventoryToSlot(invId, side) {
    const item = Inventory.load(invId);
    if (!item) return;
    const gear = getGearById(item.gearId);
    if (!gear) return;
    const slotId = selectedSlotId || document.querySelector(".comparison-slot")?.id;
    if (!slotId) return;
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;
    slotEl.dataset.slotFilter = gear.slot;
    const filterSel = slotEl.querySelector(".slot-filter");
    if (filterSel) filterSel.value = gear.slot;
    const opts = GEAR_DATA.filter(g => g.slot === gear.slot).map(g => `<option value="${g.id}">${g.name}</option>`).join("");
    slotEl.querySelectorAll(".gear-select").forEach(s => {
      s.innerHTML = "<option value=\"\">-- Select --</option>" + opts;
    });
    const sel = slotEl.querySelector(`.gear-${side}`);
    const starsInp = slotEl.querySelector(`.stars-${side}`);
    const setInp = slotEl.querySelector(`.set-${side}`);
    if (sel) sel.value = item.gearId;
    if (starsInp) starsInp.value = item.config?.stars ?? 0;
    if (setInp) setInp.value = item.config?.setPieceCount ?? 0;
    const fl = item.config?.flameLines || [];
    for (let i = 0; i < 4; i++) {
      const statSel = slotEl.querySelector(`.flame-${side}-stat-${i}`);
      const tierSel = slotEl.querySelector(`.flame-${side}-tier-${i}`);
      if (statSel && tierSel && fl[i]) {
        statSel.value = fl[i].stat || "";
        tierSel.value = String(fl[i].tier || "");
      }
    }
    const pl = item.config?.potLines || [];
    for (let i = 0; i < 3; i++) {
      const lineSel = slotEl.querySelector(`.pot-${side}-line-${i}`);
      const rankSel = slotEl.querySelector(`.pot-${side}-rank-${i}`);
      const valInp = slotEl.querySelector(`.pot-${side}-val-${i}`);
      if (lineSel && pl[i]) {
        lineSel.value = pl[i].lineId || "";
        if (rankSel) rankSel.value = pl[i].rank || "unique";
        if (valInp && pl[i].value != null) valInp.value = pl[i].value;
      }
    }
    updateSlotDiff(slotId);
  }

  function saveCurrentToInventory() {
    const name = prompt("Name for this gear:");
    if (!name) return;
    const slotId = selectedSlotId || document.querySelector(".comparison-slot")?.id;
    if (!slotId) return;
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;
    
    const side = document.querySelector("input[name='save-side']:checked")?.value || "a";
    const gear = getGearById(slotEl.querySelector(`.gear-${side}`)?.value);
    if (!gear) { alert("Select a gear first"); return; }
    
    const config = side === "a" ? getConfigFromSlot(slotEl).configA : getConfigFromSlot(slotEl).configB;
    Inventory.save(name, { gearId: gear.id, ...config });
    renderInventory();
  }

  function init() {
    loadData().then(() => {
      const container = document.getElementById("comparisons-container");
      if (container && container.children.length === 0) {
        addComparisonSlot("hat");
      }
      renderInventory();
      
      document.getElementById("add-comparison")?.addEventListener("click", () => addComparisonSlot("hat"));
      document.getElementById("save-gear")?.addEventListener("click", saveCurrentToInventory);
      
      document.querySelectorAll(".comparison-slot").forEach(slotEl => {
        slotEl.addEventListener("click", () => { selectedSlotId = slotEl.id; });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
