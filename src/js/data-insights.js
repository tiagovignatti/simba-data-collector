class DataInsights {
    constructor() {
        this.allYearlyData = new Map();
        this.insights = [];
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadAllYearlyData();
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing data insights:', error);
        }
    }

    async loadAllYearlyData() {
        const response = await fetch('files-index.json');
        const index = await response.json();
        
        this.allYearlyData.clear();
        
        for (const filename of index.files) {
            const year = this.extractYearFromFilename(filename);
            if (year) {
                try {
                    const data = await this.loadYearData(filename);
                    this.allYearlyData.set(year, data);
                } catch (error) {
                    console.error(`Error loading data for ${filename}:`, error);
                }
            }
        }
    }

    extractYearFromFilename(filename) {
        const match = filename.match(/(\d{4})/);
        return match ? parseInt(match[1]) : null;
    }

    async loadYearData(filename) {
        const response = await fetch(filename);
        return await response.json();
    }

    generateInsights() {
        this.insights = [];
        
        // Generate different types of insights
        this.addYearlyTrendInsights();
        this.addLocationInsights();
        this.addAnomalyInsights();
        this.addSeasonalInsights();
        this.addSpeciesInsights();
        
        return this.insights;
    }

    addYearlyTrendInsights() {
        const currentYear = new Date().getFullYear();
        const years = Array.from(this.allYearlyData.keys()).sort();
        
        // Separate completed years from current incomplete year
        const completedYears = years.filter(year => year !== currentYear);
        const completedCounts = completedYears.map(year => this.allYearlyData.get(year).count);
        
        if (completedCounts.length < 2) return;

        // Peak year (only from completed years)
        const maxCount = Math.max(...completedCounts);
        const maxYear = completedYears[completedCounts.indexOf(maxCount)];
        
        // Lowest year (only from completed years)
        const minCount = Math.min(...completedCounts);
        const minYear = completedYears[completedCounts.indexOf(minCount)];

        this.insights.push({
            type: 'peak',
            icon: '📈',
            title: 'Ano de Maior Atividade',
            value: `${maxYear}`,
            subtitle: `${maxCount} ocorrências registradas`,
            description: 'Maior número de resgates de fauna marinha registrados em um único ano.',
            priority: 1
        });

        this.insights.push({
            type: 'low',
            icon: '📉',
            title: 'Ano de Menor Atividade',
            value: `${minYear}`,
            subtitle: `${minCount} ocorrências registradas`,
            description: 'Menor número de resgates em anos completos (excluindo ano atual).',
            priority: 2
        });

        // Add current year status if available
        if (years.includes(currentYear)) {
            const currentYearCount = this.allYearlyData.get(currentYear).count;
            this.insights.push({
                type: 'current',
                icon: '📅',
                title: 'Ano Atual (em andamento)',
                value: `${currentYearCount} ocorrências até agora`,
                subtitle: `${currentYear}`,
                description: `Dados parciais do ano atual (até ${new Date().toLocaleDateString('pt-BR', {month: 'long'})}).`,
                priority: 3
            });
        }

        // Trend analysis (use only completed years for trend)
        if (completedCounts.length >= 3) {
            const recentCompletedYears = completedYears.slice(-3);
            const recentCompletedCounts = recentCompletedYears.map(year => this.allYearlyData.get(year).count);
            const trend = this.calculateTrend(recentCompletedCounts);
            
            if (Math.abs(trend) > 10) {
                this.insights.push({
                    type: 'trend',
                    icon: trend > 0 ? '📊' : '📉',
                    title: trend > 0 ? 'Tendência Crescente' : 'Tendência Decrescente',
                    value: `${Math.abs(trend).toFixed(1)}%`,
                    subtitle: `nos últimos 3 anos`,
                    description: trend > 0 ? 
                        'Observa-se um aumento nas ocorrências de resgate nos anos recentes.' :
                        'Observa-se uma diminuição nas ocorrências de resgate nos anos recentes.',
                    priority: 3
                });
            }
        }
    }

    addLocationInsights() {
        const locationStats = new Map();
        const locationYearlyStats = new Map();

        // Aggregate data by location
        this.allYearlyData.forEach((data, year) => {
            data.records.forEach(record => {
                const location = record.locality || 'Local não identificado';
                
                if (!locationStats.has(location)) {
                    locationStats.set(location, 0);
                    locationYearlyStats.set(location, new Map());
                }
                
                locationStats.set(location, locationStats.get(location) + 1);
                
                const yearlyMap = locationYearlyStats.get(location);
                yearlyMap.set(year, (yearlyMap.get(year) || 0) + 1);
            });
        });

        // Find hotspot location
        let maxLocation = '';
        let maxCount = 0;
        locationStats.forEach((count, location) => {
            if (count > maxCount) {
                maxCount = count;
                maxLocation = location;
            }
        });

        if (maxLocation) {
            this.insights.push({
                type: 'hotspot',
                icon: '💀',
                title: 'Principal Área de Ocorrências',
                value: maxLocation,
                subtitle: `${maxCount} ocorrências no total`,
                description: 'Local com maior concentração de resgates de fauna marinha.',
                priority: 4
            });
        }

        // Find location with biggest variation
        let maxVariation = 0;
        let variationLocation = '';
        let variationDetails = '';

        locationYearlyStats.forEach((yearlyData, location) => {
            const counts = Array.from(yearlyData.values());
            if (counts.length >= 2) {
                const max = Math.max(...counts);
                const min = Math.min(...counts);
                const variation = max - min;
                
                if (variation > maxVariation && variation > 5) {
                    maxVariation = variation;
                    variationLocation = location;
                    
                    const maxYear = Array.from(yearlyData.entries()).find(([year, count]) => count === max)[0];
                    const minYear = Array.from(yearlyData.entries()).find(([year, count]) => count === min)[0];
                    variationDetails = `${max} em ${maxYear} vs ${min} em ${minYear}`;
                }
            }
        });

        if (variationLocation) {
            this.insights.push({
                type: 'variation',
                icon: '📊',
                title: 'Maior Variação por Local',
                value: variationLocation,
                subtitle: variationDetails,
                description: 'Local com maior diferença de ocorrências entre anos.',
                priority: 5
            });
        }
    }

    addAnomalyInsights() {
        const currentYear = new Date().getFullYear();
        const years = Array.from(this.allYearlyData.keys()).sort();
        const counts = years.map(year => this.allYearlyData.get(year).count);
        
        if (counts.length < 3) return;

        // Find significant year-over-year changes (excluding transitions to current incomplete year)
        for (let i = 1; i < counts.length; i++) {
            const currentYear_i = years[i];
            
            // Skip if this comparison involves the current incomplete year
            if (currentYear_i === currentYear) continue;
            
            const currentCount = counts[i];
            const previousCount = counts[i - 1];
            const change = ((currentCount - previousCount) / previousCount) * 100;
            
            if (Math.abs(change) > 30) { // 30% change threshold
                this.insights.push({
                    type: 'anomaly',
                    icon: change > 0 ? '📈' : '📉',
                    title: change > 0 ? 'Aumento Significativo' : 'Queda Significativa',
                    value: `${Math.abs(change).toFixed(0)}%`,
                    subtitle: `de ${years[i-1]} para ${years[i]}`,
                    description: `${change > 0 ? 'Aumento' : 'Diminuição'} expressivo de ${previousCount} para ${currentCount} ocorrências.`,
                    priority: 6
                });
            }
        }
    }

    addSeasonalInsights() {
        const monthlyStats = new Map();
        
        // Aggregate by month across all years
        this.allYearlyData.forEach(data => {
            data.records.forEach(record => {
                if (record.eventDate) {
                    const date = new Date(record.eventDate);
                    const month = date.getMonth();
                    monthlyStats.set(month, (monthlyStats.get(month) || 0) + 1);
                }
            });
        });

        if (monthlyStats.size > 0) {
            // Find peak month
            let peakMonth = 0;
            let peakCount = 0;
            monthlyStats.forEach((count, month) => {
                if (count > peakCount) {
                    peakCount = count;
                    peakMonth = month;
                }
            });

            const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];

            this.insights.push({
                type: 'seasonal',
                icon: '📅',
                title: 'Pico Sazonal',
                value: monthNames[peakMonth],
                subtitle: `${peakCount} ocorrências`,
                description: 'Mês com maior concentração de resgates ao longo dos anos.',
                priority: 7
            });
        }
    }

    addSpeciesInsights() {
        const speciesStats = new Map();
        
        // Aggregate by species/taxon
        this.allYearlyData.forEach(data => {
            data.records.forEach(record => {
                let species = 'Espécie não identificada';
                
                if (record.scientificName) {
                    species = record.scientificName;
                } else if (record.vernacularName) {
                    species = record.vernacularName;
                } else if (record.taxonRank && record.genus) {
                    species = record.genus;
                }
                
                speciesStats.set(species, (speciesStats.get(species) || 0) + 1);
            });
        });

        if (speciesStats.size > 0) {
            // Find most common species
            let topSpecies = '';
            let topCount = 0;
            speciesStats.forEach((count, species) => {
                if (count > topCount) {
                    topCount = count;
                    topSpecies = species;
                }
            });

            this.insights.push({
                type: 'species',
                icon: '🐢',
                title: 'Espécie Mais Comum',
                value: topSpecies,
                subtitle: `${topCount} ocorrências`,
                description: 'Espécie com maior número de registros de resgate.',
                priority: 8
            });
        }
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.ceil(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        return ((secondAvg - firstAvg) / firstAvg) * 100;
    }

    renderInsightsDashboard() {
        if (!this.isInitialized) {
            this.init().then(() => {
                this.renderInsightsDashboard();
            });
            return;
        }

        const insights = this.generateInsights();
        const container = document.getElementById('insightsDashboard');
        
        if (!container) return;

        // Sort insights by priority and take top 6
        const topInsights = insights
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 6);

        if (topInsights.length === 0) {
            container.innerHTML = '<div class="no-insights">Carregando insights...</div>';
            return;
        }

        const insightsHTML = topInsights.map(insight => `
            <div class="insight-card ${insight.type}">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h4 class="insight-title">${insight.title}</h4>
                    <div class="insight-value">${insight.value}</div>
                    <div class="insight-subtitle">${insight.subtitle}</div>
                    <p class="insight-description">${insight.description}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="insights-header">
                <h3>Insights</h3>
            </div>
            <div class="insights-grid">
                ${insightsHTML}
            </div>
        `;
    }

    show() {
        const container = document.getElementById('insightsDashboard');
        if (container) {
            container.style.display = 'block';
            this.renderInsightsDashboard();
        }
    }

    hide() {
        const container = document.getElementById('insightsDashboard');
        if (container) {
            container.style.display = 'none';
        }
    }
}