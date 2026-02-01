/**
 * MapleStory Gear Stat Calculator
 * Combines base stats, starforce, flames, potential, and set effects
 */
const Calculator = (function() {
  const EMPTY_STATS = { str: 0, dex: 0, int: 0, luk: 0, watk: 0, matt: 0, def: 0, hp: 0, bossDmg: 0, ied: 0, dmg: 0, allStat: 0, hpPercent: 0, mpPercent: 0 };

  function addStats(a, b) {
    const r = {};
    for (const k of Object.keys(EMPTY_STATS)) {
      const va = Number(a[k]);
      const vb = Number(b[k]);
      r[k] = (Number.isFinite(va) ? va : 0) + (Number.isFinite(vb) ? vb : 0);
    }
    return r;
  }

  /** Flames use user-entered values (no tier lookup). */
  function getFlameStats(flameLines, level, equipType) {
    const result = { ...EMPTY_STATS };
    if (!flameLines || flameLines.length === 0) return result;

    for (const line of flameLines) {
      if (!line || !line.stat) continue;
      const val = Number(line.value);
      if (!Number.isFinite(val)) continue;

      if (line.stat === "intLuk") {
        result.int += val;
        result.luk += val;
      } else if (line.stat === "allStat") {
        result.allStat += val;
      } else if (result.hasOwnProperty(line.stat)) {
        result[line.stat] += val;
      }
    }
    return result;
  }

  function getPotentialStats(potLines, equipType) {
    const result = { ...EMPTY_STATS };
    if (!potLines || potLines.length === 0) return result;

    const potData = window.POTENTIAL_DATA;
    const weaponLines = potData?.weapon?.lines || [];
    const armorLines = potData?.armor?.lines || [];
    const allLines = [...weaponLines, ...armorLines];
    
    for (let i = 0; i < Math.min(3, potLines.length); i++) {
      const pl = potLines[i];
      if (!pl || !pl.lineId) continue;
      const def = allLines.find(l => l.id === pl.lineId);
      if (!def) continue;
      const rank = (pl.rank || "unique").toLowerCase();
      const range = def.ranks?.[rank];
      const value = range ? (pl.value ?? (range[0] + range[1]) / 2) : 0;
      const stat = def.stat;
      const isPercent = def.percent;
      
      if (stat === "allStat") {
        result.allStat += value;
      } else if (result.hasOwnProperty(stat)) {
        result[stat] += value;
      }
    }
    return result;
  }

  function getSetEffectStats(setId, pieceCount, setEffectsData) {
    const result = { ...EMPTY_STATS };
    if (!setId || !pieceCount || pieceCount < 2) return result;
    
    const setData = setEffectsData?.sets?.[setId];
    if (!setData) return result;
    
    const count = Math.min(pieceCount, setData.maxPieces || 7);
    const cum = setData.cumulative?.[String(count)];
    if (!cum) return result;
    
    for (const [k, v] of Object.entries(cum)) {
      if (result.hasOwnProperty(k)) result[k] += v;
    }
    return result;
  }

  /**
   * Calculate total stats for a single piece of gear (excluding potential %; potential is shown as separate diff).
   * @param {Object} gear - Gear from gear.json
   * @param {Object} config - { stars, flameLines, potLines, setPieceCount }
   * @param {Object} data - { setEffects, flames, potential }
   * @param {Object} options - { includePotential } if false, potential is not added into stats (default false)
   */
  function calculateGearStats(gear, config, data, options) {
    if (!gear) return { ...EMPTY_STATS };
    const includePotential = options?.includePotential === true;

    const stars = config?.stars ?? 0;
    const flameLines = config?.flameLines ?? [];
    const potLines = config?.potLines ?? [];
    const setPieceCount = config?.setPieceCount ?? 0;

    let result = { ...EMPTY_STATS };
    for (const [k, v] of Object.entries(gear.baseStats || {})) {
      if (result.hasOwnProperty(k)) result[k] += (Number(v) || 0);
    }

    const equipType = gear.equipType || "armor";
    const sf = window.StarforceData?.getStarforceStats(
      gear.level || 160,
      stars,
      equipType,
      gear.baseStats?.watk || 0,
      gear.baseStats?.matt || 0,
      gear.slot || ""
    );
    result = addStats(result, sf);

    if (gear.flameable && flameLines.length > 0) {
      result = addStats(result, getFlameStats(flameLines, gear.level || 160, equipType));
    }
    if (includePotential) {
      result = addStats(result, getPotentialStats(potLines, equipType));
    }
    result = addStats(result, getSetEffectStats(gear.set, setPieceCount, data?.setEffects));

    return result;
  }

  /**
   * Get set effect delta when changing from countA to countB for a set
   */
  function getSetEffectDelta(setId, countA, countB, setEffectsData) {
    const a = getSetEffectStats(setId, countA, setEffectsData);
    const b = getSetEffectStats(setId, countB, setEffectsData);
    const delta = {};
    for (const k of Object.keys(EMPTY_STATS)) {
      delta[k] = (b[k] || 0) - (a[k] || 0);
    }
    return delta;
  }

  /**
   * Calculate stat difference: Gear B - Gear A.
   * Returns { statDiff, potentialDiff }. Main stats exclude potential %; potential is a separate diff (percent points).
   */
  function calculateDifference(gearA, configA, gearB, configB, data) {
    const statsA = calculateGearStats(gearA, configA, data, { includePotential: false });
    const statsB = calculateGearStats(gearB, configB, data, { includePotential: false });
    const statDiff = {};
    for (const k of Object.keys(EMPTY_STATS)) {
      statDiff[k] = (statsB[k] || 0) - (statsA[k] || 0);
    }
    const potA = getPotentialStats(configA?.potLines ?? [], gearA?.equipType || "armor");
    const potB = getPotentialStats(configB?.potLines ?? [], gearB?.equipType || "armor");
    const potentialDiff = {};
    for (const k of Object.keys(EMPTY_STATS)) {
      potentialDiff[k] = (potB[k] || 0) - (potA[k] || 0);
    }
    return { statDiff, potentialDiff };
  }

  /**
   * Sum multiple difference results (each { statDiff, potentialDiff }) into one.
   */
  function sumDifferenceResults(results) {
    const statDiff = sumStats((results || []).map(r => r.statDiff || EMPTY_STATS));
    const potentialDiff = sumStats((results || []).map(r => r.potentialDiff || EMPTY_STATS));
    return { statDiff, potentialDiff };
  }

  /**
   * Sum multiple stat objects
   */
  function sumStats(statsArray) {
    const result = { ...EMPTY_STATS };
    for (const s of statsArray) {
      for (const k of Object.keys(result)) {
        result[k] += s[k] || 0;
      }
    }
    return result;
  }

  return {
    calculateGearStats,
    calculateDifference,
    getSetEffectDelta,
    sumStats,
    sumDifferenceResults,
    addStats,
    EMPTY_STATS
  };
})();
