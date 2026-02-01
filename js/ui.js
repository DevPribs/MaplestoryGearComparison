/**
 * UI Layer - DOM updates and event handlers
 */
const UI = (function() {
  const STAT_KEYS = ["str", "dex", "int", "luk", "watk", "matt", "def", "hp", "bossDmg", "ied", "dmg", "allStat", "hpPercent", "mpPercent"];
  const STAT_LABELS = { str: "STR", dex: "DEX", int: "INT", luk: "LUK", watk: "WATK", matt: "MATT", def: "DEF", hp: "HP", bossDmg: "Boss%", ied: "IED%", dmg: "Dmg%", allStat: "All%", hpPercent: "HP%", mpPercent: "MP%" };

  /**
   * Build HTML string for a stat diff (for concatenating with another diff, e.g. main + potential).
   * @param {Object} diff - stat key -> number
   * @param {Object} [opts] - { onlyNonZero, statKeys, valueSuffix } e.g. valueSuffix: '%' for potential
   * @returns {string} HTML string of stat badges
   */
  function renderStatDiffHtml(diff, opts) {
    const onlyNonZero = opts?.onlyNonZero === true;
    const statKeys = opts?.statKeys && opts.statKeys.length > 0 ? opts.statKeys : STAT_KEYS;
    const valueSuffix = opts?.valueSuffix ?? "";
    let html = "";
    for (const k of statKeys) {
      if (!STAT_LABELS[k]) continue;
      const raw = diff[k];
      const v = (typeof raw === "number" && !Number.isNaN(raw)) ? raw : 0;
      if (onlyNonZero && v === 0) continue;
      const label = STAT_LABELS[k] || k;
      const cls = v > 0 ? "stat-pos" : v < 0 ? "stat-neg" : "";
      const sign = v > 0 ? "+" : "";
      html += `<span class="stat-badge ${cls}">${label}: ${sign}${v}${valueSuffix}</span>`;
    }
    return html;
  }

  /**
   * @param {Object} diff - stat key -> number
   * @param {string} containerId - element id
   * @param {Object} [opts] - { onlyNonZero: true } to show only non-zero stats; { statKeys: [] }; { valueSuffix: '%' } for potential
   */
  function renderStatDiff(diff, containerId, opts) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const html = renderStatDiffHtml(diff, opts);
    el.innerHTML = html || "<span class=\"muted\">No difference</span>";
  }

  function createGearSelect(gearList, slotFilter, selectedId, onChange) {
    const filtered = slotFilter ? gearList.filter(g => g.slot === slotFilter) : gearList;
    let html = '<option value="">-- Select gear --</option>';
    for (const g of filtered) {
      const sel = g.id === selectedId ? " selected" : "";
      html += `<option value="${g.id}"${sel}>${g.name}</option>`;
    }
    return html;
  }

  function createFlameSelect(flameTypes, equipType) {
    const filtered = flameTypes.filter(f => f.equipTypes.includes(equipType));
    let html = '<option value="">-- None --</option>';
    for (const f of filtered) {
      html += `<option value="${f.id}">${f.name}</option>`;
    }
    return html;
  }

  function createPotentialSelect(potLines, equipType) {
    const data = window.POTENTIAL_DATA;
    const lines = (equipType === "weapon" ? data?.weapon : data?.armor)?.lines || [];
    let html = '<option value="">-- None --</option>';
    for (const l of lines) {
      html += `<option value="${l.id}">${l.name}</option>`;
    }
    return html;
  }

  return {
    STAT_KEYS,
    STAT_LABELS,
    renderStatDiff,
    renderStatDiffHtml,
    createGearSelect,
    createFlameSelect,
    createPotentialSelect
  };
})();
