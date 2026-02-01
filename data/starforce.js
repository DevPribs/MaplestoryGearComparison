/**
 * Star Force stat tables from MapleStory Wiki
 * Level brackets: 150-159, 160-199, 200-249 (GMS)
 * equipType: weapon | armor | badge | superior
 */
const STARFORCE_DATA = {
  // Cumulative stats for armor/accessories (Level 160-199 bracket)
  armor: {
    "150-159": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,47,54,61,68,75,94,103,103,103,103],
    "160-199": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,53,66,79,92,105,130,145,145,145,145],
    "200-249": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,55,70,85,100,115,142,159,159,159,159]
  },
  // Attack/Magic Attack for armor (Level 160-199)
  armorAtk: {
    "150-159": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,15,24,34,45,63,78,95,114,135],
    "160-199": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,21,33,46,60,87,106,127,150,175],
    "200-249": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,25,39,54,70,99,120,143,168,195]
  },
  // Class stats + WATK/MATT for weapons (Level 160-199), using MATT formula
  weapon: {
    "150-159": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,51,62,73,84,95,118,131,131,131,131],
    "160-199": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,53,66,79,92,105,130,145,145,145,145],
    "200-249": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,55,70,85,100,115,142,159,159,159,159]
  },
  weaponAtk: {
    "150-159": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,17,26,36,47,64,78,95,110,125],
    "160-199": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,18,28,39,51,85,102,136,171,207],
    "200-249": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,26,40,54,69,102,120,143,168,195]
  },
  // Superior equipment (Level 150+) - cumulative all stats per star
  superior: {
    "150": [0,19,39,61,86,115,140,165,190,215,240,265,290,315,340,365]
  }
};

function getLevelBracket(level) {
  if (level >= 200) return "200-249";
  if (level >= 160) return "160-199";
  if (level >= 150) return "150-159";
  if (level >= 138) return "138-149";
  return "128-137";
}

function getStarforceStats(level, stars, equipType, baseWatk, baseMatt, slot) {
  const bracket = getLevelBracket(level);
  stars = Math.min(Math.max(0, stars), 25);
  
  const result = { str: 0, dex: 0, int: 0, luk: 0, watk: 0, matt: 0, def: 0, hp: 0 };
  
  if (equipType === "superior") {
    const sup = STARFORCE_DATA.superior["150"];
    const idx = Math.min(stars, sup.length - 1);
    const allStat = sup[idx] || idx * 20;
    result.str = result.dex = result.int = result.luk = allStat;
    return result;
  }
  
  if (equipType === "weapon") {
    const classStats = STARFORCE_DATA.weapon[bracket] || STARFORCE_DATA.weapon["160-199"];
    const atkStats = STARFORCE_DATA.weaponAtk[bracket] || STARFORCE_DATA.weaponAtk["160-199"];
    result.str = result.dex = result.int = result.luk = classStats[stars] || 0;
    if (baseWatk > 0) result.watk = atkStats[stars] || 0;
    if (baseMatt > 0) result.matt = atkStats[stars] || 0;
  } else {
    const classStats = STARFORCE_DATA.armor[bracket] || STARFORCE_DATA.armor["160-199"];
    const atkStats = STARFORCE_DATA.armorAtk[bracket] || STARFORCE_DATA.armorAtk["160-199"];
    result.str = result.dex = result.int = result.luk = classStats[stars] || 0;
    result.watk = result.matt = atkStats[stars] || 0;
    if (slot !== "gloves" && slot !== "shoes" && slot !== "face" && slot !== "eye") {
      result.hp = stars >= 1 ? Math.min(255, 5 + (stars - 1) * 25) : 0;
    }
  }
  return result;
}

if (typeof window !== 'undefined') {
  window.StarforceData = { getStarforceStats, getLevelBracket };
}
