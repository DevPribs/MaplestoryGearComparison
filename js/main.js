/**
 * MapleStory Gear Comparison - Main Application
 */
(function() {
  let GEAR_DATA = [];
  let COMPARISON_SLOTS = [];
  let selectedSlotId = null;
  let selectedClassId = "all";

  // Slots: overall (one-piece), top (shirt), bottom (pants) are separate; gear.json uses hat, overall, shoes, etc.
  const SLOT_FILTER_OPTIONS = ["hat", "overall", "top", "bottom", "shoes", "gloves", "cape", "shoulder", "weapon", "ring", "pendant"];

  const VALIDATION = {
    stars: { min: 0, max: 30 },
    setPieces: { min: 0, max: 7 },
    flameFlat: { min: 0, max: 9999 },
    flamePercent: { min: 0, max: 100 },
    potentialPercent: { min: 0, max: 100 }
  };

  function clampNumber(n, min, max) {
    const v = Number(n);
    if (!Number.isFinite(v)) return min;
    return Math.min(Math.max(v, min), max);
  }

  /** Max stars: 15 for starforceType "superior" (mechanical), 30 for normal (GMS 30-star). Per-item maxStars overrides. Not tied to set name "Superior Gollux". */
  function getMaxStarsForGear(gear) {
    if (!gear) return VALIDATION.stars.max;
    return gear.maxStars ?? (gear.starforceType === "superior" ? 15 : 30);
  }

  /** Max set pieces based on the gear's set (0 if no set). Uses setEffects.json data. */
  function getMaxSetPiecesForGear(gear) {
    if (!gear || !gear.set) return 0;
    return window.SET_EFFECTS_DATA?.sets?.[gear.set]?.maxPieces ?? 0;
  }

  function gearMatchesSlotFilter(gear, slotFilter) {
    if (!slotFilter || !gear?.slot) return false;
    if (slotFilter === "top") return gear.slot === "top";
    return gear.slot === slotFilter;
  }

  function slotFilterForGear(gear) {
    if (!gear?.slot) return "hat";
    return gear.slot;
  }

  async function loadData() {
    const [gearRes, flamesRes, potentialRes, setEffectsRes, classesRes] = await Promise.all([
      fetch("data/gear.json"),
      fetch("data/flames.json"),
      fetch("data/potential.json"),
      fetch("data/setEffects.json"),
      fetch("data/classes.json").catch(() => null)
    ]);
    GEAR_DATA = (await gearRes.json()).gear || [];
    const flames = await flamesRes.json();
    const potential = await potentialRes.json();
    const setEffects = await setEffectsRes.json();
    let classes = [];
    if (classesRes && classesRes.ok) {
      const parsed = await classesRes.json();
      classes = parsed.classes || [];
    }
    if (classes.length === 0) {
      classes = [{
        id: "all",
        name: "All (show all stats)",
        beneficialStats: UI.STAT_KEYS.slice()
      }];
    }
    window.CLASS_DATA = { classes };
    window.FLAME_DATA = flames;
    window.POTENTIAL_DATA = potential;
    window.SET_EFFECTS_DATA = setEffects;
  }

  function getGearById(id) {
    return GEAR_DATA.find(g => g.id === id);
  }

  function getSelectedClassBeneficialStats() {
    const classes = window.CLASS_DATA?.classes || [];
    const c = classes.find(cl => cl.id === selectedClassId);
    return c?.beneficialStats || UI.STAT_KEYS.slice();
  }

  function getAllowedFlameStatsForClass() {
    const beneficialStats = getSelectedClassBeneficialStats();
    const types = window.FLAME_DATA?.flameTypes || [];
    return types.filter(t => {
      if (t.stat === "allStat") return true;
      if (t.stat === "intLuk") return beneficialStats.includes("int") && beneficialStats.includes("luk");
      return beneficialStats.includes(t.stat);
    }).map(t => t.stat);
  }

  function rerenderAllSlotFlamesAndPots() {
    const container = document.getElementById("comparisons-container");
    if (!container) return;
    container.querySelectorAll(".comparison-slot").forEach(slotEl => {
      const config = getConfigFromSlot(slotEl);
      renderFlameInputs(slotEl, "a");
      renderFlameInputs(slotEl, "b");
      renderPotInputs(slotEl, "a");
      renderPotInputs(slotEl, "b");
      restoreSlotFlameAndPotFromConfig(slotEl, config);
      updateSlotDiff(slotEl.id);
    });
    updateTotalDiff();
  }

  function restoreSlotFlameAndPotFromConfig(slotEl, config) {
    const beneficialStats = getSelectedClassBeneficialStats();
    const allowedFlameStats = getAllowedFlameStatsForClass();
    const allPotLines = [...(window.POTENTIAL_DATA?.weapon?.lines || []), ...(window.POTENTIAL_DATA?.armor?.lines || [])];
    for (const side of ["a", "b"]) {
      const fl = side === "a" ? config.configA?.flameLines : config.configB?.flameLines || [];
      for (let i = 0; i < 4; i++) {
        const statSel = slotEl.querySelector(`.flame-${side}-stat-${i}`);
        const valInp = slotEl.querySelector(`.flame-${side}-val-${i}`);
        if (statSel && valInp && fl[i] && allowedFlameStats.includes(fl[i].stat)) {
          statSel.value = fl[i].stat;
          if (Number.isFinite(fl[i].value)) valInp.value = fl[i].value;
        }
      }
      const pl = side === "a" ? config.configA?.potLines : config.configB?.potLines || [];
      for (let i = 0; i < 3; i++) {
        const lineSel = slotEl.querySelector(`.pot-${side}-line-${i}`);
        const valInp = slotEl.querySelector(`.pot-${side}-val-${i}`);
        if (lineSel && valInp && pl[i]) {
          const lineDef = allPotLines.find(l => l.id === pl[i].lineId);
          if (lineDef && beneficialStats.includes(lineDef.stat)) {
            lineSel.value = pl[i].lineId;
            if (Number.isFinite(pl[i].value)) valInp.value = pl[i].value;
          }
        }
      }
    }
  }

  function onClassChange() {
    rerenderAllSlotFlamesAndPots();
  }

  function getConfigFromSlot(slotEl) {
    const gearA = getGearById(slotEl.querySelector(".gear-a")?.value);
    const gearB = getGearById(slotEl.querySelector(".gear-b")?.value);
    const rawStarsA = parseInt(slotEl.querySelector(".stars-a")?.value, 10);
    const rawStarsB = parseInt(slotEl.querySelector(".stars-b")?.value, 10);
    const rawSetA = parseInt(slotEl.querySelector(".set-a")?.value, 10);
    const rawSetB = parseInt(slotEl.querySelector(".set-b")?.value, 10);
    const configA = {
      stars: clampNumber(rawStarsA, VALIDATION.stars.min, getMaxStarsForGear(gearA)),
      flameLines: parseFlameLines(slotEl, "a"),
      potLines: parsePotLines(slotEl, "a"),
      setPieceCount: clampNumber(rawSetA, VALIDATION.setPieces.min, getMaxSetPiecesForGear(gearA))
    };
    const configB = {
      stars: clampNumber(rawStarsB, VALIDATION.stars.min, getMaxStarsForGear(gearB)),
      flameLines: parseFlameLines(slotEl, "b"),
      potLines: parsePotLines(slotEl, "b"),
      setPieceCount: clampNumber(rawSetB, VALIDATION.setPieces.min, getMaxSetPiecesForGear(gearB))
    };
    return { gearA, gearB, configA, configB };
  }

  function isFlameStatPercent(stat) {
    const type = (window.FLAME_DATA?.flameTypes || []).find(t => t.stat === stat);
    return type?.percent === true;
  }

  function parseFlameLines(slotEl, side) {
    const lines = [];
    for (let i = 0; i < 4; i++) {
      const statSel = slotEl.querySelector(`.flame-${side}-stat-${i}`);
      const valInp = slotEl.querySelector(`.flame-${side}-val-${i}`);
      if (!statSel?.value) continue;
      const raw = valInp?.value !== "" && valInp?.value != null ? parseFloat(valInp.value, 10) : undefined;
      if (raw === undefined || !Number.isFinite(raw)) continue;
      const range = isFlameStatPercent(statSel.value) ? VALIDATION.flamePercent : VALIDATION.flameFlat;
      const value = clampNumber(raw, range.min, range.max);
      lines.push({ stat: statSel.value, value });
    }
    return lines;
  }

  function parsePotLines(slotEl, side) {
    const lines = [];
    for (let i = 0; i < 3; i++) {
      const lineSel = slotEl.querySelector(`.pot-${side}-line-${i}`);
      const valInp = slotEl.querySelector(`.pot-${side}-val-${i}`);
      if (!lineSel?.value) continue;
      const raw = valInp?.value != null && valInp.value !== "" ? parseFloat(valInp.value, 10) : undefined;
      const value = Number.isFinite(raw) ? clampNumber(raw, VALIDATION.potentialPercent.min, VALIDATION.potentialPercent.max) : undefined;
      lines.push({ lineId: lineSel.value, value });
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
    
    const filter = slotFilter || "hat";
    const gearOptions = GEAR_DATA.filter(g => gearMatchesSlotFilter(g, filter))
      .map(g => {
        const imageUrl = GearImageService.getItemImageUrl(g.id);
        return imageUrl ? 
          `<option value="${g.id}">${g.name}</option>` : 
          `<option value="${g.id}">📦 ${g.name}</option>`;
      }).join("");
    
    slotEl.innerHTML = `
      <div class="slot-header">
        <select class="slot-filter" data-slot-id="${id}">
          ${SLOT_FILTER_OPTIONS.map(s =>
            `<option value="${s}" ${s === filter ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <button class="btn-remove-slot" data-slot-id="${id}">Remove</button>
      </div>
      <div class="slot-body">
        <div class="gear-col">
          <label>Gear A</label>
          <select class="gear-select gear-a" data-slot-id="${id}"><option value="">-- Select --</option>${gearOptions}</select>
          <label>Stars</label><input type="number" class="stars-a" min="0" max="30" value="17">
          <label>Set pieces</label><input type="number" class="set-a" min="0" max="7" value="0">
          <div class="flames-a"></div>
          <div class="pot-a"></div>
        </div>
        <div class="gear-col">
          <label>Gear B</label>
          <select class="gear-select gear-b" data-slot-id="${id}"><option value="">-- Select --</option>${gearOptions}</select>
          <label>Stars</label><input type="number" class="stars-b" min="0" max="30" value="17">
          <label>Set pieces</label><input type="number" class="set-b" min="0" max="7" value="0">
          <div class="flames-b"></div>
          <div class="pot-b"></div>
        </div>
        <div class="diff-col">
          <label>Difference (B − A)</label>
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
    const allowedStats = getAllowedFlameStatsForClass();
    const filtered = selectedClassId === "all" ? types : types.filter(t => allowedStats.includes(t.stat));
    const opts = filtered.map(t => `<option value="${t.stat}">${t.name}</option>`).join("");
    for (let i = 0; i < 4; i++) {
      html += `<div class="flame-row">
        <select class="flame-${side}-stat-${i}"><option value="">--</option>${opts}</select>
        <input type="number" class="flame-${side}-val-${i}" placeholder="0" min="0" max="9999" step="1" title="Flame stat value">
      </div>`;
    }
    container.innerHTML = html;
  }

  function renderPotInputs(slotEl, side) {
    const container = slotEl.querySelector(`.pot-${side}`);
    if (!container || !window.POTENTIAL_DATA) return;
    const weaponLines = window.POTENTIAL_DATA.weapon?.lines || [];
    const armorLines = window.POTENTIAL_DATA.armor?.lines || [];
    let lines = [...weaponLines, ...armorLines];
    if (selectedClassId !== "all") {
      const beneficialStats = getSelectedClassBeneficialStats();
      lines = lines.filter(l => beneficialStats.includes(l.stat));
    }
    let html = "<label>Potential</label>";
    for (let i = 0; i < 3; i++) {
      const opts = lines.map(l => `<option value="${l.id}">${l.name}</option>`).join("");
      html += `<div class="pot-row">
        <select class="pot-${side}-line-${i}"><option value="">--</option>${opts}</select>
        <input type="number" class="pot-${side}-val-${i}" placeholder="0" min="0" max="100" step="0.1" title="Potential % value">
      </div>`;
    }
    container.innerHTML = html;
  }

  /** Clamp all numeric inputs in a slot to valid ranges and update the DOM; then refresh diff. */
  function clampSlotInputs(slotEl) {
    const gearA = getGearById(slotEl.querySelector(".gear-a")?.value);
    const gearB = getGearById(slotEl.querySelector(".gear-b")?.value);

    const starsAInp = slotEl.querySelector(".stars-a");
    const starsBInp = slotEl.querySelector(".stars-b");
    if (starsAInp) {
      starsAInp.value = String(clampNumber(parseInt(starsAInp.value, 10), VALIDATION.stars.min, getMaxStarsForGear(gearA)));
    }
    if (starsBInp) {
      starsBInp.value = String(clampNumber(parseInt(starsBInp.value, 10), VALIDATION.stars.min, getMaxStarsForGear(gearB)));
    }

    const setAInp = slotEl.querySelector(".set-a");
    const setBInp = slotEl.querySelector(".set-b");
    if (setAInp) setAInp.value = String(clampNumber(parseInt(setAInp.value, 10), VALIDATION.setPieces.min, getMaxSetPiecesForGear(gearA)));
    if (setBInp) setBInp.value = String(clampNumber(parseInt(setBInp.value, 10), VALIDATION.setPieces.min, getMaxSetPiecesForGear(gearB)));

    for (const side of ["a", "b"]) {
      for (let i = 0; i < 4; i++) {
        const statSel = slotEl.querySelector(`.flame-${side}-stat-${i}`);
        const valInp = slotEl.querySelector(`.flame-${side}-val-${i}`);
        if (!statSel || !valInp || valInp.value === "") continue;
        const raw = parseFloat(valInp.value, 10);
        if (!Number.isFinite(raw)) continue;
        const range = isFlameStatPercent(statSel.value) ? VALIDATION.flamePercent : VALIDATION.flameFlat;
        valInp.value = String(clampNumber(raw, range.min, range.max));
      }
      for (let i = 0; i < 3; i++) {
        const valInp = slotEl.querySelector(`.pot-${side}-val-${i}`);
        if (!valInp || valInp.value === "") continue;
        const raw = parseFloat(valInp.value, 10);
        if (!Number.isFinite(raw)) continue;
        valInp.value = String(clampNumber(raw, VALIDATION.potentialPercent.min, VALIDATION.potentialPercent.max));
      }
    }

    updateSlotDiff(slotEl.id);
  }

  function bindSlotEvents(slotEl) {
    const sid = slotEl.id;
    const update = () => updateSlotDiff(sid);

    slotEl.addEventListener("change", (e) => {
      update();
      if (e.target.classList.contains("gear-a") || e.target.classList.contains("gear-b")) {
        clampSlotInputs(slotEl);
      }
    });
    slotEl.addEventListener("input", () => update());

    slotEl.addEventListener("blur", (e) => {
      const t = e.target;
      if (t.matches(".stars-a, .stars-b, .set-a, .set-b") || t.matches("[class*='flame-'][class*='-val-']") || t.matches("[class*='pot-'][class*='-val-']")) {
        clampSlotInputs(slotEl);
      }
    }, true);

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
      const opts = GEAR_DATA.filter(g => gearMatchesSlotFilter(g, filter)).map(g => `<option value="${g.id}">${g.name}</option>`).join("");
      slotEl.querySelectorAll(".gear-select").forEach(sel => {
        const v = sel.value;
        sel.innerHTML = "<option value=\"\">-- Select --</option>" + opts;
        const gear = GEAR_DATA.find(g => gearMatchesSlotFilter(g, filter) && g.id === v);
        if (gear) sel.value = gear.id;
      });
      update();
    });
  }

  /** Sync star inputs to each piece's max (same logic as getMaxStarsForGear). */
  function syncStarInputsForGear(slotEl, gearA, gearB) {
    for (const { gear, side } of [{ gear: gearA, side: "a" }, { gear: gearB, side: "b" }]) {
      const starsInp = slotEl.querySelector(`.stars-${side}`);
      if (!starsInp) continue;
      const maxStars = getMaxStarsForGear(gear);
      starsInp.max = maxStars;
      const val = parseInt(starsInp.value, 10) || 0;
      if (val > maxStars) starsInp.value = maxStars;
    }
  }

  /** Sync set inputs to each gear's set max (0 if no set, 3-7 depending on set). */
  function syncSetInputsForGear(slotEl, gearA, gearB) {
    for (const { gear, side } of [{ gear: gearA, side: "a" }, { gear: gearB, side: "b" }]) {
      const setInp = slotEl.querySelector(`.set-${side}`);
      if (!setInp) continue;
      const maxSetPieces = getMaxSetPiecesForGear(gear);
      setInp.max = maxSetPieces;
      const val = parseInt(setInp.value, 10) || 0;
      if (val > maxSetPieces) setInp.value = maxSetPieces;
    }
  }

  function updateSlotDiff(slotId) {
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;
    const { gearA, gearB, configA, configB } = getConfigFromSlot(slotEl);
    slotEl.dataset.gearA = gearA?.id || "";
    slotEl.dataset.gearB = gearB?.id || "";
    syncStarInputsForGear(slotEl, gearA, gearB);
    syncSetInputsForGear(slotEl, gearA, gearB);

    const empty = { statDiff: { ...Calculator.EMPTY_STATS }, potentialDiff: { ...Calculator.EMPTY_STATS } };
    const result = gearA && gearB
      ? Calculator.calculateDifference(gearA, configA, gearB, configB, { setEffects: window.SET_EFFECTS_DATA })
      : empty;
    
    const statKeys = getSelectedClassBeneficialStats();
    const diffEl = document.getElementById("diff-" + slotId);
    if (diffEl) {
      const mainHtml = UI.renderStatDiffHtml(result.statDiff, { statKeys });
      const potentialHtml = UI.renderStatDiffHtml(result.potentialDiff, { onlyNonZero: true, statKeys, valueSuffix: "%" });
      if (!mainHtml && !potentialHtml) {
        diffEl.innerHTML = "<span class=\"muted\">No difference</span>";
      } else {
        const mainBlock = mainHtml ? `<div class="diff-main-badges">${mainHtml}</div>` : "";
        const potentialBlock = potentialHtml ? `<div class="diff-potential-badges">${potentialHtml}</div>` : "";
        diffEl.innerHTML = mainBlock + potentialBlock;
      }
    }
    updateTotalDiff();
  }

  function updateTotalDiff() {
    const container = document.getElementById("comparisons-container");
    if (!container) return;
    const results = [];
    container.querySelectorAll(".comparison-slot").forEach(slotEl => {
      const { gearA, gearB, configA, configB } = getConfigFromSlot(slotEl);
      if (gearA && gearB) {
        results.push(Calculator.calculateDifference(gearA, configA, gearB, configB, { setEffects: window.SET_EFFECTS_DATA }));
      }
    });
    const total = Calculator.sumDifferenceResults(results);
    const statKeys = getSelectedClassBeneficialStats();
    const mainHtml = UI.renderStatDiffHtml(total.statDiff, { statKeys });
    const potentialHtml = UI.renderStatDiffHtml(total.potentialDiff, { onlyNonZero: true, statKeys, valueSuffix: "%" });
    const totalEl = document.getElementById("total-diff");
    if (totalEl) {
      if (!mainHtml && !potentialHtml) {
        totalEl.innerHTML = "<span class=\"muted\">No difference</span>";
      } else {
        const mainBlock = mainHtml ? `<div class="diff-main-badges">${mainHtml}</div>` : "";
        const potentialBlock = potentialHtml ? `<div class="diff-potential-badges">${potentialHtml}</div>` : "";
        totalEl.innerHTML = mainBlock + potentialBlock;
      }
    }
  }

  function addComparisonSlot(slotFilter) {
    const container = document.getElementById("comparisons-container");
    if (!container) return;
    const el = createComparisonSlot(slotFilter);
    container.appendChild(el);
  }

  let pendingLoadItem = null;

  function startPendingLoad(inventoryId) {
    const item = Inventory.load(inventoryId);
    if (!item) return;
    
    // Clear existing pending state
    clearPendingLoad();
    
    // Set new pending state
    pendingLoadItem = inventoryId;
    
    // Highlight inventory item
    const itemEl = document.querySelector(`[data-id="${inventoryId}"]`);
    itemEl.classList.add('pending-load');
    const loadBtn = itemEl.querySelector('.btn-load');
    loadBtn.textContent = 'Loading...';
    loadBtn.classList.add('pending');
    
    // Highlight all gear columns
    document.querySelectorAll('.gear-col').forEach(col => {
      col.classList.add('load-ready');
    });
    
    // Add click listeners to gear blocks (entire gear columns)
    document.querySelectorAll('.gear-col').forEach(col => {
      col.addEventListener('click', handleGearSlotClick);
    });
    
    // Add cancel instructions
    showCancelInstructions();
  }

  function handleGearSlotClick(e) {
    if (!pendingLoadItem) return;
    
    e.stopPropagation();
    const gearCol = e.currentTarget;
    const slotEl = gearCol.closest('.comparison-slot');
    
    // Determine side by checking for gear-a or gear-b select within this column
    const side = gearCol.querySelector('.gear-a') ? 'a' : 'b';
    
    loadInventoryToSlot(pendingLoadItem, side, slotEl.id);
    clearPendingLoad();
  }

  function clearPendingLoad() {
    if (!pendingLoadItem) return;
    
    // Clear inventory highlighting
    const itemEl = document.querySelector(`[data-id="${pendingLoadItem}"]`);
    if (itemEl) {
      itemEl.classList.remove('pending-load');
      const loadBtn = itemEl.querySelector('.btn-load');
      loadBtn.textContent = 'Load';
      loadBtn.classList.remove('pending');
    }
    
    // Clear slot highlighting
    document.querySelectorAll('.gear-col').forEach(col => {
      col.classList.remove('load-ready');
      col.removeEventListener('click', handleGearSlotClick);
    });
    
    // Hide cancel instructions
    hideCancelInstructions();
    
    pendingLoadItem = null;
  }

  function showCancelInstructions() {
    const container = document.querySelector('.inventory-panel');
    if (!container || document.querySelector('.cancel-instructions')) return;
    
    const instructions = document.createElement('div');
    instructions.className = 'cancel-instructions';
    instructions.innerHTML = `
      <div class="cancel-content">
        <p><strong>Loading Mode Active</strong></p>
        <p>Click any Gear A or Gear B slot to load the item, or press ESC to cancel.</p>
        <button class="btn btn-secondary">Cancel Loading</button>
      </div>
    `;
    container.appendChild(instructions);
    
    // Add click listener to cancel button
    instructions.querySelector('.btn-secondary').addEventListener('click', clearPendingLoad);
  }

  function hideCancelInstructions() {
    const instructions = document.querySelector('.cancel-instructions');
    if (instructions) instructions.remove();
  }

  function renderInventory() {
    const list = document.getElementById("inventory-list");
    if (!list) return;
    const items = Inventory.loadAll();
    list.innerHTML = items.map(item => {
      const gear = getGearById(item.gearId);
      const imageUrl = GearImageService.getItemImageUrlWithFallback(gear?.id, item.name);
      
      return `
      <div class="inventory-item" data-id="${item.id}">
        <div class="inv-image-container">
          ${imageUrl ? 
            `<img src="${imageUrl}" alt="${item.name}" class="inv-gear-image">` :
            `<div class="inv-image-fallback">📦</div>`
          }
          <div class="inv-overlay">
            <div class="overlay-stars">${item.config?.stars || 0}</div>
            <div class="overlay-set">${item.config?.setPieceCount || 0}</div>
          </div>
        </div>
        <div class="inv-info">
          <span class="inv-name">${item.name}</span>
          <div class="inv-details">
            <small>${gear?.set ? `${gear.set} Set` : 'No Set'}</small>
          </div>
        </div>
        <div class="inv-actions">
          <button class="btn btn-primary btn-load" data-id="${item.id}">
            Load
          </button>
          <button class="btn-delete" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `;
    }).join("") || "<p class=\"muted\">No saved gear</p>";
    
    // Add event listeners for inventory items
    list.querySelectorAll(".btn-load").forEach(btn => {
      btn.addEventListener("click", () => {
        startPendingLoad(btn.dataset.id);
      });
    });
    
    list.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        Inventory.remove(btn.dataset.id);
        renderInventory();
      });
    });
  }

  function loadInventoryToSlot(invId, side, targetSlotId = null) {
    const item = Inventory.load(invId);
    if (!item) return;
    const gear = getGearById(item.gearId);
    if (!gear) return;
    
    // Use specified slot or fall back to current behavior
    const slotId = targetSlotId || selectedSlotId || document.querySelector(".comparison-slot")?.id;
    if (!slotId) return;
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;
    const filter = slotFilterForGear(gear);
    slotEl.dataset.slotFilter = filter;
    const filterSel = slotEl.querySelector(".slot-filter");
    if (filterSel) filterSel.value = filter;
    // Preserve the other side's selection before rebuilding both dropdowns
    const otherSide = side === "a" ? "b" : "a";
    const otherSel = slotEl.querySelector(`.gear-${otherSide}`);
    const otherValue = otherSel?.value || "";
    const opts = GEAR_DATA.filter(g => gearMatchesSlotFilter(g, filter)).map(g => `<option value="${g.id}">${g.name}</option>`).join("");
    slotEl.querySelectorAll(".gear-select").forEach(s => {
      s.innerHTML = "<option value=\"\">-- Select --</option>" + opts;
    });
    const sel = slotEl.querySelector(`.gear-${side}`);
    const starsInp = slotEl.querySelector(`.stars-${side}`);
    const setInp = slotEl.querySelector(`.set-${side}`);
    if (sel) sel.value = item.gearId;
    // Restore other side's selection if it's still valid for this filter
    if (otherSel && otherValue) {
      const otherGear = getGearById(otherValue);
      if (otherGear && gearMatchesSlotFilter(otherGear, filter)) otherSel.value = otherValue;
    }
    if (starsInp) starsInp.value = item.config?.stars ?? 0;
    if (setInp) {
      setInp.value = item.config?.setPieceCount ?? 0;
      const maxSetPieces = getMaxSetPiecesForGear(gear);
      if (parseInt(setInp.value, 10) > maxSetPieces) {
        setInp.value = maxSetPieces;
      }
    }
    const allowedFlameStats = getAllowedFlameStatsForClass();
    const beneficialStats = getSelectedClassBeneficialStats();
    const allPotLines = [...(window.POTENTIAL_DATA?.weapon?.lines || []), ...(window.POTENTIAL_DATA?.armor?.lines || [])];
    const fl = item.config?.flameLines || [];
    for (let i = 0; i < 4; i++) {
      const statSel = slotEl.querySelector(`.flame-${side}-stat-${i}`);
      const valInp = slotEl.querySelector(`.flame-${side}-val-${i}`);
      if (statSel && valInp && fl[i] && allowedFlameStats.includes(fl[i].stat)) {
        statSel.value = fl[i].stat || "";
        if (fl[i].value != null && Number.isFinite(fl[i].value)) valInp.value = fl[i].value;
      }
    }
    const pl = item.config?.potLines || [];
    for (let i = 0; i < 3; i++) {
      const lineSel = slotEl.querySelector(`.pot-${side}-line-${i}`);
      const valInp = slotEl.querySelector(`.pot-${side}-val-${i}`);
      if (lineSel && valInp && pl[i]) {
        const lineDef = allPotLines.find(l => l.id === pl[i].lineId);
        if (lineDef && beneficialStats.includes(lineDef.stat)) {
          lineSel.value = pl[i].lineId || "";
          if (pl[i].value != null && Number.isFinite(pl[i].value)) valInp.value = pl[i].value;
        }
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
      const classSelect = document.getElementById("class-select");
      if (classSelect && window.CLASS_DATA?.classes?.length) {
        const saved = localStorage.getItem("maplestory_gear_class");
        if (saved && window.CLASS_DATA.classes.some(c => c.id === saved)) selectedClassId = saved;
        classSelect.innerHTML = window.CLASS_DATA.classes.map(c =>
          `<option value="${c.id}" ${c.id === selectedClassId ? "selected" : ""}>${c.name}</option>`
        ).join("");
        classSelect.addEventListener("change", (e) => {
          selectedClassId = e.target.value;
          localStorage.setItem("maplestory_gear_class", selectedClassId);
          onClassChange();
        });
      }
      renderInventory();
      
      document.getElementById("add-comparison")?.addEventListener("click", () => addComparisonSlot("hat"));
      document.getElementById("save-gear")?.addEventListener("click", saveCurrentToInventory);
      
      document.querySelectorAll(".comparison-slot").forEach(slotEl => {
        slotEl.addEventListener("click", () => { selectedSlotId = slotEl.id; });
      });
      
      // ESC key support for canceling pending load
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && pendingLoadItem) {
          clearPendingLoad();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
