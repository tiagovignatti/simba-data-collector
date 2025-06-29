// Data Viewer Page Logic

class DataViewer {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentData = null;
        this.filteredData = [];
        this.selectedCity = null;
        this.currentLang = 'pt';
        this.init();
    }

    init() {
        // Initialize map when the data viewer is shown
        this.initMap();
        this.bindEvents();
    }

    initMap() {
        // Only initialize if map container exists and map hasn't been created
        const mapContainer = document.getElementById('map');
        if (mapContainer && !this.map) {
            this.map = L.map('map').setView([-26.78, -48.63], 10);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
        }
    }

    bindEvents() {
        // Data viewer specific events
        const periodSelect = document.getElementById('periodSelect');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => this.loadSelectedPeriod());
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCSV());
        }

        const localityFilter = document.getElementById('localityFilter');
        if (localityFilter) {
            localityFilter.addEventListener('change', () => this.applyLocalityFilter());
        }

        // Back button
        const backBtn = document.getElementById('backToSelection');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBackToSelection());
        }

        // Modal events
        const modal = document.getElementById('detailModal');
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    setSelectedCity(city) {
        this.selectedCity = city;
    }

    setLanguage(lang) {
        this.currentLang = lang;
        
        // Update period display names when language changes
        if (this.availablePeriods) {
            this.updatePeriodDisplayNames();
        }
    }

    updatePeriodDisplayNames() {
        const periodSelect = document.getElementById('periodSelect');
        if (periodSelect && this.availablePeriods) {
            // Update each option's display name
            this.availablePeriods.forEach((period, index) => {
                const option = periodSelect.options[index + 1]; // +1 to skip loading option
                if (option) {
                    const newDisplayName = this.formatPeriodDisplay(period.year, period.dateRange);
                    option.textContent = newDisplayName;
                    period.displayName = newDisplayName;
                }
            });
        }
    }

    goBackToSelection() {
        // Clear data and reset state
        this.currentData = null;
        this.filteredData = [];
        this.selectedCity = null;
        
        // Clear map markers
        this.clearMarkers();
        
        // Navigate back to city selection using main app routing
        if (window.simbaApp) {
            window.simbaApp.showCitySelection();
        }
    }

    async loadAvailablePeriods() {
        const periodSelect = document.getElementById('periodSelect');
        
        if (!periodSelect) {
            console.error('periodSelect element not found');
            return;
        }
        
        // Clear existing options
        periodSelect.innerHTML = '';
        
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

        // Extract years from filenames and create period options
        const periods = await this.extractPeriodsFromFiles(availableFiles);
        
        periods.forEach(period => {
            const option = document.createElement('option');
            option.value = period.year;
            option.textContent = period.displayName;
            option.dataset.files = JSON.stringify(period.files);
            periodSelect.appendChild(option);
        });
        
        console.log(`Loaded ${periods.length} periods`);
        
        // Store available files and periods
        this.availableFiles = availableFiles;
        this.availablePeriods = periods;
    }

    async extractPeriodsFromFiles(files) {
        const periodMap = new Map();
        
        // Filter files to prefer clean year files over date-range files
        for (const filename of files) {
            // Look for simple year pattern like "simba_Penha_2025.json"
            const cleanYearMatch = filename.match(/simba_.*_(\d{4})\.json$/);
            if (cleanYearMatch) {
                const year = cleanYearMatch[1];
                periodMap.set(year, {
                    year: year,
                    displayName: year,
                    files: [filename], // Use only the clean year file
                    dateRange: null
                });
            }
        }
        
        // If no clean year files found, fall back to any year pattern
        if (periodMap.size === 0) {
            for (const filename of files) {
                const yearMatch = filename.match(/(\d{4})/);
                if (yearMatch) {
                    const year = yearMatch[1];
                    if (!periodMap.has(year)) {
                        periodMap.set(year, {
                            year: year,
                            displayName: year,
                            files: [filename],
                            dateRange: null
                        });
                    }
                }
            }
        }
        
        // Now get actual date ranges from file data
        for (const [year, periodInfo] of periodMap) {
            const dateRange = await this.getDateRangeForPeriod(periodInfo.files);
            periodInfo.dateRange = dateRange;
            periodInfo.displayName = this.formatPeriodDisplay(year, dateRange);
        }
        
        // Convert to array and sort by year (newest first)
        const periods = Array.from(periodMap.values()).sort((a, b) => b.year - a.year);
        
        return periods;
    }

    async getDateRangeForPeriod(files) {
        let startDate = null;
        let endDate = null;
        
        // Only load the first available file to get date range for performance
        // This assumes all files for a year contain similar date ranges
        const cityFiles = files.filter(filename => 
            !this.selectedCity || filename.toLowerCase().includes(this.selectedCity.toLowerCase())
        );
        
        const fileToCheck = cityFiles.length > 0 ? cityFiles[0] : files[0];
        
        if (fileToCheck) {
            try {
                const basePath = this.getBasePath();
                const response = await fetch(`${basePath}${fileToCheck}`);
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.records && data.records.length > 0) {
                        const dates = data.records
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
                        
                        if (dates.length > 0) {
                            startDate = new Date(Math.min(...dates));
                            endDate = new Date(Math.max(...dates));
                        }
                    }
                }
            } catch (error) {
                console.warn(`Could not load date range for ${fileToCheck}:`, error);
            }
        }
        
        return { startDate, endDate };
    }

    formatPeriodDisplay(year, dateRange) {
        // Simply return the year - clean and simple
        return year;
    }
    
    async loadFilesFromIndex() {
        try {
            const basePath = this.getBasePath();
            const response = await fetch(`${basePath}files-index.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const indexData = await response.json();
            console.log('Loaded files from index:', indexData.files);
            
            // Filter files by selected city if one is selected
            let files = indexData.files || [];
            if (this.selectedCity) {
                files = files.filter(filename => {
                    // Check if filename contains the selected city name
                    return filename.toLowerCase().includes(this.selectedCity.toLowerCase());
                });
                console.log(`Filtered ${files.length} files for city: ${this.selectedCity}`);
            }
            
            return files;
            
        } catch (error) {
            console.debug('Could not load files index:', error.message);
            return [];
        }
    }
    
    async discoverJsonFiles() {
        const discoveredFiles = [];
        
        // Get list of files currently in public directory by trying to fetch them
        const patterns = [
            'simba_Penha_2021.json',
            'simba_Penha_2022.json',
            'simba_Penha_2023.json',
            'simba_Penha_2024.json',
            'simba_Penha_2025.json',
            'simba_Penha_2025-02-25_to_2024-01-01.json',
            'simba_Penha_2025-02-25_to_2025-01-01.json'
        ];
        
        // Try to fetch each potential file
        const fetchPromises = patterns.map(async (filename) => {
            try {
                const basePath = this.getBasePath();
                const response = await fetch(`${basePath}${filename}`, { method: 'HEAD' });
                if (response.ok) {
                    return filename;
                }
            } catch (error) {
                console.debug(`File ${filename} not found`);
            }
            return null;
        });
        
        const results = await Promise.all(fetchPromises);
        
        // Filter out null results and filter by city if selected
        results.forEach(filename => {
            if (filename) {
                if (!this.selectedCity || filename.toLowerCase().includes(this.selectedCity.toLowerCase())) {
                    discoveredFiles.push(filename);
                }
            }
        });
        
        console.log(`Discovered ${discoveredFiles.length} files for city: ${this.selectedCity || 'all'}`);
        return discoveredFiles;
    }

    async loadSelectedPeriod() {
        const periodSelect = document.getElementById('periodSelect');
        const selectedYear = periodSelect.value;
        
        if (!selectedYear) {
            return;
        }

        // Find the best file for this year and city
        const selectedOption = periodSelect.options[periodSelect.selectedIndex];
        const filesForPeriod = JSON.parse(selectedOption.dataset.files || '[]');
        
        let fileToLoad = null;
        
        if (this.selectedCity) {
            // Filter files by city name
            const cityFiles = filesForPeriod.filter(filename => 
                filename.toLowerCase().includes(this.selectedCity.toLowerCase())
            );
            
            if (cityFiles.length > 0) {
                // Use the first (or best matching) file for this city
                fileToLoad = cityFiles[0];
            }
        }
        
        // Fall back to first file if no city-specific match
        if (!fileToLoad && filesForPeriod.length > 0) {
            fileToLoad = filesForPeriod[0];
        }
        
        if (fileToLoad) {
            console.log(`Loading period ${selectedYear} with file: ${fileToLoad}`);
            await this.loadFileByName(fileToLoad);
        } else {
            console.error(`No data file found for period ${selectedYear}`);
        }
    }

    displayDatasetInfo() {
        if (!this.currentData) return;
        
        const infoDiv = document.getElementById('datasetInfo');
        const municipality = this.currentData.filters?.municipality || Utils.t('unknown', this.currentLang);
        const startDate = this.currentData.filters?.start_date || Utils.t('unknown', this.currentLang);
        const totalRecords = this.currentData.count || 0;
        
        const municipalityEl = document.getElementById('infoMunicipality');
        const startDateEl = document.getElementById('infoStartDate');
        const endDateEl = document.getElementById('infoEndDate');
        const totalRecordsEl = document.getElementById('infoTotalRecords');
        
        if (municipalityEl) municipalityEl.textContent = municipality;
        if (startDateEl) startDateEl.textContent = startDate;
        if (endDateEl) endDateEl.textContent = this.calculateEndDate();
        if (totalRecordsEl) totalRecordsEl.textContent = totalRecords;
        
        this.populateLocalityFilter();
        if (infoDiv) infoDiv.style.display = 'block';
    }

    calculateEndDate() {
        if (!this.currentData || !this.currentData.records.length) {
            return Utils.t("unknown", this.currentLang);
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
            return Utils.t("unknown", this.currentLang);
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
        if (this.map) {
            this.markers.forEach(marker => this.map.removeLayer(marker));
        }
        this.markers = [];
    }

    addMarkersToMap() {
        if (!this.map) return;
        
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
                <strong>${record.scientificName || Utils.t('unknownSpecies', this.currentLang)}</strong><br>
                <em>${record.municipality || Utils.t('unknownLocation', this.currentLang)}</em><br>
                ${Utils.t('date', this.currentLang)}: ${Utils.formatDate(record.eventDate)}<br>
                ${Utils.t('recordedBy', this.currentLang)}: ${record.recordedBy || Utils.t('unknown', this.currentLang)}
            </div>
        `;
    }

    displayOccurrencesList() {
        const container = document.getElementById('occurrencesList');
        if (!container) return;
        
        if (this.filteredData.length === 0) {
            container.innerHTML = `<div class="no-data">${Utils.t('noOccurrences', this.currentLang)}</div>`;
            return;
        }

        const html = this.filteredData.map((record, index) => {
            const media = Utils.parseMedia(record);
            const thumbnails = media.slice(0, 3).map(url => 
                `<img src="${url}" class="media-thumbnail" alt="Foto" onerror="this.style.display='none'" loading="lazy" onclick="window.open('${url}', '_blank')">`
            ).join('');
            
            return `
            <div class="occurrence-item" onclick="window.dataViewer.showDetailModal(${index})">
                <div class="occurrence-header">
                    <div class="species-name">${record.scientificName || Utils.t('unknownSpecies', this.currentLang)}</div>
                    <div class="record-date">${Utils.formatDate(record.eventDate)}</div>
                </div>
                <div class="occurrence-details">
                    <div><strong>${Utils.t('location', this.currentLang)}:</strong> ${record.municipality || Utils.t('unknown', this.currentLang)}, ${record.stateProvince || Utils.t('unknown', this.currentLang)}</div>
                    <div><strong>${Utils.t('recordedBy', this.currentLang)}:</strong> ${record.recordedBy || Utils.t('unknown', this.currentLang)}</div>
                    <div><strong>${Utils.t('lifeStage', this.currentLang)}:</strong> ${record.lifeStage || Utils.t('unknown', this.currentLang)}</div>
                    <div><strong>${Utils.t('habitat', this.currentLang)}:</strong> ${record.habitat || Utils.t('unknown', this.currentLang)}</div>
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
        
        if (content) {
            content.innerHTML = this.createDetailContent(record);
        }
        if (modal) {
            modal.style.display = 'block';
        }
    }

    createDetailContent(record) {
        const measurements = Utils.parseMeasurements(record);
        const media = Utils.parseMedia(record);
        
        return `
            <h3>${record.scientificName || 'Unknown Species'}</h3>
            
            <div class="detail-section">
                <h4>Basic Information</h4>
                <div class="detail-grid">
                    <div class="detail-item"><strong>Record ID:</strong> ${record.recordNumber || 'N/A'}</div>
                    <div class="detail-item"><strong>Event Date:</strong> ${Utils.formatDate(record.eventDate)}</div>
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

    updateRecordCount() {
        const count = this.filteredData.length;
        const recordCountEl = document.getElementById('recordCount');
        if (recordCountEl) {
            recordCountEl.textContent = Utils.t('showingRecords', this.currentLang).replace('{count}', count);
        }
    }

    exportCSV() {
        if (!this.filteredData.length) {
            alert(Utils.t('noDataExport', this.currentLang));
            return;
        }

        const csvContent = Utils.generateCSVContent(this.filteredData);
        const filename = `simba_occurrences_${new Date().toISOString().split('T')[0]}.csv`;
        Utils.downloadFile(csvContent, filename);
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
            if (localityCountDiv) localityCountDiv.style.display = "none";
        } else {
            // Filter by selected locality
            this.filteredData = this.currentData.records.filter(record => 
                record.locality === selectedLocality
            );
            
            // Show locality count
            if (localityCountNumber) localityCountNumber.textContent = this.filteredData.length;
            if (localityCountDiv) localityCountDiv.style.display = "block";
        }
        
        this.displayData();
        this.updateRecordCount();
    }

    autoLoadRecentData() {
        if (!this.availablePeriods || this.availablePeriods.length === 0) {
            console.log('No available periods to auto-load');
            return;
        }

        // Find the most recent period (2025 preferred, then most recent year)
        const mostRecentPeriod = this.availablePeriods[0]; // Already sorted newest first
        
        console.log(`Auto-loading most recent period: ${mostRecentPeriod.year}`);
        
        // Set the dropdown to the most recent period
        const periodSelect = document.getElementById('periodSelect');
        if (periodSelect) {
            periodSelect.value = mostRecentPeriod.year;
        }
        
        // Load the data for this period
        this.loadSelectedPeriod();
    }

    async loadFileByName(filename) {
        try {
            const basePath = this.getBasePath();
            const response = await fetch(`${basePath}${filename}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            this.currentData = await response.json();
            this.filteredData = [...this.currentData.records];
            
            this.displayDatasetInfo();
            this.displayData();
            this.updateRecordCount();
            
            console.log(`Successfully loaded ${filename} with ${this.currentData.records.length} records`);
            
        } catch (error) {
            console.error('Error loading data file:', error);
            // Don't show alert for auto-loading, just log the error
        }
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

// Export for use in main app
window.DataViewer = DataViewer;