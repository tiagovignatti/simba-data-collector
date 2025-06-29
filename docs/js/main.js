// Main Application Logic and Routing

class SimbaApp {
    constructor() {
        this.currentLang = 'pt';
        this.citySelection = null;
        this.dataViewer = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupApp();
            });
        } else {
            this.setupApp();
        }
    }

    async setupApp() {
        // Initialize i18n first
        await window.i18n.init(this.currentLang);
        
        this.initializeComponents();
        this.bindGlobalEvents();
        this.setupInitialView();
    }

    initializeComponents() {
        // Initialize city selection component
        this.citySelection = new CitySelection();
        window.citySelection = this.citySelection;
        
        // Initialize data viewer component
        this.dataViewer = new DataViewer();
        window.dataViewer = this.dataViewer;
        
        // Set initial language
        this.citySelection.setLanguage(this.currentLang);
        this.dataViewer.setLanguage(this.currentLang);
    }

    bindGlobalEvents() {
        // Language toggle
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
        }
    }

    setupInitialView() {
        // Check URL for routing
        const path = window.location.pathname;
        const cityFromUrl = this.getCityFromPath(path);
        
        if (cityFromUrl) {
            // Load data viewer for city from URL
            this.showDataViewer(cityFromUrl);
        } else {
            // Check if there's a selected city in sessionStorage
            const savedCity = sessionStorage.getItem('selectedCity');
            
            if (savedCity) {
                // Resume where user left off and update URL
                this.navigateToCity(savedCity);
            } else {
                // Start with city selection
                this.showCitySelection();
            }
        }
        
        // Listen for browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            const path = window.location.pathname;
            const city = this.getCityFromPath(path);
            
            if (city) {
                this.showDataViewer(city, false); // false = don't update history
            } else {
                this.showCitySelection(false); // false = don't update history
            }
        });
    }

    showCitySelection(updateHistory = true) {
        Utils.showPage('citySelection');
        
        // Update URL
        if (updateHistory) {
            history.pushState({}, '', '/');
        }
        
        // Update language elements
        this.updateLanguageElements();
    }

    showDataViewer(city, updateHistory = true) {
        Utils.showPage('dataViewer');
        
        // Update URL
        if (updateHistory) {
            const cityUrl = city.toLowerCase().replace(/\s+/g, '-');
            history.pushState({ city }, '', `/${cityUrl}/`);
        }
        
        // Set selected city in data viewer
        this.dataViewer.setSelectedCity(city);
        
        // Load available periods for the city and auto-load the most recent data
        this.dataViewer.loadAvailablePeriods().then(() => {
            this.dataViewer.autoLoadRecentData();
        });
        
        // Update the title with city name
        const titleElement = document.getElementById('selectedCityTitle');
        if (titleElement) {
            titleElement.textContent = `${window.i18n.t('dataViewer.dataFrom')} ${city}`;
        }
    }

    getCityFromPath(path) {
        // Extract city from URL path like /penha/ or /florianopolis/
        const match = path.match(/^\/([^\/]+)\/?$/);
        if (match) {
            const citySlug = match[1];
            // Convert URL slug back to city name
            const cityMap = {
                'penha': 'Penha',
                'florianopolis': 'Florianópolis', 
                'florianópolis': 'Florianópolis',
                'porto-belo': 'Porto Belo',
                'portobelo': 'Porto Belo'
            };
            return cityMap[citySlug.toLowerCase()] || null;
        }
        return null;
    }

    navigateToCity(city) {
        // Public method to navigate to a city (used by city selection)
        this.showDataViewer(city, true);
    }

    async toggleLanguage() {
        const newLang = this.currentLang === 'pt' ? 'en' : 'pt';
        this.currentLang = newLang;
        
        // Use i18n service to change language
        await window.i18n.setLanguage(newLang);
        
        // Update all components
        this.citySelection.setLanguage(this.currentLang);
        this.dataViewer.setLanguage(this.currentLang);
        
        // Update city title if we're in data viewer
        const titleElement = document.getElementById('selectedCityTitle');
        if (titleElement && this.dataViewer.selectedCity) {
            titleElement.textContent = `${window.i18n.t('dataViewer.dataFrom')} ${this.dataViewer.selectedCity}`;
        }
        
        // Refresh current data if loaded
        if (this.dataViewer.currentData) {
            this.dataViewer.displayDatasetInfo();
            this.dataViewer.displayOccurrencesList();
            this.dataViewer.updateRecordCount();
        }
    }


    // Utility method to get current language
    getCurrentLanguage() {
        return this.currentLang;
    }

    // Method to programmatically navigate
    navigateTo(page, params = {}) {
        switch(page) {
            case 'citySelection':
                this.showCitySelection();
                break;
            case 'dataViewer':
                if (params.city) {
                    this.showDataViewer(params.city);
                }
                break;
            default:
                console.warn(`Unknown page: ${page}`);
        }
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // You could add error reporting here
});

// Initialize the app
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new SimbaApp();
    window.simbaApp = app;
});

// Export for use in other modules
window.SimbaApp = SimbaApp;