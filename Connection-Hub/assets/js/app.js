/**
 * Main Application Module
 * Coordinates the graph visualization and data management
 */

class ConnectionHubApp {
    constructor() {
        this.graph = null;
        this.api = null;
        this.currentData = [];
        this.currentConnectorType = 'relatedTo';
        this.modal = null;
        
        this.init();
    }

    async init() {
        // Initialize SharePoint API
        this.api = new SharePointAPI(sharePointConfig);
        
        // Initialize Graph
        this.graph = new NetworkGraph('network-graph');
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Setup modal
        this.setupModal();
        
        // Load initial data
        await this.loadData();
    }

    setupEventListeners() {
        // Connector selector change
        document.getElementById('connector-select').addEventListener('change', (e) => {
            this.currentConnectorType = e.target.value;
            this.renderGraph();
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadData();
        });

        // Reset zoom button
        document.getElementById('reset-zoom-btn').addEventListener('click', () => {
            this.graph.resetZoom();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    setupModal() {
        this.modal = document.getElementById('data-modal');
        const closeBtn = document.querySelector('.close-btn');
        
        // Close modal on X click
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    async loadData() {
        const loadingEl = document.getElementById('loading');
        
        try {
            loadingEl.style.display = 'block';
            
            // Try to fetch from SharePoint, fallback to mock data
            try {
                this.currentData = await this.api.fetchListData();
            } catch (error) {
                console.warn('Using mock data. To connect to SharePoint, configure authentication.');
                this.currentData = this.api.getMockData();
            }
            
            // Render the graph
            this.renderGraph();
            
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load data. Please check the console for details.');
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    renderGraph() {
        if (this.currentData.length === 0) {
            console.warn('No data to render');
            return;
        }

        this.graph.render(
            this.currentData,
            this.currentConnectorType,
            (personData) => this.showPersonDetails(personData)
        );
    }

    showPersonDetails(personData) {
        // Populate modal with person data
        document.getElementById('modal-name').textContent = personData.Name || 'N/A';
        document.getElementById('modal-firm').textContent = personData.Firm || 'N/A';
        document.getElementById('modal-position').textContent = personData['Job position'] || 'N/A';
        
        // Website link
        const websiteEl = document.getElementById('modal-website');
        if (personData.Website) {
            const websiteUrl = personData.Website.startsWith('http') 
                ? personData.Website 
                : `https://${personData.Website}`;
            websiteEl.href = websiteUrl;
            websiteEl.textContent = personData.Website;
            websiteEl.style.display = 'inline';
        } else {
            websiteEl.style.display = 'none';
            websiteEl.textContent = 'N/A';
        }

        // LinkedIn link
        const linkedinEl = document.getElementById('modal-linkedin');
        if (personData.Linkedin) {
            const linkedinUrl = personData.Linkedin.startsWith('http') 
                ? personData.Linkedin 
                : `https://${personData.Linkedin}`;
            linkedinEl.href = linkedinUrl;
            linkedinEl.style.display = 'inline';
        } else {
            linkedinEl.style.display = 'none';
        }

        document.getElementById('modal-related').textContent = personData['Related to'] || 'N/A';
        document.getElementById('modal-keywords').textContent = personData['Key words'] || 'N/A';
        document.getElementById('modal-lastcontact').textContent = personData['Date of last contact'] || 'N/A';
        
        // Notes
        const notesEl = document.getElementById('modal-notes');
        if (personData.Note && personData.Note.trim() !== '') {
            notesEl.textContent = personData.Note;
            document.getElementById('notes-section').style.display = 'block';
        } else {
            document.getElementById('notes-section').style.display = 'none';
        }

        // Show modal
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    handleResize() {
        // Reinitialize graph on resize
        if (this.graph) {
            this.graph.destroy();
            this.graph = new NetworkGraph('network-graph');
            this.renderGraph();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ConnectionHubApp();
});
