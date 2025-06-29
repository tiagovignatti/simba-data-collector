// Shared utilities and constants

// Translation system
const translations = {
    pt: {
        noDataLoaded: 'Nenhum dado carregado',
        showingRecords: 'Mostrando {count} ocorrências',
        noOccurrences: 'Nenhuma ocorrência encontrada',
        unknownSpecies: 'Espécie Desconhecida',
        unknownLocation: 'Local Desconhecido',
        unknown: 'Desconhecido',
        recordedBy: 'Registrado por:',
        date: 'Data:',
        location: 'Local:',
        lifeStage: 'Estágio de Vida:',
        habitat: 'Habitat:',
        loadError: 'Falha ao carregar arquivo de dados:',
        selectFile: 'Por favor selecione um arquivo de dados',
        noDataExport: 'Nenhum dado para exportar'
    },
    en: {
        noDataLoaded: 'No data loaded',
        showingRecords: 'Showing {count} occurrences',
        noOccurrences: 'No occurrences found',
        unknownSpecies: 'Unknown Species',
        unknownLocation: 'Unknown Location',
        unknown: 'Unknown',
        recordedBy: 'Recorded by:',
        date: 'Date:',
        location: 'Location:',
        lifeStage: 'Life Stage:',
        habitat: 'Habitat:',
        loadError: 'Failed to load data file:',
        selectFile: 'Please select a data file',
        noDataExport: 'No data to export'
    }
};

// Utility functions
const Utils = {
    // Get translation for current language
    t(key, lang = 'pt') {
        return translations[lang][key] || key;
    },

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    },

    // Parse date safely
    parseDate(dateString) {
        if (!dateString) return null;
        try {
            return new Date(dateString);
        } catch {
            return null;
        }
    },

    // Parse media URLs from record
    parseMedia(record) {
        if (!record.associatedMedia) return [];
        return record.associatedMedia.split(',').map(url => url.trim()).filter(url => url);
    },

    // Parse measurements from record
    parseMeasurements(record) {
        const measurements = [];
        if (record.measurementType && record.measurementValue) {
            try {
                const types = JSON.parse(record.measurementType.replace(/"/g, '"'));
                const values = JSON.parse(record.measurementValue.replace(/"/g, '"'));
                
                if (Array.isArray(types) && Array.isArray(values)) {
                    for (let i = 0; i < Math.min(types.length, values.length); i++) {
                        if (values[i] && values[i].trim() !== '') {
                            measurements.push({
                                type: types[i],
                                value: values[i],
                                unit: record.measurementUnit || ''
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn('Error parsing measurements:', e);
            }
        }
        return measurements;
    },

    // Show/hide page sections
    showPage(pageId) {
        const pages = ['citySelection', 'dataViewer'];
        pages.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = id === pageId ? 'block' : 'none';
            }
        });
    },

    // Update language elements
    updateLanguageElements(lang) {
        const elements = document.querySelectorAll('[data-pt][data-en]');
        elements.forEach(element => {
            const text = element.getAttribute(`data-${lang}`);
            if (text) {
                if (element.tagName === 'TITLE') {
                    element.textContent = text;
                } else {
                    element.innerHTML = text;
                }
            }
        });
    },

    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Generate CSV content from data
    generateCSVContent(data) {
        const headers = [
            'Record Number', 'Scientific Name', 'Event Date', 'Municipality', 
            'State Province', 'Latitude', 'Longitude', 'Recorded By', 
            'Life Stage', 'Sex', 'Habitat', 'Individual Count'
        ];

        const csvContent = [
            headers.join(','),
            ...data.map(record => [
                record.recordNumber || '',
                record.scientificName || '',
                record.eventDate || '',
                record.municipality || '',
                record.stateProvince || '',
                record.decimalLatitude || '',
                record.decimalLongitude || '',
                record.recordedBy || '',
                record.lifeStage || '',
                record.sex || '',
                record.habitat || '',
                record.individualCount || ''
            ].map(field => `"${field}"`).join(","))
        ].join('\\n');

        return csvContent;
    },

    // Download file helper
    downloadFile(content, filename, mimeType = 'text/csv') {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
};

// Export for use in other modules
window.Utils = Utils;