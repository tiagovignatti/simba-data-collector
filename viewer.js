class SimbaViewer {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentData = null;
        this.filteredData = [];
        this.currentLang = 'pt';
        this.translations = {
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
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupComponents();
            });
        } else {
            this.setupComponents();
        }
    }

    setupComponents() {
        this.initMap();
        this.bindEvents();
        // Add a small delay to ensure everything is ready
        setTimeout(() => {
            this.loadAvailableFiles();
        }, 100);
    }

    initMap() {
        this.map = L.map('map').setView([-26.78, -48.63], 10);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    }

    bindEvents() {
        document.getElementById('loadData').addEventListener('click', () => this.loadSelectedFile());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCSV());
        document.getElementById('langToggle').addEventListener('click', () => this.toggleLanguage());
        document.getElementById('localityFilter').addEventListener('change', () => this.applyLocalityFilter());
        
        
        const modal = document.getElementById('detailModal');
        const closeBtn = document.querySelector('.close');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    async loadAvailableFiles() {
        const fileSelect = document.getElementById('dataFile');
        
        if (!fileSelect) {
            console.error('dataFile select element not found');
            return;
        }
        
        // Clear existing options except the first one
        while (fileSelect.children.length > 1) {
            fileSelect.removeChild(fileSelect.lastChild);
        }
        
        // Try to load files from index, with fallback to discovery
        const availableFiles = await this.loadFilesFromIndex();
        
        if (availableFiles.length === 0) {
            console.warn('No JSON files found in index. Using file discovery.');
            const discoveredFiles = await this.discoverJsonFiles();
            availableFiles.push(...discoveredFiles);
        }

        if (availableFiles.length === 0) {
            console.warn('No JSON files found. Using fallback list.');
            // Final fallback to known files
            availableFiles.push(
                'simba_Penha_2025-02-25_to_2024-01-01.json',
                'simba_Penha_2025-02-25_to_2025-01-01.json'
            );
        }

        availableFiles.forEach((file, index) => {
            const option = document.createElement('option');
            option.value = file;
            const displayName = file.replace('.json', '').replace('simba_', '').replace(/_/g, ' ');
            option.textContent = displayName;
            fileSelect.appendChild(option);
        });
        
        // Force refresh the select element
        fileSelect.style.display = 'none';
        fileSelect.offsetHeight; // Trigger reflow
        fileSelect.style.display = '';
        
        console.log(`Loaded ${availableFiles.length} data files`);
    }
    
    async loadFilesFromIndex() {
        try {
            const response = await fetch('files-index.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const indexData = await response.json();
            console.log('Loaded files from index:', indexData.files);
            return indexData.files || [];
            
        } catch (error) {
            console.debug('Could not load files index:', error.message);
            return [];
        }
    }
    
    async discoverJsonFiles() {
        const discoveredFiles = [];
        
        // Get list of files currently in public directory by trying to fetch them
        const patterns = [
            'simba_Penha_2025-02-25_to_2024-01-01.json',
            'simba_Penha_2025-02-25_to_2025-01-01.json',
            'simba_Penha_2024-06-01_to_2025-02-25.json',
            'simba_data_20250628_161619.json',
            'simba_data_20250628_162044.json'
        ];
        
        // Try to fetch each potential file
        const fetchPromises = patterns.map(async (filename) => {
            try {
                const response = await fetch(filename, { method: 'HEAD' });
                if (response.ok) {
                    return filename;
                }
            } catch (error) {
                console.debug(`File ${filename} not found`);
            }
            return null;
        });
        
        const results = await Promise.all(fetchPromises);
        
        // Filter out null results
        results.forEach(filename => {
            if (filename) {
                discoveredFiles.push(filename);
            }
        });
        
        return discoveredFiles;
    }

    async loadSelectedFile() {
        const fileSelect = document.getElementById('dataFile');
        const selectedFile = fileSelect.value;
        
        if (!selectedFile) {
            alert(this.t('selectFile'));
            return;
        }

        try {
            const response = await fetch(selectedFile);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            this.currentData = await response.json();
            this.filteredData = [...this.currentData.records];
            
            this.displayDatasetInfo();
            this.displayData();
            this.updateRecordCount();
            
        } catch (error) {
            console.error('Error loading data:', error);
            alert(`${this.t('loadError')} ${error.message}`);
        }
    }

    displayDatasetInfo() {
        if (!this.currentData) return;
        
        const infoDiv = document.getElementById('datasetInfo');
        const municipality = this.currentData.filters?.municipality || this.t('unknown');
        const startDate = this.currentData.filters?.start_date || this.t('unknown');
        const totalRecords = this.currentData.count || 0;
        
        document.getElementById('infoMunicipality').textContent = municipality;
        document.getElementById('infoStartDate').textContent = startDate;
        document.getElementById('infoEndDate').textContent = this.calculateEndDate();
        document.getElementById('infoTotalRecords').textContent = totalRecords;
        
        this.populateLocalityFilter();
        infoDiv.style.display = 'block';
    }

    parseDate(dateString) {
        if (!dateString) return null;
        try {
            return new Date(dateString);
        } catch {
            return null;
        }
    }

    calculateEndDate() {
        if (!this.currentData || !this.currentData.records.length) {
            return this.t("unknown");
        }
        
        const dates = this.currentData.records
            .map(record => record.eventDate)
            .filter(date => date)
            .map(dateString => {
                try {
                    return new Date(dateString);
                } catch {
                    return null;
                }
            })
            .filter(date => date && !isNaN(date.getTime()));
        
        if (dates.length === 0) {
            return this.t("unknown");
        }
        
        const latestDate = new Date(Math.max(...dates));
        return latestDate.toLocaleDateString("pt-BR");
    }
    displayData() {
        this.clearMarkers();
        this.displayOccurrencesList();
        this.addMarkersToMap();
    }

    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    }

    addMarkersToMap() {
        const bounds = [];
        
        this.filteredData.forEach((record, index) => {
            const lat = parseFloat(record.decimalLatitude);
            const lng = parseFloat(record.decimalLongitude);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                const marker = L.marker([lat, lng])
                    .bindPopup(this.createMarkerPopup(record))
                    .addTo(this.map);
                
                marker.on('click', () => this.showDetailModal(index));
                this.markers.push(marker);
                bounds.push([lat, lng]);
            }
        });

        if (bounds.length > 0) {
            this.map.fitBounds(bounds, { padding: [20, 20] });
        }
    }

    createMarkerPopup(record) {
        return `
            <div class="marker-popup">
                <strong>${record.scientificName || this.t('unknownSpecies')}</strong><br>
                <em>${record.municipality || this.t('unknownLocation')}</em><br>
                ${this.t('date')}: ${this.formatDate(record.eventDate)}<br>
                ${this.t('recordedBy')}: ${record.recordedBy || this.t('unknown')}
            </div>
        `;
    }

    displayOccurrencesList() {
        const container = document.getElementById('occurrencesList');
        
        if (this.filteredData.length === 0) {
            container.innerHTML = `<div class="no-data">${this.t('noOccurrences')}</div>`;
            return;
        }

        const html = this.filteredData.map((record, index) => {
            const media = this.parseMedia(record);
            const thumbnails = media.slice(0, 3).map(url => 
                `<img src="${url}" class="media-thumbnail" alt="Foto" onerror="this.style.display='none'" loading="lazy" onclick="window.open('${url}', '_blank')">`
            ).join('');
            
            return `
            <div class="occurrence-item" onclick="viewer.showDetailModal(${index})">
                <div class="occurrence-header">
                    <div class="species-name">${record.scientificName || this.t('unknownSpecies')}</div>
                    <div class="record-date">${this.formatDate(record.eventDate)}</div>
                </div>
                <div class="occurrence-details">
                    <div><strong>${this.t('location')}:</strong> ${record.municipality || this.t('unknown')}, ${record.stateProvince || this.t('unknown')}</div>
                    <div><strong>${this.t('recordedBy')}:</strong> ${record.recordedBy || this.t('unknown')}</div>
                    <div><strong>${this.t('lifeStage')}:</strong> ${record.lifeStage || this.t('unknown')}</div>
                    <div><strong>${this.t('habitat')}:</strong> ${record.habitat || this.t('unknown')}</div>
                    ${thumbnails ? `<div class="media-thumbnails">${thumbnails}</div>` : ''}
                </div>
            </div>
        `;
        }).join('');
        
        container.innerHTML = html;
    }

    showDetailModal(index) {
        const record = this.filteredData[index];
        const modal = document.getElementById('detailModal');
        const content = document.getElementById('detailContent');
        
        content.innerHTML = this.createDetailContent(record);
        modal.style.display = 'block';
    }

    createDetailContent(record) {
        const measurements = this.parseMeasurements(record);
        const media = this.parseMedia(record);
        
        return `
            <h3>${record.scientificName || 'Unknown Species'}</h3>
            
            <div class="detail-section">
                <h4>Basic Information</h4>
                <div class="detail-grid">
                    <div class="detail-item"><strong>Record ID:</strong> ${record.recordNumber || 'N/A'}</div>
                    <div class="detail-item"><strong>Event Date:</strong> ${this.formatDate(record.eventDate)}</div>
                    <div class="detail-item"><strong>Recorded By:</strong> ${record.recordedBy || 'N/A'}</div>
                    <div class="detail-item"><strong>Life Stage:</strong> ${record.lifeStage || 'N/A'}</div>
                    <div class="detail-item"><strong>Sex:</strong> ${record.sex || 'N/A'}</div>
                    <div class="detail-item"><strong>Individual Count:</strong> ${record.individualCount || 'N/A'}</div>
                </div>
            </div>

            <div class="detail-section">
                <h4>Location</h4>
                <div class="detail-grid">
                    <div class="detail-item"><strong>Municipality:</strong> ${record.municipality || 'N/A'}</div>
                    <div class="detail-item"><strong>State:</strong> ${record.stateProvince || 'N/A'}</div>
                    <div class="detail-item"><strong>Locality:</strong> ${record.locality || 'N/A'}</div>
                    <div class="detail-item"><strong>Habitat:</strong> ${record.habitat || 'N/A'}</div>
                    <div class="detail-item"><strong>Coordinates:</strong> ${record.decimalLatitude || 'N/A'}, ${record.decimalLongitude || 'N/A'}</div>
                </div>
            </div>

            <div class="detail-section">
                <h4>Taxonomy</h4>
                <div class="detail-grid">
                    <div class="detail-item"><strong>Kingdom:</strong> ${record.kingdom || 'N/A'}</div>
                    <div class="detail-item"><strong>Phylum:</strong> ${record.phylum || 'N/A'}</div>
                    <div class="detail-item"><strong>Class:</strong> ${record.class || 'N/A'}</div>
                    <div class="detail-item"><strong>Order:</strong> ${record.order || 'N/A'}</div>
                    <div class="detail-item"><strong>Family:</strong> ${record.family || 'N/A'}</div>
                    <div class="detail-item"><strong>Genus:</strong> ${record.genus || 'N/A'}</div>
                </div>
            </div>

            ${measurements.length > 0 ? `
                <div class="detail-section">
                    <h4>Measurements</h4>
                    <div class="detail-grid">
                        ${measurements.map(m => `<div class="detail-item"><strong>${m.type}:</strong> ${m.value} ${m.unit || ''}</div>`).join('')}
                    </div>
                </div>
            ` : ''}

            ${media.length > 0 ? `
                <div class="detail-section">
                    <h4>Associated Media</h4>
                    <div class="media-gallery">
                        ${media.map(url => `<img src="${url}" alt="Occurrence media" loading="lazy" onclick="window.open('${url}', '_blank')">`).join('')}
                    </div>
                </div>
            ` : ''}

            ${record.eventRemarks ? `
                <div class="detail-section">
                    <h4>Event Remarks</h4>
                    <p>${record.eventRemarks}</p>
                </div>
            ` : ''}
        `;
    }

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
    }

    parseMedia(record) {
        if (!record.associatedMedia) return [];
        return record.associatedMedia.split(',').map(url => url.trim()).filter(url => url);
    }

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
    }

    updateRecordCount() {
        const count = this.filteredData.length;
        const total = this.currentData ? this.currentData.count : 0;
        document.getElementById('recordCount').textContent = 
            this.t('showingRecords').replace('{count}', count);
    }

    exportCSV() {
        if (!this.filteredData.length) {
            alert(this.t('noDataExport'));
            return;
        }

        const headers = [
            'Record Number', 'Scientific Name', 'Event Date', 'Municipality', 
            'State Province', 'Latitude', 'Longitude', 'Recorded By', 
            'Life Stage', 'Sex', 'Habitat', 'Individual Count'
        ];

        const csvContent = [
            headers.join(','),
            ...this.filteredData.map(record => [
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
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `simba_occurrences_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    populateLocalityFilter() {
        const localitySelect = document.getElementById("localityFilter");
        if (!localitySelect || !this.currentData) return;
        
        // Clear existing options except the first one
        while (localitySelect.children.length > 1) {
            localitySelect.removeChild(localitySelect.lastChild);
        }
        
        // Get unique localities
        const localities = [...new Set(
            this.currentData.records
                .map(record => record.locality)
                .filter(locality => locality && locality.trim() !== "")
        )].sort();
        
        // Add locality options
        localities.forEach(locality => {
            const option = document.createElement("option");
            option.value = locality;
            option.textContent = locality;
            localitySelect.appendChild(option);
        });
    }

    applyLocalityFilter() {
        if (!this.currentData) return;
        
        const selectedLocality = document.getElementById("localityFilter").value;
        const localityCountDiv = document.getElementById("localityCount");
        const localityCountNumber = document.getElementById("localityCountNumber");
        
        if (selectedLocality === "") {
            // Show all records
            this.filteredData = [...this.currentData.records];
            localityCountDiv.style.display = "none";
        } else {
            // Filter by selected locality
            this.filteredData = this.currentData.records.filter(record => 
                record.locality === selectedLocality
            );
            
            // Show locality count
            localityCountNumber.textContent = this.filteredData.length;
            localityCountDiv.style.display = "block";
        }
        
        this.displayData();
        this.updateRecordCount();
    }
}

// Initialize when DOM is ready
let viewer;
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        viewer = new SimbaViewer();
    });
} else {
    viewer = new SimbaViewer();
}

// Add missing methods to the class
SimbaViewer.prototype.t = function(key) {
    return this.translations[this.currentLang][key] || key;
};

SimbaViewer.prototype.toggleLanguage = function() {
    this.currentLang = this.currentLang === 'pt' ? 'en' : 'pt';
    document.getElementById('langToggle').textContent = this.currentLang === 'pt' ? '🌐 EN' : '🌐 PT';
    document.documentElement.lang = this.currentLang === 'pt' ? 'pt-BR' : 'en';
    
    this.updateLanguageElements();
    
    if (this.currentData) {
        this.displayDatasetInfo();
        this.displayOccurrencesList();
        this.updateRecordCount();
    }
};

SimbaViewer.prototype.updateLanguageElements = function() {
    const elements = document.querySelectorAll('[data-pt][data-en]');
    elements.forEach(element => {
        const text = element.getAttribute(`data-${this.currentLang}`);
        if (text) {
            if (element.tagName === 'TITLE') {
                element.textContent = text;
            } else {
                element.innerHTML = text;
            }
        }
    });
};