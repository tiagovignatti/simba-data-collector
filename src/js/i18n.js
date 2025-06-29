// Internationalization (i18n) Service
class I18nService {
    constructor() {
        this.currentLanguage = 'pt';
        this.translations = {};
        this.fallbackLanguage = 'pt';
        this.observers = [];
    }

    async init(defaultLanguage = 'pt') {
        this.currentLanguage = defaultLanguage;
        await this.loadLanguage(this.currentLanguage);
        
        // Load fallback language if different
        if (this.fallbackLanguage !== this.currentLanguage) {
            await this.loadLanguage(this.fallbackLanguage);
        }
        
        this.updateUI();
    }

    async loadLanguage(language) {
        try {
            const basePath = this.getBasePath();
            const url = `${basePath}assets/i18n/${language}.json`;
            console.log(`Loading translations from: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load ${language} translations`);
            }
            
            const translations = await response.json();
            this.translations[language] = translations;
            
            console.log(`✅ Loaded ${language} translations`);
            return translations;
            
        } catch (error) {
            console.error(`❌ Error loading ${language} translations:`, error);
            return null;
        }
    }

    async setLanguage(language) {
        if (language === this.currentLanguage) return;
        
        // Load language if not already loaded
        if (!this.translations[language]) {
            await this.loadLanguage(language);
        }
        
        this.currentLanguage = language;
        this.updateUI();
        this.notifyObservers();
        
        // Update document language
        document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
        
        console.log(`🌐 Language changed to: ${language}`);
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Get translation with support for nested keys (e.g., 'app.title')
    t(key, params = {}) {
        const translation = this.getNestedTranslation(key, this.currentLanguage) 
                          || this.getNestedTranslation(key, this.fallbackLanguage) 
                          || key;
        
        // Replace parameters in translation
        return this.interpolate(translation, params);
    }

    getNestedTranslation(key, language) {
        const translations = this.translations[language];
        if (!translations) return null;
        
        const keys = key.split('.');
        let value = translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return typeof value === 'string' ? value : null;
    }

    interpolate(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    // Update all UI elements with i18n-* attributes
    updateUI() {
        // Update elements with i18n-text attribute
        document.querySelectorAll('[i18n-text]').forEach(element => {
            const key = element.getAttribute('i18n-text');
            element.textContent = this.t(key);
        });

        // Update elements with i18n-html attribute (for HTML content)
        document.querySelectorAll('[i18n-html]').forEach(element => {
            const key = element.getAttribute('i18n-html');
            element.innerHTML = this.t(key);
        });

        // Update elements with i18n-placeholder attribute
        document.querySelectorAll('[i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Update elements with i18n-title attribute
        document.querySelectorAll('[i18n-title]').forEach(element => {
            const key = element.getAttribute('i18n-title');
            element.title = this.t(key);
        });

        // Update page title
        const titleElement = document.querySelector('title[i18n-text]');
        if (titleElement) {
            const key = titleElement.getAttribute('i18n-text');
            titleElement.textContent = this.t(key);
        }

        // Update language toggle button
        this.updateLanguageToggle();
    }

    updateLanguageToggle() {
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.textContent = this.t('navigation.languageToggle');
            langToggle.title = this.currentLanguage === 'pt' 
                ? 'Change to English' 
                : 'Mudar para Português';
        }
    }

    // Observer pattern for components that need to react to language changes
    addObserver(callback) {
        this.observers.push(callback);
    }

    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    notifyObservers() {
        this.observers.forEach(callback => {
            try {
                callback(this.currentLanguage);
            } catch (error) {
                console.error('Error in i18n observer:', error);
            }
        });
    }

    // Utility method to get all available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    // Method to format dates according to current language
    formatDate(dateString) {
        if (!dateString) return this.t('species.unknown');
        
        try {
            const date = new Date(dateString);
            const locale = this.currentLanguage === 'pt' ? 'pt-BR' : 'en-US';
            return date.toLocaleDateString(locale);
        } catch {
            return dateString;
        }
    }

    // Method to format numbers according to current language
    formatNumber(number) {
        const locale = this.currentLanguage === 'pt' ? 'pt-BR' : 'en-US';
        return new Intl.NumberFormat(locale).format(number);
    }

    // Get base path for GitHub Pages deployment
    getBasePath() {
        // For GitHub Pages, extract repo name from pathname, for local dev return /
        if (window.location.hostname.includes('github.io')) {
            const pathSegments = window.location.pathname.split('/').filter(segment => segment);
            return pathSegments.length > 0 ? `/${pathSegments[0]}/` : '/';
        }
        return '/';
    }
}

// Create global i18n instance
window.i18n = new I18nService();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18nService;
}