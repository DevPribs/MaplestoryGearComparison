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

## Data

- **Gear**: Endgame sets (AbsoLab, Arcane, CRA, Superior, Sweetwater) - GMS
- **Starforce**: Stat tables from [MapleStory Wiki](https://maplestorywiki.net/w/Star_Force_Enhancement/Stat_Tables)
- **Flames**: Bonus stat tier values by equipment level
- **Potential**: Weapon and armor lines by rank (Rare/Epic/Unique/Legendary)
- **Set effects**: Cumulative bonuses at 2–7 pieces per set

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
