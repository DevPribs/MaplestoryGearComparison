/**
 * Star Force stat tables - MapleStory Wiki (Star Force Enhancement/Stat Tables)
 * https://maplestorywiki.net/w/Star_Force_Enhancement/Stat_Tables
 * Level brackets: 128-137, 138-149, 150-159, 160-199, 200-249 (GMS).
 * GMS supports up to 30 stars for normal gear; Superior remains max 15.
 * Cumulative class stats and attack per star; gloves/shoes/face/eye do not get HP.
 */
const STARFORCE_DATA = {
  // Cumulative class stats for armor/accessories (0-30★). Stars 23+ add only DEF%/atk; class stat capped at 22★.
  armor: {
    "128-137": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,47,54,61,68,75,75,75,75,75,75,75,75,75,75,75],
    "138-149": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,49,58,67,76,85,94,103,103,103,103,103,103,103,103,103],
    "150-159": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,47,54,61,68,75,94,103,103,103,103,103,103,103,103,103],
    "160-199": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,53,66,79,92,105,130,145,145,145,145,145,145,145,145,145],
    "200-249": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,55,70,85,100,115,142,159,159,159,159,159,159,159,159,159]
  },
  // Cumulative Attack/Magic Attack for armor (wiki cumulative table through 30★)
  armorAtk: {
    "128-137": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,15,24,34,45,45,45,45,45,45,157,180,204,229,255],
    "138-149": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,17,27,38,50,63,78,95,114,135,168,192,217,243,270],
    "150-159": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,15,24,34,45,63,78,95,114,135,179,204,230,257,285],
    "160-199": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,21,33,46,60,87,106,127,150,175,201,228,256,285,315],
    "200-249": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,25,39,54,70,99,120,143,168,195,223,252,282,313,345]
  },
  // Cumulative class stats for weapons (same cap pattern as armor at 22★)
  weapon: {
    "128-137": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,47,54,61,68,75,75,75,75,75,75,75,75,75,75,75],
    "138-149": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,49,58,67,76,85,94,103,103,103,103,103,103,103,103,103],
    "150-159": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,51,62,73,84,95,118,131,131,131,131,131,131,131,131,131],
    "160-199": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,53,66,79,92,105,130,145,145,145,145,145,145,145,145,145],
    "200-249": [0,2,4,6,8,10,13,16,19,22,25,28,31,34,37,40,55,70,85,100,115,142,159,159,159,159,159,159,159,159,159]
  },
  // Cumulative Attack/Magic Attack for weapons. Wiki lists 0-25★; 26-30★ use same cumulative as armor (GMS 30-star).
  weaponAtk: {
    "128-137": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,13,20,28,37,37,37,37,37,37,157,180,204,229,255],
    "138-149": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,15,24,34,45,56,68,81,95,110,168,192,217,243,270],
    "150-159": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,17,26,36,47,64,78,95,110,125,179,204,230,257,285],
    "160-199": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,18,28,39,51,85,102,136,171,207,233,260,288,317,347],
    "200-249": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,26,40,54,69,102,120,143,168,195,223,252,282,313,345]
  },
  // Superior equipment (Level 150+) - max 15 stars, cumulative all stats per star
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

function getStarforceStats(level, stars, equipType, baseWatk, baseMatt, slot, starforceType) {
  const bracket = getLevelBracket(level);
  stars = Math.min(Math.max(0, stars), 30);
  const sfType = starforceType ?? "normal";

  const result = { str: 0, dex: 0, int: 0, luk: 0, watk: 0, matt: 0, def: 0, hp: 0 };

  if (sfType === "superior") {
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
