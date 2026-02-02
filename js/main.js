/**
 * MapleStory Gear Comparison - Main Application
 */
(function() {
  // ===================
  // State
  // ===================
  let GEAR_DATA = [];
  let selectedSlotId = null;
  let selectedClassId = "all";
  let pendingLoadItem = null;

  // ===================
  // Constants
  // ===================
  const SLOT_OPTIONS = [
    "hat", "overall", "top", "bottom", "shoes", "gloves",
    "cape", "shoulder", "weapon", "ring", "pendant",
    "earrings", "belt", "face", "eye"
  ];

  const VALIDATION = {
    stars: { min: 0, max: 30 },
    setPieces: { min: 0, max: 7 },
    flameFlat: { min: 0, max: 9999 },
    flamePercent: { min: 0, max: 100 },
    potentialPercent: { min: 0, max: 100 }
  };

  // Maps class-select IDs to gear jobClass values
  const CLASS_TO_JOB = {
    "all": null,
    "str-warrior": "warrior",
    "int-magician": "magician",
    "dex-bowman": "bowman",
    "luk-thief": "thief",
    "str-pirate": "pirate",
    "dex-pirate": "pirate",
    "xenon": null,
    "demon-avenger": null
  };

  // ===================
  // Utility Functions
  // ===================
  function clamp(n, min, max) {
    const v = Number(n);
    return Number.isFinite(v) ? Math.min(Math.max(v, min), max) : min;
  }

  function getGearById(id) {
    return GEAR_DATA.find(g => g.id === id);
  }

  function getMaxStars(gear) {
    if (!gear) return VALIDATION.stars.max;
    return gear.maxStars ?? (gear.starforceType === "superior" ? 15 : 30);
  }

  function getMaxSetPieces(gear) {
    if (!gear?.set) return 0;
    return window.SET_EFFECTS_DATA?.sets?.[gear.set]?.maxPieces ?? 0;
  }

  function isFlamePercent(stat) {
    return (window.FLAME_DATA?.flameTypes || []).find(t => t.stat === stat)?.percent === true;
  }

  // ===================
  // Class & Gear Filtering
  // ===================
  function getJobClassForSelectedClass() {
    return CLASS_TO_JOB[selectedClassId] ?? null;
  }

  function gearMatchesClass(gear) {
    const jobClass = getJobClassForSelectedClass();
    if (!jobClass) return true; // "all" or special classes show everything
    return gear.jobClass === jobClass || gear.jobClass === "all";
  }

  function gearMatchesSlot(gear, slot) {
    return gear?.slot === slot;
  }

  function getFilteredGear(slot) {
    return GEAR_DATA.filter(g => gearMatchesSlot(g, slot) && gearMatchesClass(g));
  }

  function getBeneficialStats() {
    const classes = window.CLASS_DATA?.classes || [];
    const c = classes.find(cl => cl.id === selectedClassId);
    return c?.beneficialStats || UI.STAT_KEYS.slice();
  }

  function getAllowedFlameStats() {
    const beneficial = getBeneficialStats();
    const types = window.FLAME_DATA?.flameTypes || [];
    return types.filter(t => {
      if (t.stat === "allStat") return true;
      if (t.stat === "intLuk") return beneficial.includes("int") && beneficial.includes("luk");
      return beneficial.includes(t.stat);
    }).map(t => t.stat);
  }

  // ===================
  // Data Loading
  // ===================
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
    if (classesRes?.ok) {
      classes = (await classesRes.json()).classes || [];
    }
    if (!classes.length) {
      classes = [{ id: "all", name: "All", beneficialStats: UI.STAT_KEYS.slice() }];
    }

    window.CLASS_DATA = { classes };
    window.FLAME_DATA = flames;
    window.POTENTIAL_DATA = potential;
    window.SET_EFFECTS_DATA = setEffects;
  }

  // ===================
  // Slot Configuration Parsing
  // ===================
  function parseFlameLines(slotEl, side) {
    const lines = [];
    for (let i = 0; i < 4; i++) {
      const stat = slotEl.querySelector(`.flame-${side}-stat-${i}`)?.value;
      const rawVal = slotEl.querySelector(`.flame-${side}-val-${i}`)?.value;
      if (!stat || rawVal === "" || rawVal == null) continue;

      const value = parseFloat(rawVal);
      if (!Number.isFinite(value)) continue;

      const range = isFlamePercent(stat) ? VALIDATION.flamePercent : VALIDATION.flameFlat;
      lines.push({ stat, value: clamp(value, range.min, range.max) });
    }
    return lines;
  }

  function parsePotLines(slotEl, side) {
    const lines = [];
    for (let i = 0; i < 3; i++) {
      const lineId = slotEl.querySelector(`.pot-${side}-line-${i}`)?.value;
      const rawVal = slotEl.querySelector(`.pot-${side}-val-${i}`)?.value;
      if (!lineId) continue;

      const value = rawVal != null && rawVal !== "" ? parseFloat(rawVal) : undefined;
      const clampedValue = Number.isFinite(value)
        ? clamp(value, VALIDATION.potentialPercent.min, VALIDATION.potentialPercent.max)
        : undefined;
      lines.push({ lineId, value: clampedValue });
    }
    return lines;
  }

  function getSlotConfig(slotEl) {
    const gearA = getGearById(slotEl.querySelector(".gear-a")?.value);
    const gearB = getGearById(slotEl.querySelector(".gear-b")?.value);

    const starsA = parseInt(slotEl.querySelector(".stars-a")?.value, 10);
    const starsB = parseInt(slotEl.querySelector(".stars-b")?.value, 10);
    const setA = parseInt(slotEl.querySelector(".set-a")?.value, 10);
    const setB = parseInt(slotEl.querySelector(".set-b")?.value, 10);

    return {
      gearA,
      gearB,
      configA: {
        stars: clamp(starsA, VALIDATION.stars.min, getMaxStars(gearA)),
        flameLines: parseFlameLines(slotEl, "a"),
        potLines: parsePotLines(slotEl, "a"),
        setPieceCount: clamp(setA, VALIDATION.setPieces.min, getMaxSetPieces(gearA))
      },
      configB: {
        stars: clamp(starsB, VALIDATION.stars.min, getMaxStars(gearB)),
        flameLines: parseFlameLines(slotEl, "b"),
        potLines: parsePotLines(slotEl, "b"),
        setPieceCount: clamp(setB, VALIDATION.setPieces.min, getMaxSetPieces(gearB))
      }
    };
  }

  // ===================
  // Gear Options Rendering
  // ===================
  function buildGearOptions(slot) {
    const gear = getFilteredGear(slot);
    return gear.map(g => {
      const hasImage = GearImageService.getItemImageUrl(g);
      const prefix = hasImage ? "" : "📦 ";
      return `<option value="${g.id}">${prefix}${g.name}</option>`;
    }).join("");
  }

  function updateGearDropdowns(slotEl) {
    const slot = slotEl.dataset.slotFilter || "hat";
    const options = buildGearOptions(slot);

    slotEl.querySelectorAll(".gear-select").forEach(sel => {
      const currentValue = sel.value;
      sel.innerHTML = `<option value="">-- Select --</option>${options}`;

      // Restore selection if still valid
      const gear = getGearById(currentValue);
      if (gear && gearMatchesSlot(gear, slot) && gearMatchesClass(gear)) {
        sel.value = currentValue;
      }
    });
  }

  function updateAllGearDropdowns() {
    document.querySelectorAll(".comparison-slot").forEach(updateGearDropdowns);
  }

  // ===================
  // Flame & Potential Inputs
  // ===================
  function renderFlameInputs(slotEl, side) {
    const container = slotEl.querySelector(`.flames-${side}`);
    if (!container || !window.FLAME_DATA) return;

    const types = window.FLAME_DATA.flameTypes || [];
    const allowed = getAllowedFlameStats();
    const filtered = selectedClassId === "all" ? types : types.filter(t => allowed.includes(t.stat));
    const options = filtered.map(t => `<option value="${t.stat}">${t.name}</option>`).join("");

    let html = "<label>Flames</label>";
    for (let i = 0; i < 4; i++) {
      html += `
        <div class="flame-row">
          <select class="flame-${side}-stat-${i}"><option value="">--</option>${options}</select>
          <input type="number" class="flame-${side}-val-${i}" placeholder="0" min="0" max="9999" step="1">
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
      const beneficial = getBeneficialStats();
      lines = lines.filter(l => beneficial.includes(l.stat));
    }

    const options = lines.map(l => `<option value="${l.id}">${l.name}</option>`).join("");

    let html = "<label>Potential</label>";
    for (let i = 0; i < 3; i++) {
      html += `
        <div class="pot-row">
          <select class="pot-${side}-line-${i}"><option value="">--</option>${options}</select>
          <input type="number" class="pot-${side}-val-${i}" placeholder="0" min="0" max="100" step="0.1">
        </div>`;
    }
    container.innerHTML = html;
  }

  function rerenderFlamesAndPots(slotEl, savedConfig) {
    renderFlameInputs(slotEl, "a");
    renderFlameInputs(slotEl, "b");
    renderPotInputs(slotEl, "a");
    renderPotInputs(slotEl, "b");

    if (savedConfig) {
      restoreFlamesAndPots(slotEl, savedConfig);
    }
  }

  function restoreFlamesAndPots(slotEl, config) {
    const allowedFlames = getAllowedFlameStats();
    const beneficial = getBeneficialStats();
    const allPotLines = [
      ...(window.POTENTIAL_DATA?.weapon?.lines || []),
      ...(window.POTENTIAL_DATA?.armor?.lines || [])
    ];

    for (const side of ["a", "b"]) {
      const flames = side === "a" ? config.configA?.flameLines : config.configB?.flameLines || [];
      for (let i = 0; i < 4; i++) {
        const statSel = slotEl.querySelector(`.flame-${side}-stat-${i}`);
        const valInp = slotEl.querySelector(`.flame-${side}-val-${i}`);
        if (statSel && valInp && flames[i] && allowedFlames.includes(flames[i].stat)) {
          statSel.value = flames[i].stat;
          if (Number.isFinite(flames[i].value)) valInp.value = flames[i].value;
        }
      }

      const pots = side === "a" ? config.configA?.potLines : config.configB?.potLines || [];
      for (let i = 0; i < 3; i++) {
        const lineSel = slotEl.querySelector(`.pot-${side}-line-${i}`);
        const valInp = slotEl.querySelector(`.pot-${side}-val-${i}`);
        if (lineSel && valInp && pots[i]) {
          const lineDef = allPotLines.find(l => l.id === pots[i].lineId);
          if (lineDef && beneficial.includes(lineDef.stat)) {
            lineSel.value = pots[i].lineId;
            if (Number.isFinite(pots[i].value)) valInp.value = pots[i].value;
          }
        }
      }
    }
  }

  // ===================
  // Input Clamping & Syncing
  // ===================
  function syncInputLimits(slotEl, gearA, gearB) {
    // Sync star inputs
    for (const { gear, side } of [{ gear: gearA, side: "a" }, { gear: gearB, side: "b" }]) {
      const starsInp = slotEl.querySelector(`.stars-${side}`);
      if (starsInp) {
        const max = getMaxStars(gear);
        starsInp.max = max;
        if (parseInt(starsInp.value, 10) > max) starsInp.value = max;
      }

      const setInp = slotEl.querySelector(`.set-${side}`);
      if (setInp) {
        const max = getMaxSetPieces(gear);
        setInp.max = max;
        if (parseInt(setInp.value, 10) > max) setInp.value = max;
      }
    }
  }

  function clampSlotInputs(slotEl) {
    const gearA = getGearById(slotEl.querySelector(".gear-a")?.value);
    const gearB = getGearById(slotEl.querySelector(".gear-b")?.value);

    // Clamp stars
    const starsA = slotEl.querySelector(".stars-a");
    const starsB = slotEl.querySelector(".stars-b");
    if (starsA) starsA.value = clamp(parseInt(starsA.value, 10), VALIDATION.stars.min, getMaxStars(gearA));
    if (starsB) starsB.value = clamp(parseInt(starsB.value, 10), VALIDATION.stars.min, getMaxStars(gearB));

    // Clamp set pieces
    const setA = slotEl.querySelector(".set-a");
    const setB = slotEl.querySelector(".set-b");
    if (setA) setA.value = clamp(parseInt(setA.value, 10), VALIDATION.setPieces.min, getMaxSetPieces(gearA));
    if (setB) setB.value = clamp(parseInt(setB.value, 10), VALIDATION.setPieces.min, getMaxSetPieces(gearB));

    // Clamp flame/pot values
    for (const side of ["a", "b"]) {
      for (let i = 0; i < 4; i++) {
        const stat = slotEl.querySelector(`.flame-${side}-stat-${i}`)?.value;
        const valInp = slotEl.querySelector(`.flame-${side}-val-${i}`);
        if (valInp && valInp.value !== "") {
          const range = isFlamePercent(stat) ? VALIDATION.flamePercent : VALIDATION.flameFlat;
          valInp.value = clamp(parseFloat(valInp.value), range.min, range.max);
        }
      }
      for (let i = 0; i < 3; i++) {
        const valInp = slotEl.querySelector(`.pot-${side}-val-${i}`);
        if (valInp && valInp.value !== "") {
          valInp.value = clamp(parseFloat(valInp.value), VALIDATION.potentialPercent.min, VALIDATION.potentialPercent.max);
        }
      }
    }

    updateSlotDiff(slotEl.id);
  }

  // ===================
  // Diff Calculations
  // ===================
  function updateSlotDiff(slotId) {
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;

    const { gearA, gearB, configA, configB } = getSlotConfig(slotEl);
    slotEl.dataset.gearA = gearA?.id || "";
    slotEl.dataset.gearB = gearB?.id || "";

    syncInputLimits(slotEl, gearA, gearB);

    const empty = {
      statDiff: { ...Calculator.EMPTY_STATS },
      potentialDiff: { ...Calculator.EMPTY_STATS }
    };
    const result = gearA && gearB
      ? Calculator.calculateDifference(gearA, configA, gearB, configB, { setEffects: window.SET_EFFECTS_DATA })
      : empty;

    const statKeys = getBeneficialStats();
    const diffEl = document.getElementById(`diff-${slotId}`);
    if (diffEl) {
      const mainHtml = UI.renderStatDiffHtml(result.statDiff, { statKeys });
      const potHtml = UI.renderStatDiffHtml(result.potentialDiff, { onlyNonZero: true, statKeys, valueSuffix: "%" });

      if (!mainHtml && !potHtml) {
        diffEl.innerHTML = '<span class="muted">No difference</span>';
      } else {
        diffEl.innerHTML =
          (mainHtml ? `<div class="diff-main-badges">${mainHtml}</div>` : "") +
          (potHtml ? `<div class="diff-potential-badges">${potHtml}</div>` : "");
      }
    }

    updateTotalDiff();
  }

  function updateTotalDiff() {
    const container = document.getElementById("comparisons-container");
    if (!container) return;

    const results = [];
    container.querySelectorAll(".comparison-slot").forEach(slotEl => {
      const { gearA, gearB, configA, configB } = getSlotConfig(slotEl);
      if (gearA && gearB) {
        results.push(Calculator.calculateDifference(gearA, configA, gearB, configB, { setEffects: window.SET_EFFECTS_DATA }));
      }
    });

    const total = Calculator.sumDifferenceResults(results);
    const statKeys = getBeneficialStats();
    const mainHtml = UI.renderStatDiffHtml(total.statDiff, { statKeys });
    const potHtml = UI.renderStatDiffHtml(total.potentialDiff, { onlyNonZero: true, statKeys, valueSuffix: "%" });

    const totalEl = document.getElementById("total-diff");
    if (totalEl) {
      if (!mainHtml && !potHtml) {
        totalEl.innerHTML = '<span class="muted">No difference</span>';
      } else {
        totalEl.innerHTML =
          (mainHtml ? `<div class="diff-main-badges">${mainHtml}</div>` : "") +
          (potHtml ? `<div class="diff-potential-badges">${potHtml}</div>` : "");
      }
    }
  }

  // ===================
  // Comparison Slot Creation
  // ===================
  function createComparisonSlot(slotFilter = "hat") {
    const id = `slot_${Date.now()}`;
    const slotEl = document.createElement("div");
    slotEl.className = "comparison-slot";
    slotEl.id = id;
    slotEl.dataset.slotFilter = slotFilter;

    const gearOptions = buildGearOptions(slotFilter);
    const slotOptions = SLOT_OPTIONS.map(s =>
      `<option value="${s}" ${s === slotFilter ? "selected" : ""}>${s}</option>`
    ).join("");

    slotEl.innerHTML = `
      <div class="slot-header">
        <select class="slot-filter" data-slot-id="${id}">${slotOptions}</select>
        <button class="btn-remove-slot" data-slot-id="${id}">Remove</button>
      </div>
      <div class="slot-body">
        <div class="gear-col">
          <label>Gear A</label>
          <select class="gear-select gear-a" data-slot-id="${id}">
            <option value="">-- Select --</option>${gearOptions}
          </select>
          <label>Stars</label>
          <input type="number" class="stars-a" min="0" max="30" value="17">
          <label>Set pieces</label>
          <input type="number" class="set-a" min="0" max="7" value="0">
          <div class="flames-a"></div>
          <div class="pot-a"></div>
        </div>
        <div class="gear-col">
          <label>Gear B</label>
          <select class="gear-select gear-b" data-slot-id="${id}">
            <option value="">-- Select --</option>${gearOptions}
          </select>
          <label>Stars</label>
          <input type="number" class="stars-b" min="0" max="30" value="17">
          <label>Set pieces</label>
          <input type="number" class="set-b" min="0" max="7" value="0">
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

  function bindSlotEvents(slotEl) {
    const update = () => updateSlotDiff(slotEl.id);

    slotEl.addEventListener("change", (e) => {
      update();
      if (e.target.classList.contains("gear-a") || e.target.classList.contains("gear-b")) {
        clampSlotInputs(slotEl);
      }
    });

    slotEl.addEventListener("input", update);

    slotEl.addEventListener("blur", (e) => {
      if (e.target.matches(".stars-a, .stars-b, .set-a, .set-b, [class*='flame-'][class*='-val-'], [class*='pot-'][class*='-val-']")) {
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
      slotEl.dataset.slotFilter = e.target.value;
      updateGearDropdowns(slotEl);
      update();
    });
  }

  function addComparisonSlot(slotFilter) {
    const container = document.getElementById("comparisons-container");
    if (container) {
      container.appendChild(createComparisonSlot(slotFilter));
    }
  }

  // ===================
  // Class Change Handler
  // ===================
  function onClassChange() {
    updateAllGearDropdowns();

    document.querySelectorAll(".comparison-slot").forEach(slotEl => {
      const config = getSlotConfig(slotEl);
      rerenderFlamesAndPots(slotEl, config);
      updateSlotDiff(slotEl.id);
    });

    updateTotalDiff();
  }

  // ===================
  // Inventory - Pending Load System
  // ===================
  function startPendingLoad(inventoryId) {
    const item = Inventory.load(inventoryId);
    if (!item) return;

    clearPendingLoad();
    pendingLoadItem = inventoryId;

    // Highlight inventory item
    const itemEl = document.querySelector(`[data-id="${inventoryId}"]`);
    if (itemEl) {
      itemEl.classList.add("pending-load");
      const loadBtn = itemEl.querySelector(".btn-load");
      if (loadBtn) {
        loadBtn.textContent = "Loading...";
        loadBtn.classList.add("pending");
      }
    }

    // Highlight gear columns
    document.querySelectorAll(".gear-col").forEach(col => {
      col.classList.add("load-ready");
      col.addEventListener("click", handleGearSlotClick);
    });

    showCancelInstructions();
  }

  function handleGearSlotClick(e) {
    if (!pendingLoadItem) return;

    e.stopPropagation();
    const gearCol = e.currentTarget;
    const slotEl = gearCol.closest(".comparison-slot");
    const side = gearCol.querySelector(".gear-a") ? "a" : "b";

    loadInventoryToSlot(pendingLoadItem, side, slotEl.id);
    clearPendingLoad();
  }

  function clearPendingLoad() {
    if (!pendingLoadItem) return;

    const itemEl = document.querySelector(`[data-id="${pendingLoadItem}"]`);
    if (itemEl) {
      itemEl.classList.remove("pending-load");
      const loadBtn = itemEl.querySelector(".btn-load");
      if (loadBtn) {
        loadBtn.textContent = "Load";
        loadBtn.classList.remove("pending");
      }
    }

    document.querySelectorAll(".gear-col").forEach(col => {
      col.classList.remove("load-ready");
      col.removeEventListener("click", handleGearSlotClick);
    });

    hideCancelInstructions();
    pendingLoadItem = null;
  }

  function showCancelInstructions() {
    const container = document.querySelector(".inventory-panel");
    if (!container || document.querySelector(".cancel-instructions")) return;

    const instructions = document.createElement("div");
    instructions.className = "cancel-instructions";
    instructions.innerHTML = `
      <div class="cancel-content">
        <p><strong>Loading Mode Active</strong></p>
        <p>Click any Gear A or Gear B slot to load the item, or press ESC to cancel.</p>
        <button class="btn btn-secondary">Cancel Loading</button>
      </div>
    `;
    container.appendChild(instructions);
    instructions.querySelector(".btn-secondary").addEventListener("click", clearPendingLoad);
  }

  function hideCancelInstructions() {
    document.querySelector(".cancel-instructions")?.remove();
  }

  // ===================
  // Inventory - Load/Save/Render
  // ===================
  function renderInventory() {
    const list = document.getElementById("inventory-list");
    if (!list) return;

    const items = Inventory.loadAll();
    if (!items.length) {
      list.innerHTML = '<p class="muted">No saved gear</p>';
      return;
    }

    list.innerHTML = items.map(item => {
      const gear = getGearById(item.gearId);
      const imageUrl = GearImageService.getItemImageUrlWithFallback(gear, item.name);

      return `
        <div class="inventory-item" data-id="${item.id}">
          <div class="inv-image-container">
            ${imageUrl
              ? `<img src="${imageUrl}" alt="${item.name}" class="inv-gear-image">`
              : '<div class="inv-image-fallback">📦</div>'}
            <div class="inv-overlay">
              <div class="overlay-stars">${item.config?.stars || 0}</div>
              <div class="overlay-set">${item.config?.setPieceCount || 0}</div>
            </div>
          </div>
          <div class="inv-info">
            <span class="inv-name">${item.name}</span>
            <div class="inv-details">
              <small>${gear?.set ? `${gear.set} Set` : "No Set"}</small>
            </div>
          </div>
          <div class="inv-actions">
            <button class="btn btn-primary btn-load" data-id="${item.id}">Load</button>
            <button class="btn-delete" data-id="${item.id}">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    // Bind events
    list.querySelectorAll(".btn-load").forEach(btn => {
      btn.addEventListener("click", () => startPendingLoad(btn.dataset.id));
    });
    list.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        Inventory.remove(btn.dataset.id);
        renderInventory();
      });
    });
  }

  function loadInventoryToSlot(invId, side, targetSlotId) {
    const item = Inventory.load(invId);
    if (!item) return;

    const gear = getGearById(item.gearId);
    if (!gear) return;

    const slotId = targetSlotId || selectedSlotId || document.querySelector(".comparison-slot")?.id;
    if (!slotId) return;

    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;

    // Update slot filter
    const filter = gear.slot || "hat";
    slotEl.dataset.slotFilter = filter;
    const filterSel = slotEl.querySelector(".slot-filter");
    if (filterSel) filterSel.value = filter;

    // Preserve other side's selection
    const otherSide = side === "a" ? "b" : "a";
    const otherValue = slotEl.querySelector(`.gear-${otherSide}`)?.value || "";

    // Rebuild dropdowns
    updateGearDropdowns(slotEl);

    // Set values
    const sel = slotEl.querySelector(`.gear-${side}`);
    if (sel) sel.value = item.gearId;

    // Restore other side if valid
    const otherGear = getGearById(otherValue);
    if (otherGear && gearMatchesSlot(otherGear, filter) && gearMatchesClass(otherGear)) {
      const otherSel = slotEl.querySelector(`.gear-${otherSide}`);
      if (otherSel) otherSel.value = otherValue;
    }

    // Set stars and set pieces
    const starsInp = slotEl.querySelector(`.stars-${side}`);
    const setInp = slotEl.querySelector(`.set-${side}`);
    if (starsInp) starsInp.value = item.config?.stars ?? 0;
    if (setInp) {
      const maxSet = getMaxSetPieces(gear);
      setInp.value = Math.min(item.config?.setPieceCount ?? 0, maxSet);
    }

    // Restore flames and pots
    const allowedFlames = getAllowedFlameStats();
    const beneficial = getBeneficialStats();
    const allPotLines = [
      ...(window.POTENTIAL_DATA?.weapon?.lines || []),
      ...(window.POTENTIAL_DATA?.armor?.lines || [])
    ];

    const flames = item.config?.flameLines || [];
    for (let i = 0; i < 4; i++) {
      const statSel = slotEl.querySelector(`.flame-${side}-stat-${i}`);
      const valInp = slotEl.querySelector(`.flame-${side}-val-${i}`);
      if (statSel && valInp && flames[i] && allowedFlames.includes(flames[i].stat)) {
        statSel.value = flames[i].stat;
        if (Number.isFinite(flames[i].value)) valInp.value = flames[i].value;
      }
    }

    const pots = item.config?.potLines || [];
    for (let i = 0; i < 3; i++) {
      const lineSel = slotEl.querySelector(`.pot-${side}-line-${i}`);
      const valInp = slotEl.querySelector(`.pot-${side}-val-${i}`);
      if (lineSel && valInp && pots[i]) {
        const lineDef = allPotLines.find(l => l.id === pots[i].lineId);
        if (lineDef && beneficial.includes(lineDef.stat)) {
          lineSel.value = pots[i].lineId;
          if (Number.isFinite(pots[i].value)) valInp.value = pots[i].value;
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
    if (!gear) {
      alert("Select a gear first");
      return;
    }

    const { configA, configB } = getSlotConfig(slotEl);
    const config = side === "a" ? configA : configB;
    Inventory.save(name, { gearId: gear.id, ...config });
    renderInventory();
  }

  // ===================
  // Initialization
  // ===================
  function init() {
    loadData().then(() => {
      // Initialize comparison slots
      const container = document.getElementById("comparisons-container");
      if (container && container.children.length === 0) {
        addComparisonSlot("hat");
      }

      // Initialize class selector
      const classSelect = document.getElementById("class-select");
      if (classSelect && window.CLASS_DATA?.classes?.length) {
        const saved = localStorage.getItem("maplestory_gear_class");
        if (saved && window.CLASS_DATA.classes.some(c => c.id === saved)) {
          selectedClassId = saved;
        }

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

      // Bind global events
      document.getElementById("add-comparison")?.addEventListener("click", () => addComparisonSlot("hat"));
      document.getElementById("save-gear")?.addEventListener("click", saveCurrentToInventory);

      document.querySelectorAll(".comparison-slot").forEach(slotEl => {
        slotEl.addEventListener("click", () => { selectedSlotId = slotEl.id; });
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && pendingLoadItem) {
          clearPendingLoad();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
