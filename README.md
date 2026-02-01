# MapleStory Gear Comparison

A GitHub Page tool for comparing crafted MapleStory gear stats. Compare two pieces of gear with different starforce, flame stats, potential lines, and set effect counts to see the stat difference.

## Features

- **Single gear comparison**: Select base gear A vs B, configure stars (0-25), flame lines (up to 4), potential lines (3), and set piece count
- **Stat difference**: See STR, DEX, INT, LUK, WATK, MATT, Boss%, IED%, Dmg%, All%, HP with color-coded deltas
- **Crafted gear inventory**: Save configurations to localStorage, load into Gear A or B, delete entries
- **Multi-slot comparison**: Add multiple gear slot comparisons (e.g., Hat, Cape, Gloves) and sum total stat differences

## Tech Stack

- Vanilla HTML/CSS/JS (no build step)
- Static JSON data (gear, flames, potential, set effects)
- localStorage for inventory persistence

## Data and calculation accuracy

All formulas and tier data are aligned with **MapleStory Wiki (GMS)** so the app reflects in-game stats:

- **Star Force**: [Star Force Enhancement / Stat Tables](https://maplestorywiki.net/w/Star_Force_Enhancement/Stat_Tables) — cumulative class stats, attack, and HP per star by level bracket (128–137, 138–149, 150–159, 160–199, 200–249). Gloves, shoes, face, and eye do not receive Star Force HP.
- **Flames (Bonus Stats)**: [Bonus Stats / Stat Tables](https://maplestorywiki.net/w/Bonus_Stats/Stat_Tables) — tier 1–7 values by equipment level (140–159, 160–179, 180–199, 200–229, 230+). Main stat, INT&LUK, HP, Attack/Magic Attack, Boss%, Damage%, All Stats%.
- **Set effects**: [Equipment Set](https://maplestorywiki.net/w/Equipment_Set) pages (AbsoLab, Arcane Umbra, CRA, Superior Gollux, Sweetwater) — cumulative bonuses at 2–7 pieces.
- **Potential**: Weapon and armor line definitions and rank ranges (Rare/Epic/Unique/Legendary) per wiki/community data.
- **Gear**: Endgame sets (AbsoLab, Arcane, CRA, Superior, Sweetwater) — base stats and levels from wiki.

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
