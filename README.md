# Marine Rescue Viewer

Interactive web viewer for marine wildlife rescue data from the SIMBA project in Brazil.

## Quick Start

```bash
# First time setup - get data and build
npm run collect-and-build

# Start development server
npm run dev
```

Visit http://localhost:8082 to view the application.

## Development Workflow

### Daily Development
```bash
# Make code changes in src/
npm run build    # Rebuild after changes
npm run dev      # View changes locally
```

### Data Updates
```bash
# Get fresh data from SIMBA API
npm run collect-all

# Sync data files and rebuild
npm run update-data
npm run build
```

### Complete Refresh
```bash
npm run clean              # Clear built files
npm run collect-and-build  # Rebuild everything
```

## NPM Scripts Reference

### Development
- **`npm run dev`** - Start local server at http://localhost:8082
- **`npm run start`** - Build then start server (full development workflow)
- **`npm run build`** - Build project from `src/` to `docs/` for deployment
- **`npm run clean`** - Remove all built files

### Data Management
- **`npm run collect-all`** - Collect data for all cities (Penha, Florianópolis, Porto Belo) from 2021-2025
- **`npm run update-data`** - Sync collected data files and create index for web viewer
- **`npm run collect-and-build`** - Complete pipeline: collect data → update files → build

## Data Source

Marine wildlife rescue data from [SIMBA - Sistema de Monitoramento Ambiental Petrobras](https://simba.petrobras.com.br)

---

Copyright © 2025 [Tiago Vignatti](https://vignatti.com)