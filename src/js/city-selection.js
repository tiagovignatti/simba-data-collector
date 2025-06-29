// City Selection Page Logic

class CitySelection {
    constructor() {
        this.selectedCity = null;
        this.currentLang = 'pt';
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // City selection events - both card and button
        document.querySelectorAll('.city-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const city = card.getAttribute('data-city');
                this.selectCity(city);
            });
        });
        
        document.querySelectorAll('.city-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent double triggering
                const cityCard = e.target.closest('.city-card');
                const city = cityCard.getAttribute('data-city');
                this.selectCity(city);
            });
        });
    }

    selectCity(city) {
        this.selectedCity = city;
        console.log('Selected city:', city);
        
        // Store selected city in sessionStorage for the data viewer
        sessionStorage.setItem('selectedCity', city);
        
        // Navigate to data viewer
        this.navigateToDataViewer(city);
    }

    navigateToDataViewer(city) {
        // Use the main app's navigation method for proper URL routing
        if (window.simbaApp) {
            window.simbaApp.navigateToCity(city);
        }
    }

    setLanguage(lang) {
        this.currentLang = lang;
    }

    showCitySelection() {
        Utils.showPage('citySelection');
        this.selectedCity = null;
        sessionStorage.removeItem('selectedCity');
    }
}

// Export for use in main app
window.CitySelection = CitySelection;