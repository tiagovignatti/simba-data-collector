# SIMBA Data Collector

Interactive web viewer for wildlife occurrence data from the SIMBA (Sistema de Monitoramento Ambiental Petrobras) system.

## 🌟 Features

- **Interactive Map**: View wildlife occurrences on an interactive Leaflet map
- **Data Filtering**: Filter occurrences by locality with occurrence counts
- **Bilingual Support**: Portuguese (default) and English language toggle
- **Media Gallery**: View associated photos and media thumbnails
- **Data Export**: Export filtered data to CSV format
- **Responsive Design**: Works on desktop and mobile devices

## 📁 Project Structure

```
├── README.md              # Project documentation
├── package.json          # NPM configuration and scripts
├── scripts/              # Build and data collection scripts
│   ├── build.py          # Build script for production
│   ├── simba_collector.py # Data collection from SIMBA API
│   └── update_files_index.py # Update file index
├── output/               # Generated JSON data files
│   └── simba_*.json      # Wildlife occurrence data
├── src/                  # Source files (development)
│   ├── index.html        # Main HTML page
│   ├── css/              # Modular CSS files
│   ├── js/               # Modular JavaScript files
│   ├── components/       # HTML components
│   ├── pages/           # Page templates
│   └── assets/          # Static assets
└── docs/                # Production files for GitHub Pages
    ├── index.html       # Built HTML
    ├── css/             # Built CSS files
    ├── js/              # Built JavaScript files
    ├── assets/          # Static assets
    ├── .nojekyll        # GitHub Pages configuration
    └── *.json           # Data files for web viewer
```

## 🚀 Getting Started

### Prerequisites

- Python 3.7+
- Node.js and npm (optional, for convenient scripts)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tiagovignatti/simba-data-collector.git
   cd simba-data-collector
   ```

2. **Install Python dependencies**:
   ```bash
   pip install requests
   ```

3. **Development with npm** (recommended):
   ```bash
   npm run dev      # Start development server
   npm run build    # Build for production
   npm start        # Build and serve
   ```

4. **Or traditional Python**:
   ```bash
   python scripts/build.py              # Build project
   cd docs && python -m http.server 8082  # Serve locally
   ```

### Data Collection

```bash
# Collect wildlife data
python scripts/simba_collector.py --municipality "Penha" --start-date "2025-01-01"

# Update data files index
npm run update-data
# or: python scripts/update_files_index.py
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (serves from docs/) |
| `npm run build` | Build project from src/ to docs/ |
| `npm start` | Build and serve (development workflow) |
| `npm run clean` | Clean docs/ directory |
| `npm run update-data` | Update files index with available data |
| `npm run deploy` | Build, commit, and push to GitHub |

## 🔧 Usage

### Data Collection

```bash
# Collect data for Penha municipality from 2025-01-01
python scripts/simba_collector.py --municipality "Penha" --start-date "2025-01-01"

# Collect data for different municipality
python scripts/simba_collector.py --municipality "Florianópolis" --start-date "2024-01-01"

# Update the web app with new data
npm run update-data && npm run build
```

### Web Viewer Features

1. **Load Data**: Select a JSON data file from the dropdown
2. **View Map**: See occurrence locations on the interactive map
3. **Filter Data**: Use locality filter to focus on specific areas
4. **View Details**: Click on map markers or occurrence cards for detailed information
5. **Export Data**: Download filtered results as CSV
6. **Language Toggle**: Switch between Portuguese and English

## 📊 Data Format

The system uses Darwin Core standard for biodiversity data:

- **Scientific Name**: Species scientific name
- **Location**: Municipality, state, locality, coordinates
- **Date**: Event date and time
- **Observer**: Person who recorded the occurrence
- **Media**: Associated photos and media files
- **Measurements**: Biological measurements and observations

## 🌐 GitHub Pages

The web viewer is designed to work with GitHub Pages:

1. Files in `public/` directory are production-ready
2. Includes `.nojekyll` file to prevent Jekyll processing
3. Uses relative paths for all resources
4. Compatible with GitHub Pages routing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

Copyright © 2025 [Tiago Vignatti](https://vignatti.com)

## 🔗 Data Source

Data collected from [SIMBA - Sistema de Monitoramento Ambiental Petrobras](https://simba.petrobras.com.br)