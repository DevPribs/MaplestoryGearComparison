# MapleStory Gear Comparison

A GitHub Page tool for comparing crafted MapleStory gear stats. Compare two pieces of gear with different starforce, flame stats, potential lines, and set effect counts to see the stat difference.

## Features

- **Single gear comparison**: Select base gear A vs B, configure stars (per-gear max 30 by default), flame lines (up to 4), potential lines (3), and set piece count
- **Stat difference**: See STR, DEX, INT, LUK, WATK, MATT, Boss%, IED%, Dmg%, All%, HP with color-coded deltas
- **Crafted gear inventory**: Save configurations to localStorage, load into Gear A or B, delete entries
- **Multi-slot comparison**: Add multiple gear slot comparisons (e.g., Hat, Cape, Gloves) and sum total stat differences

## Tech Stack

- Vanilla HTML/CSS/JS (no build step)
- Static JSON data (gear, flames, potential, set effects)
- localStorage for inventory persistence

## Data and calculation accuracy

All formulas and tier data are aligned with **MapleStory Wiki (GMS)** so the app reflects in-game stats:

- **Star Force**: [Star Force Enhancement / Stat Tables](https://maplestorywiki.net/w/Star_Force_Enhancement/Stat_Tables) — cumulative class stats, attack, and HP per star by level bracket. Max stars are **per-item**: default 30; gear that uses the superior starforce table (e.g. Superior Gollux ring/pendant) sets `starforceType: "superior"` and optional `maxStars: 15`; Genesis/endgame weapon uses `maxStars: 22` when added. `equipType` is weapon/armor only (for flames and potential). Gloves, shoes, face, and eye do not receive Star Force HP.
- **Flames (Bonus Stats)**: Stat type is chosen from the list (INT, LUK, HP, Boss%, etc.); the **value is entered manually** by the user (e.g. +45 INT, +1920 HP). No tier lookup — enter the actual flame stat from your equipment.
- **Set effects**: [Equipment Set](https://maplestorywiki.net/w/Equipment_Set) pages (AbsoLab, Arcane Umbra, CRA, Superior Gollux, Sweetwater) — cumulative bonuses at 2–7 pieces.
- **Potential**: Weapon and armor line definitions and rank ranges (Rare/Epic/Unique/Legendary) per wiki/community data.
- **Gear**: Endgame sets (AbsoLab, Arcane, CRA, Superior, Sweetwater) — base stats and levels from wiki. Each item has `equipType` (weapon/armor) for flames and potential; optional `starforceType: "superior"` and `maxStars` (e.g. Superior Gollux = 15, Genesis weapon = 22 when added). Gear list is a subset (e.g. Mage variants, selected slots); shoulders except Scarlet cannot receive flames.

## Usage

1. Open `index.html` in a browser or deploy to GitHub Pages
2. Select a slot type (hat, cape, gloves, etc.) and choose Gear A and Gear B
3. Set stars, flame stats, potential lines, and set piece count for each
4. View the stat difference (B - A)
5. Save configurations to inventory for quick loading
6. Add more comparisons to sum total stat changes across multiple slots

## GitHub Pages Deployment

1. Push to a GitHub repository
2. Settings → Pages → Source: Deploy from branch
3. Branch: main, folder: / (root)
4. Site: `https://<username>.github.io/maplestory_gear_checker/`

## License

MIT
