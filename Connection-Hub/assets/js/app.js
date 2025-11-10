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
        this.selectedPerson = null;
        this.isEditMode = false;
        this.leftPanel = null;
        this.rightPanel = null;
        
        this.init();
    }

    async init() {
        // Initialize SharePoint API
        this.api = new SharePointAPI(sharePointConfig);
        
        // Initialize Graph
        this.graph = new NetworkGraph('network-graph');
        
        // Get panel references
        this.leftPanel = document.getElementById('left-panel');
        this.rightPanel = document.getElementById('right-panel');
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Initialize panels (left panel open by default)
        this.leftPanel.classList.remove('collapsed');
        this.rightPanel.classList.add('collapsed');
        
        // Load initial data
        await this.loadData();
    }

    setupEventListeners() {
        // Connector selector change
        document.getElementById('connector-select').addEventListener('change', (e) => {
            this.currentConnectorType = e.target.value;
            this.renderGraph();
        });

        // Refresh button - use refreshData to preserve node positions
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshData();
        });

        // Reset zoom button
        document.getElementById('reset-zoom-btn').addEventListener('click', () => {
            this.graph.resetZoom();
        });

        // Panel toggle buttons
        document.getElementById('toggle-left-panel').addEventListener('click', () => {
            this.togglePanel('left');
        });

        document.getElementById('toggle-right-panel').addEventListener('click', () => {
            this.togglePanel('right');
        });

        // Panel close buttons
        document.getElementById('close-left-panel').addEventListener('click', () => {
            this.closePanel('left');
        });

        document.getElementById('close-right-panel').addEventListener('click', () => {
            this.closePanel('right');
        });

        // Edit/Add/Cancel/Confirm buttons
        document.getElementById('edit-btn').addEventListener('click', () => {
            this.handleEditButton();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.cancelEdit();
        });

        document.getElementById('confirm-btn').addEventListener('click', () => {
            this.confirmEdit();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    togglePanel(side) {
        const panel = side === 'left' ? this.leftPanel : this.rightPanel;
        panel.classList.toggle('collapsed');
    }

    closePanel(side) {
        const panel = side === 'left' ? this.leftPanel : this.rightPanel;
        panel.classList.add('collapsed');
    }

    openPanel(side) {
        const panel = side === 'left' ? this.leftPanel : this.rightPanel;
        panel.classList.remove('collapsed');
    }

    async loadData() {
        const loadingEl = document.getElementById('loading');
        
        try {
            loadingEl.style.display = 'block';
            console.log('Starting to load data...');
            
            // Try to fetch from SharePoint, fallback to mock data
            try {
                console.log('Attempting to fetch from SharePoint...');
                this.currentData = await this.api.fetchListData();
                console.log('Successfully loaded data from SharePoint:', this.currentData.length, 'items');
            } catch (error) {
                console.error('SharePoint fetch failed:', error);
                console.warn('Falling back to mock data. To connect to SharePoint, configure authentication.');
                this.currentData = this.api.getMockData();
                console.log('Using mock data:', this.currentData.length, 'items');
            }
            
            // Render the graph
            console.log('Rendering graph with', this.currentData.length, 'items');
            this.renderGraph();
            console.log('Graph rendered successfully');
            
        } catch (error) {
            console.error('Error loading data:', error);
            console.error('Error stack:', error.stack);
            alert('Failed to load data. Error: ' + error.message + '\nCheck console for details.');
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    async refreshData() {
        // Refresh data from SharePoint without clearing node positions
        const loadingEl = document.getElementById('loading');
        
        try {
            loadingEl.style.display = 'block';
            console.log('Refreshing data from SharePoint...');
            
            // Fetch fresh data from SharePoint
            try {
                this.currentData = await this.api.fetchListData();
                console.log('Data refreshed successfully:', this.currentData.length, 'items');
            } catch (error) {
                console.error('SharePoint fetch failed:', error);
                throw error;
            }
            
            // Re-render graph (preserves node positions)
            console.log('Re-rendering graph with refreshed data...');
            this.renderGraph();
            console.log('Graph updated successfully');
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            alert('Failed to refresh data. Error: ' + error.message);
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
            (personData) => this.selectPerson(personData),
            () => this.deselectPerson() // Background click handler
        );
    }

    selectPerson(personData) {
        this.selectedPerson = personData;
        
        // Exit edit mode if active
        if (this.isEditMode) {
            this.cancelEdit();
        }
        
        // Show person details in left panel
        this.showPersonDetails(personData);
        
        // Open left panel if closed
        this.openPanel('left');
        
        // Update button text to "Edit"
        document.getElementById('edit-btn').textContent = 'Edit';
    }

    deselectPerson() {
        // Exit edit mode if active
        if (this.isEditMode) {
            this.cancelEdit();
        }
        
        this.clearSelection();
    }

    clearSelection() {
        this.selectedPerson = null;
        
        // Show empty state
        document.getElementById('empty-state').style.display = 'block';
        document.getElementById('person-details').style.display = 'none';
        
        // Update button text to "Add New"
        document.getElementById('edit-btn').textContent = 'Add New';
    }

    showPersonDetails(personData) {
        // Hide empty state and show person details
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('person-details').style.display = 'block';
        
        // Populate detail fields
        document.getElementById('detail-name').textContent = personData.Name || 'N/A';
        document.getElementById('detail-firm').textContent = personData.Firm || 'N/A';
        document.getElementById('detail-position').textContent = personData['Job position'] || 'N/A';
        
        // Website link
        const websiteEl = document.getElementById('detail-website');
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
        const linkedinEl = document.getElementById('detail-linkedin');
        if (personData.Linkedin) {
            const linkedinUrl = personData.Linkedin.startsWith('http') 
                ? personData.Linkedin 
                : `https://${personData.Linkedin}`;
            linkedinEl.href = linkedinUrl;
            linkedinEl.style.display = 'inline';
        } else {
            linkedinEl.style.display = 'none';
        }

        document.getElementById('detail-related').textContent = personData['Related to'] || 'N/A';
        document.getElementById('detail-keywords').textContent = personData['Key words'] || 'N/A';
        document.getElementById('detail-lastcontact').textContent = personData['Date of last contact'] || 'N/A';
        
        // Notes
        const notesEl = document.getElementById('detail-notes');
        if (personData.Note && personData.Note.trim() !== '') {
            notesEl.textContent = personData.Note;
            document.getElementById('notes-detail-section').style.display = 'block';
        } else {
            document.getElementById('notes-detail-section').style.display = 'none';
        }
    }

    handleEditButton() {
        if (this.isEditMode) {
            return; // Already in edit mode
        }
        
        if (this.selectedPerson) {
            // Edit existing person
            this.enterEditMode(this.selectedPerson);
        } else {
            // Add new person
            this.enterEditMode(null);
        }
    }

    enterEditMode(personData) {
        this.isEditMode = true;
        
        // Hide view mode, show edit mode
        document.getElementById('view-mode').style.display = 'none';
        document.getElementById('edit-mode').style.display = 'block';
        
        // Update button visibility
        document.getElementById('edit-btn').style.display = 'none';
        document.getElementById('confirm-btn').style.display = 'block';
        document.getElementById('cancel-btn').style.display = 'block';
        
        // Update panel title
        document.getElementById('panel-title').textContent = personData ? 'Edit Person' : 'Add New Person';
        
        // Populate form with data (or empty for new)
        if (personData) {
            document.getElementById('form-name').value = personData.Name || '';
            document.getElementById('form-firm').value = personData.Firm || '';
            document.getElementById('form-position').value = personData['Job position'] || '';
            document.getElementById('form-website').value = personData.Website || '';
            document.getElementById('form-linkedin').value = personData.Linkedin || '';
            document.getElementById('form-picture').value = personData['Profile Picture'] || '';
            document.getElementById('form-related').value = personData['Related to'] || '';
            document.getElementById('form-keywords').value = personData['Key words'] || '';
            document.getElementById('form-lastcontact').value = personData['Date of last contact'] || '';
            document.getElementById('form-notes').value = personData.Note || '';
        } else {
            document.getElementById('person-form').reset();
        }
        
        // Open left panel if closed
        this.openPanel('left');
    }

    cancelEdit() {
        this.isEditMode = false;
        
        // Show view mode, hide edit mode
        document.getElementById('view-mode').style.display = 'block';
        document.getElementById('edit-mode').style.display = 'none';
        
        // Update button visibility
        document.getElementById('edit-btn').style.display = 'block';
        document.getElementById('confirm-btn').style.display = 'none';
        document.getElementById('cancel-btn').style.display = 'none';
        
        // Update panel title
        document.getElementById('panel-title').textContent = 'Person Details';
        
        // Restore view based on selection
        if (this.selectedPerson) {
            this.showPersonDetails(this.selectedPerson);
        } else {
            this.clearSelection();
        }
    }

    async confirmEdit() {
        // Get form data
        const formData = {
            'Name': document.getElementById('form-name').value,
            'Firm': document.getElementById('form-firm').value,
            'Job position': document.getElementById('form-position').value,
            'Website': document.getElementById('form-website').value,
            'Linkedin': document.getElementById('form-linkedin').value,
            'Profile Picture': document.getElementById('form-picture').value,
            'Related to': document.getElementById('form-related').value,
            'Key words': document.getElementById('form-keywords').value,
            'Date of last contact': document.getElementById('form-lastcontact').value,
            'Note': document.getElementById('form-notes').value
        };
        
        // Validate required fields
        if (!formData.Name || formData.Name.trim() === '') {
            alert('Please enter a name');
            return;
        }
        
        try {
            console.log('Saving form data:', formData);
            
            if (this.selectedPerson && this.selectedPerson.id) {
                // Update existing person
                console.log('Updating person with ID:', this.selectedPerson.id);
                const updatedItem = await this.api.updateListItem(this.selectedPerson.id, formData);
                console.log('Person updated successfully:', updatedItem);
                
                // Update in current data array with all fields including ID
                const index = this.currentData.findIndex(p => p.id === this.selectedPerson.id);
                if (index !== -1) {
                    this.currentData[index] = { ...this.currentData[index], ...formData };
                    console.log('Updated local data at index:', index);
                }
            } else {
                // Create new person
                console.log('Creating new person...');
                const newItem = await this.api.createListItem(formData);
                console.log('Person created successfully:', newItem);
                
                // Add to current data array
                this.currentData.push({ ...formData, id: newItem.id });
                console.log('Added to local data, total items:', this.currentData.length);
            }
            
            // Re-render graph with updated data (preserves node positions)
            console.log('Re-rendering graph with updated data...');
            this.renderGraph();
            
            // Exit edit mode
            this.cancelEdit();
            
            alert('✅ Changes saved successfully!');
            
        } catch (error) {
            console.error('Error saving person:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                formData: formData
            });
            alert('Failed to save changes.\nError: ' + error.message + '\nCheck console for details.');
        }
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
