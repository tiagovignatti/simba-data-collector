class YearlyStats {
    constructor() {
        this.yearlyData = new Map();
        this.chart = null;
        this.currentFilter = 'all';
        this.availableYears = [];
        this.availableLocalities = new Set();
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadYearlyData();
            this.setupEventListeners();
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing yearly stats:', error);
        }
    }

    async loadYearlyData() {
        const response = await fetch('files-index.json');
        const index = await response.json();
        
        this.availableYears = [];
        this.availableLocalities.clear();
        
        for (const filename of index.files) {
            const year = this.extractYearFromFilename(filename);
            if (year) {
                try {
                    const data = await this.loadYearData(filename);
                    this.yearlyData.set(year, data);
                    this.availableYears.push(year);
                    
                    // Collect all unique localities
                    data.records.forEach(record => {
                        if (record.locality) {
                            this.availableLocalities.add(record.locality);
                        }
                    });
                } catch (error) {
                    console.error(`Error loading data for ${filename}:`, error);
                }
            }
        }
        
        this.availableYears.sort();
        this.populateLocalityFilter();
    }

    extractYearFromFilename(filename) {
        const match = filename.match(/(\d{4})/);
        return match ? parseInt(match[1]) : null;
    }

    async loadYearData(filename) {
        const response = await fetch(filename);
        return await response.json();
    }

    populateLocalityFilter() {
        const filterSelect = document.getElementById('yearlyLocalityFilter');
        if (!filterSelect) return;

        filterSelect.innerHTML = '<option value="all">Todas as Localidades</option>';
        
        const sortedLocalities = Array.from(this.availableLocalities).sort();
        sortedLocalities.forEach(locality => {
            const option = document.createElement('option');
            option.value = locality;
            option.textContent = locality;
            filterSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        const filterSelect = document.getElementById('yearlyLocalityFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.updateChart();
            });
        }
    }

    getYearlyOccurrences(locality = 'all') {
        const yearlyOccurrences = {};
        
        this.availableYears.forEach(year => {
            const data = this.yearlyData.get(year);
            if (!data) return;
            
            if (locality === 'all') {
                yearlyOccurrences[year] = data.count;
            } else {
                const filteredRecords = data.records.filter(record => 
                    record.locality === locality
                );
                yearlyOccurrences[year] = filteredRecords.length;
            }
        });
        
        return yearlyOccurrences;
    }

    renderChart() {
        const canvas = document.getElementById('yearlyChart');
        if (!canvas) {
            console.error('Yearly chart canvas not found');
            return;
        }

        // Ensure Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not loaded yet, retrying...');
            setTimeout(() => this.renderChart(), 100);
            return;
        }

        this.updateChart();
    }

    updateChart() {
        const canvas = document.getElementById('yearlyChart');
        if (!canvas) {
            console.error('Canvas not found in updateChart');
            return;
        }

        const ctx = canvas.getContext('2d');
        const occurrences = this.getYearlyOccurrences(this.currentFilter);
        
        console.log('Yearly occurrences data:', occurrences);
        
        const years = Object.keys(occurrences);
        const counts = Object.values(occurrences);
        
        if (years.length === 0) {
            console.error('No yearly data available for chart');
            return;
        }
        
        if (this.chart) {
            this.chart.destroy();
        }

        const totalOccurrences = counts.reduce((sum, count) => sum + count, 0);
        const averageOccurrences = totalOccurrences / counts.length;

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: this.currentFilter === 'all' ? 'Total de Ocorrências' : `Ocorrências em ${this.currentFilter}`,
                    data: counts,
                    backgroundColor: 'rgba(46, 82, 152, 0.8)',
                    borderColor: 'rgba(46, 82, 152, 1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(46, 82, 152, 0.9)',
                    hoverBorderColor: 'rgba(46, 82, 152, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: this.currentFilter === 'all' 
                            ? 'Ocorrências de Resgate por Ano' 
                            : `Ocorrências em ${this.currentFilter} por Ano`,
                        font: {
                            size: 18,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Ocorrências'
                        },
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Ano'
                        }
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeInOutQuart'
                }
            }
        });

        this.updateSummaryStats(occurrences, totalOccurrences, averageOccurrences);
    }

    updateSummaryStats(occurrences, total, average) {
        const summaryDiv = document.getElementById('yearlySummary');
        if (!summaryDiv) return;

        const years = Object.keys(occurrences);
        const counts = Object.values(occurrences);
        const maxYear = years[counts.indexOf(Math.max(...counts))];
        const minYear = years[counts.indexOf(Math.min(...counts))];
        const maxCount = Math.max(...counts);
        const minCount = Math.min(...counts);

        const locationText = this.currentFilter === 'all' 
            ? 'em todas as localidades' 
            : `em ${this.currentFilter}`;

        summaryDiv.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Total de Ocorrências ${locationText}:</span>
                    <span class="stat-value">${total}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Média por Ano:</span>
                    <span class="stat-value">${Math.round(average)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Ano com Mais Ocorrências:</span>
                    <span class="stat-value">${maxYear} (${maxCount})</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Ano com Menos Ocorrências:</span>
                    <span class="stat-value">${minYear} (${minCount})</span>
                </div>
            </div>
        `;
    }

    show() {
        console.log('YearlyStats.show() called');
        const container = document.getElementById('yearlyStatsSection');
        if (container) {
            console.log('Found yearlyStatsSection container');
            container.style.display = 'block';
            if (!this.isInitialized) {
                console.log('Initializing yearly stats...');
                this.init().then(() => {
                    console.log('Yearly stats initialized, rendering chart...');
                    this.renderChart();
                });
            } else {
                console.log('Yearly stats already initialized, rendering chart...');
                this.renderChart();
            }
        } else {
            console.error('yearlyStatsSection container not found');
        }
    }

    hide() {
        const container = document.getElementById('yearlyStatsSection');
        if (container) {
            container.style.display = 'none';
        }
    }
}