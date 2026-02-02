# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MapleStory Gear Comparison is a static web app for comparing crafted MapleStory gear stats. Users configure starforce, flames, potential, and set effects for two gear pieces and see stat differences.

## Development

**No build step required.** Open `index.html` in a browser to run. Deploy via GitHub Pages (Settings → Pages → main branch, root folder).

## Architecture

### Tech Stack
- Vanilla HTML/CSS/JS (ES6+)
- Static JSON data files loaded at runtime
- localStorage for inventory persistence
- MapleStory.io API for gear images

### Module Structure
```
js/
├── main.js          # App orchestrator, UI events, state management
├── calculator.js    # Pure stat calculation logic (starforce, flames, potential, sets)
├── ui.js            # Reusable UI rendering functions
├── inventory.js     # localStorage wrapper (save/load/delete)
└── gearImageService.js  # MapleStory.io API integration
```

All modules except `gearImageService.js` use the IIFE pattern for encapsulation. `gearImageService.js` uses a static class pattern.

### Data Files
```
data/
├── gear.json        # Gear definitions (stats, slot, set, level)
├── starforce.js     # Star force stat tables by level bracket
├── setEffects.json  # Set bonuses (AbsoLab, Arcane, CRA, Superior, Sweetwater)
├── flames.json      # Flame stat types
├── potential.json   # Potential line definitions
└── classes.json     # Character classes and beneficial stats
```

### Global State
Data is stored on `window.*` after loading:
- `window.CLASS_DATA`, `window.FLAME_DATA`, `window.POTENTIAL_DATA`, `window.SET_EFFECTS_DATA`
- `GEAR_DATA` (in main.js IIFE scope)

### localStorage Keys
- `maplestory_gear_inventory` - saved gear configurations
- `maplestory_gear_class` - selected class filter

## Key Domain Concepts

### Starforce Types
**Important distinction:**
- `starforceType: "superior"` = mechanical 15★ table (e.g., Superior Gollux ring/pendant)
- `set: "superior"` = Superior Gollux set name

These are independent. Future gear could use one without the other.

### Max Stars Logic
Check in order: `gear.maxStars` → `starforceType === "superior" ? 15 : 30`

### Slots Without HP
Gloves, shoes, face, and eye do not receive Star Force HP bonuses.

### Shoulders and Flames
Shoulders (except Scarlet) cannot receive flames.

## Coding Conventions

### Stat Calculations
Always return an object with all stat keys: `{ str, dex, int, luk, watk, matt, def, hp, bossDmg, ied, dmg, allStat, hpPercent, mpPercent }`

### Input Validation
Use `clampNumber(n, min, max)` for all numeric user input. Validation ranges:
- stars: 0-30
- setPieces: 0-7
- flameFlat: 0-9999
- flamePercent: 0-100
- potentialPercent: 0-100

### CSS
4px base unit scale via CSS custom properties (`--space-1` through `--space-10`).

### Naming
- snake_case for data attributes and IDs
- camelCase for functions and variables

## Data Sources

All formulas align with MapleStory Wiki (GMS):
- Star Force: https://maplestorywiki.net/w/Star_Force_Enhancement/Stat_Tables
- Set Effects: https://maplestorywiki.net/w/Equipment_Set
