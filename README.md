# SIMBA Data Collector

Interactive web viewer for marine wildlife rescue data.

## Quick Start

```bash
npm run dev      # Start development server
npm run build    # Build for production
```

## Data Collection

```bash
# Collect all data for all cities (2021-2025)
npm run collect-all

# Or collect specific city/year
python3 scripts/simba_collector.py --municipality "Penha" --start-date "2025-01-01"

# Update and build after collecting data
npm run collect-and-build
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build project  
- `npm run collect-all` - Collect data for all cities/years
- `npm run collect-and-build` - Collect, update, and build
- `npm run update-data` - Update data files
- `npm run deploy` - Deploy to GitHub

---

Copyright © 2025 [Tiago Vignatti](https://vignatti.com)