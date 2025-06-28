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
├── .gitignore            # Git ignore patterns
├── scripts/              # Python data collection scripts
│   └── simba_collector.py
├── output/               # Generated JSON data files
│   ├── simba_*.json      # Wildlife occurrence data
├── src/                  # Web source files (development)
│   ├── index.html        # Main HTML page
│   ├── viewer.js         # JavaScript functionality
│   ├── viewer.css        # Styling
│   └── .nojekyll         # GitHub Pages configuration
└── public/               # Production files for GitHub Pages
    ├── assets/           # Static assets (images, icons, etc.)
    ├── index.html        # Production HTML
    ├── viewer.js         # Production JavaScript
    ├── viewer.css        # Production CSS
    ├── .nojekyll         # GitHub Pages configuration
    └── *.json            # Data files for web viewer
```

## 🚀 Getting Started

### Data Collection

1. **Install Python dependencies**:
   ```bash
   pip install requests
   ```

2. **Run the data collector**:
   ```bash
   python scripts/simba_collector.py --municipality "Penha" --start-date "2025-01-01"
   ```

3. **Data will be saved to** `output/` directory

### Web Viewer

1. **Local Development**:
   - Open `src/index.html` in a web browser
   - Or serve with a local HTTP server:
     ```bash
     python -m http.server 8080
     ```

2. **GitHub Pages Deployment**:
   - Files in `public/` directory are ready for GitHub Pages
   - Enable GitHub Pages in repository settings
   - Point to root directory or `/public` folder

## 🔧 Usage

### Data Collection Script

```bash
# Collect data for Penha municipality from 2025-01-01
python scripts/simba_collector.py --municipality "Penha" --start-date "2025-01-01"

# Collect data for different municipality
python scripts/simba_collector.py --municipality "Florianópolis" --start-date "2024-01-01"
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