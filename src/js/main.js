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
        // Initialize data viewer component
        this.dataViewer = new DataViewer();
        window.dataViewer = this.dataViewer;
        
        // Initialize yearly statistics component
        this.yearlyStats = new YearlyStats();
        window.yearlyStats = this.yearlyStats;
        
        // Initialize data insights component
        this.dataInsights = new DataInsights();
        window.dataInsights = this.dataInsights;
        
        // Set initial language
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
        // Always start with Penha data viewer - no city selection needed
        this.showDataViewer('Penha', false);
    }


    showDataViewer(city, updateHistory = true) {
        Utils.showPage('dataViewer');
        
        // Set selected city in data viewer
        this.dataViewer.setSelectedCity(city);
        
        // Ensure map is ready now that the container is visible
        this.dataViewer.ensureMapReady();
        
        // Load available periods for the city and auto-load the most recent data
        this.dataViewer.loadAvailablePeriods().then(() => {
            this.dataViewer.autoLoadRecentData();
        });
        
        // Show insights dashboard
        this.dataInsights.show();
        
        // Show yearly statistics section inline
        this.showYearlyStatsInline();
        
        // Show last updated notice
        this.showLastUpdatedNotice();
        
        // Save selected city to session storage
        sessionStorage.setItem('selectedCity', city);
    }

    showYearlyStatsInline() {
        const yearlyStatsSection = document.getElementById('yearlyStatsSection');
        if (yearlyStatsSection) {
            yearlyStatsSection.style.display = 'block';
        }
        // Ensure yearly stats is initialized and show it
        this.yearlyStats.show();
        window.i18n.updateUI();
    }

    async showLastUpdatedNotice() {
        try {
            const response = await fetch('files-index.json');
            const index = await response.json();
            
            if (index.lastUpdated) {
                const lastUpdateDate = new Date(index.lastUpdated);
                const now = new Date();
                const diffTime = Math.abs(now - lastUpdateDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                
                let timeAgoText;
                if (diffDays > 0) {
                    timeAgoText = `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
                } else if (diffHours > 0) {
                    timeAgoText = `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
                } else {
                    timeAgoText = 'há menos de 1 hora';
                }
                
                const formattedDate = lastUpdateDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const lastUpdatedText = document.getElementById('lastUpdatedText');
                if (lastUpdatedText) {
                    lastUpdatedText.textContent = `Última atualização dos dados: ${formattedDate} (${timeAgoText})`;
                }
            }
        } catch (error) {
            console.error('Error loading last updated info:', error);
            const lastUpdatedText = document.getElementById('lastUpdatedText');
            if (lastUpdatedText) {
                lastUpdatedText.textContent = 'Informações de atualização não disponíveis';
            }
        }
    }

    async toggleLanguage() {
        const newLang = this.currentLang === 'pt' ? 'en' : 'pt';
        this.currentLang = newLang;
        
        // Use i18n service to change language
        await window.i18n.setLanguage(newLang);
        
        // Update all components
        this.dataViewer.setLanguage(this.currentLang);
        
        // Update city title if we're in data viewer
        const titleElement = document.getElementById('selectedCityTitle');
        if (titleElement && this.dataViewer.selectedCity) {
            titleElement.textContent = this.dataViewer.selectedCity;
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
            case 'dataViewer':
                this.showDataViewer('Penha');
                break;
            case 'yearlyStats':
                this.showYearlyStats();
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