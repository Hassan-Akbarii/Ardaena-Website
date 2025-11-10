/**
 * SharePoint API Integration Module
 * Handles authentication and data fetching from Microsoft List
 */

class SharePointAPI {
    constructor(config) {
        this.siteUrl = config.siteUrl;
        this.listId = config.listId;
        this.clientId = config.clientId;
        this.tenantId = config.tenantId;
        this.accessToken = null;
        this.msalInstance = null;
        
        // Initialize MSAL if config is provided
        if (this.clientId !== 'your-client-id-here') {
            this.initializeMSAL();
        }
    }

    /**
     * Initialize MSAL authentication
     */
    initializeMSAL() {
        const msalConfig = {
            auth: {
                clientId: this.clientId,
                authority: `https://login.microsoftonline.com/${this.tenantId}`,
                redirectUri: window.location.origin + window.location.pathname
            },
            cache: {
                cacheLocation: 'sessionStorage',
                storeAuthStateInCookie: false
            }
        };

        this.msalInstance = new msal.PublicClientApplication(msalConfig);
    }

    /**
     * Authenticate with Microsoft Graph API
     * Uses MSAL.js for authentication
     */
    async authenticate() {
        if (!this.msalInstance) {
            throw new Error('MSAL not initialized. Please configure clientId and tenantId.');
        }

        const loginRequest = {
            scopes: ['Files.ReadWrite.All', 'Sites.ReadWrite.All', 'User.Read']
        };

        try {
            // Try to acquire token silently first
            const accounts = this.msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                const silentRequest = {
                    ...loginRequest,
                    account: accounts[0]
                };
                
                try {
                    const response = await this.msalInstance.acquireTokenSilent(silentRequest);
                    this.accessToken = response.accessToken;
                    console.log('Authentication successful (silent)');
                    return;
                } catch (silentError) {
                    console.log('Silent token acquisition failed, trying interactive...');
                }
            }

            // Fall back to interactive login
            const response = await this.msalInstance.loginPopup(loginRequest);
            this.accessToken = response.accessToken;
            console.log('Authentication successful (interactive)');
            
        } catch (error) {
            console.error('Authentication failed:', error);
            throw error;
        }
    }

    /**
     * Fetch list items from SharePoint
     * @returns {Promise<Array>} Array of list items
     */
    async fetchListData() {
        try {
            // Ensure we have an access token
            if (!this.accessToken) {
                await this.authenticate();
            }

            let allItems = [];
            // Use the specific site and list ID
            let endpoint = `https://graph.microsoft.com/v1.0/sites/${this.siteUrl}/lists/${this.listId}/items?expand=fields&$top=200`;

            // Handle pagination
            while (endpoint) {
                console.log('Fetching from:', endpoint);
                
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('SharePoint API Error:', response.status, errorText);
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                console.log('Fetched items:', data.value.length);
                allItems = allItems.concat(data.value);
                
                // Check for next page
                endpoint = data['@odata.nextLink'] || null;
            }

            console.log('Total items fetched:', allItems.length);
            const transformedData = this.transformData(allItems);
            console.log('Transformed data:', transformedData);
            return transformedData;

        } catch (error) {
            console.error('Error fetching SharePoint data:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Transform SharePoint data to application format
     * @param {Array} items - Raw SharePoint list items
     * @returns {Array} Transformed data
     */
    transformData(items) {
        return items.map(item => {
            const fields = item.fields;
            
            // Log first item to see actual field names
            if (items.indexOf(item) === 0) {
                console.log('Sample SharePoint fields:', Object.keys(fields));
                console.log('Sample item:', fields);
            }
            
            return {
                'id': item.id, // Keep item ID for updates
                'Name': fields.Title || fields.Name || '',
                'Key words': fields.KeyWords || fields.Keywords || fields.Keyword || '',
                'Related to': fields.Relatedto || fields.RelatedTo || fields.Related_x0020_to || '',
                'Firm': fields.Firm || '',
                'Website': fields.Website || '',
                'Job position': fields.Jobposition || fields.JobPosition || fields.Job_x0020_position || '',
                'Linkedin': fields.Linkedin || fields.LinkedIn || fields.LinkedIn0 || '',
                'Profile Picture': fields.ProfilePicture || fields.Profile_x0020_Picture || '',
                'Date of last contact': fields.Dateoflastcontact || fields.DateOfLastContact || fields.Date_x0020_of_x0020_last_x0020_contact || '',
                'Note': fields.Note || fields.Notes || fields.NoteIfneeded || fields.Note_x0028_If_x0020_needed_x0029_ || ''
            };
        });
    }

    /**
     * Transform application data to SharePoint format
     * @param {Object} data - Application format data
     * @returns {Object} SharePoint format data
     */
    transformToSharePointFormat(data) {
        const transformed = {
            'Title': data.Name || ''
        };
        
        // Only add non-empty fields to avoid validation errors
        if (data['Key words']) transformed['Keywords'] = data['Key words'];
        if (data['Related to']) transformed['Relatedto'] = data['Related to'];
        if (data.Firm) transformed['Firm'] = data.Firm;
        if (data.Website) transformed['Website'] = data.Website;
        if (data['Job position']) transformed['Jobposition'] = data['Job position'];
        if (data.Linkedin) transformed['Linkedin'] = data.Linkedin;
        if (data['Date of last contact']) {
            // Ensure date is in proper format (YYYY-MM-DD or ISO string)
            transformed['Dateoflastcontact'] = data['Date of last contact'];
        }
        if (data.Note) transformed['Note'] = data.Note;
        
        console.log('Transforming to SharePoint format:', transformed);
        return transformed;
    }

    /**
     * Update an existing list item
     * @param {String} itemId - The ID of the item to update
     * @param {Object} data - Updated data in application format
     * @returns {Promise<Object>} Updated item
     */
    async updateListItem(itemId, data) {
        try {
            // Check if using mock data (itemId starts with 'mock-')
            if (itemId.toString().startsWith('mock-')) {
                console.warn('Using mock mode - changes not persisted to SharePoint');
                // Simulate successful update
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({ ...data, id: itemId });
                    }, 500);
                });
            }

            // Ensure we have an access token
            if (!this.accessToken) {
                await this.authenticate();
            }

            // Transform data to SharePoint format
            const sharePointData = this.transformToSharePointFormat(data);

            // Construct the Graph API endpoint
            const endpoint = `https://graph.microsoft.com/v1.0/sites/${this.siteUrl}/lists/${this.listId}/items/${itemId}/fields`;

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sharePointData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('SharePoint update error:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const updatedItem = await response.json();
            console.log('Item updated successfully:', updatedItem);
            return updatedItem;

        } catch (error) {
            console.error('Error updating SharePoint item:', error);
            throw error;
        }
    }

    /**
     * Create a new list item
     * @param {Object} data - New item data in application format
     * @returns {Promise<Object>} Created item
     */
    async createListItem(data) {
        try {
            // Check if in mock mode (no access token and default config)
            if (!this.accessToken && this.clientId === 'your-client-id-here') {
                console.warn('Using mock mode - item not persisted to SharePoint');
                // Simulate successful creation with a mock ID
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const mockId = `mock-${Date.now()}`;
                        resolve({ ...data, id: mockId });
                    }, 500);
                });
            }

            // Ensure we have an access token
            if (!this.accessToken) {
                await this.authenticate();
            }

            // Transform data to SharePoint format
            const sharePointData = this.transformToSharePointFormat(data);

            // Construct the Graph API endpoint
            const endpoint = `https://graph.microsoft.com/v1.0/sites/${this.siteUrl}/lists/${this.listId}/items`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: sharePointData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const createdItem = await response.json();
            console.log('Item created successfully:', createdItem);
            return createdItem;

        } catch (error) {
            console.error('Error creating SharePoint item:', error);
            throw error;
        }
    }

    /**
     * Get mock data for testing without SharePoint connection
     * @returns {Array} Sample data matching the SharePoint list structure
     */
    getMockData() {
        return [
            {
                'id': 'mock-1',
                'Name': 'Alex Young',
                'Key words': 'Automation, AI',
                'Related to': 'Mahdi Fard',
                'Firm': 'Arup',
                'Website': 'Arup.com',
                'Job position': 'Site Supervisor',
                'Linkedin': 'linkedin.com/bnytkk',
                'Profile Picture': '',
                'Date of last contact': '7/5/2025',
                'Note': ''
            },
            {
                'id': 'mock-2',
                'Name': 'Hank Hussler',
                'Key words': 'Academic',
                'Related to': 'Mahdi Fard',
                'Firm': 'UNSW',
                'Website': 'unsw.com',
                'Job position': 'Professor',
                'Linkedin': 'linkedin.com',
                'Profile Picture': '',
                'Date of last contact': '10/5/2025',
                'Note': ''
            },
            {
                'id': 'mock-3',
                'Name': 'Nikola Huilen',
                'Key words': 'Detail design',
                'Related to': 'Amirhossein Sattari',
                'Firm': 'Ejot',
                'Website': 'Ejot.com',
                'Job position': 'Business developer',
                'Linkedin': 'linkedin.com/dvxzv',
                'Profile Picture': '',
                'Date of last contact': '6/7/2025',
                'Note': ''
            },
            {
                'id': 'mock-4',
                'Name': 'Micheal Burnly',
                'Key words': 'Facade',
                'Related to': 'Ahmed Sattar',
                'Firm': 'B+G',
                'Website': 'BG.co.uk',
                'Job position': 'Director',
                'Linkedin': 'linkedin.com/jhiio',
                'Profile Picture': '',
                'Date of last contact': '10/1/2025',
                'Note': ''
            },
            {
                'id': 'mock-5',
                'Name': 'Dayana Perkins',
                'Key words': 'Toolkit',
                'Related to': 'Hassan Akbari',
                'Firm': 'Prism',
                'Website': 'Prism.com',
                'Job position': 'Professor',
                'Linkedin': 'linkedin.com/hgyj',
                'Profile Picture': '',
                'Date of last contact': '12/3/2024',
                'Note': ''
            },
            {
                'id': 'mock-6',
                'Name': 'Olivia Bennett',
                'Key words': 'Facade',
                'Related to': 'Amirhossein Sattari',
                'Firm': 'Permasteelisa Group',
                'Website': 'permasteelisa.com',
                'Job position': 'Senior Engineer',
                'Linkedin': 'linkedin.com',
                'Profile Picture': '',
                'Date of last contact': '5/15/2025',
                'Note': ''
            },
            {
                'id': 'mock-7',
                'Name': 'Sarah Johnson',
                'Key words': 'Automation, Facade',
                'Related to': 'Hassan Akbari',
                'Firm': 'Tech Solutions',
                'Website': 'techsolutions.com',
                'Job position': 'Technical Lead',
                'Linkedin': 'linkedin.com',
                'Profile Picture': '',
                'Date of last contact': '8/20/2025',
                'Note': 'Follow up on automation project'
            },
            {
                'id': 'mock-8',
                'Name': 'David Chen',
                'Key words': 'AI, Academic',
                'Related to': 'Farrokh Razh',
                'Firm': 'MIT',
                'Website': 'mit.edu',
                'Job position': 'Research Scientist',
                'Linkedin': 'linkedin.com',
                'Profile Picture': '',
                'Date of last contact': '9/10/2025',
                'Note': ''
            },
            {
                'id': 'mock-9',
                'Name': 'Emma Wilson',
                'Key words': 'Detail design',
                'Related to': 'Atefeh Shahrashoob',
                'Firm': 'Design Studio',
                'Website': 'designstudio.com',
                'Job position': 'Lead Designer',
                'Linkedin': 'linkedin.com',
                'Profile Picture': '',
                'Date of last contact': '7/28/2025',
                'Note': ''
            }
        ];
    }
}

/**
 * Configuration object for SharePoint API
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Get your List information:
 *    - Your list is at: https://ardaenacom-my.sharepoint.com/:l:/g/personal/shahrashoub_ardaena_com/...
 *    - Site: ardaenacom-my.sharepoint.com
 *    - Owner: shahrashoub@ardaena.com
 * 
 * 2. Get List ID:
 *    - Go to your list → Settings (gear icon) → List settings
 *    - Look at the URL, copy the GUID after "List="
 *    - Example: List={XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}
 * 
 * 3. Create Azure AD App Registration:
 *    - Go to: https://portal.azure.com → Azure Active Directory → App registrations
 *    - Click "New registration"
 *    - Name: "Connection Hub App"
 *    - Supported account types: "Accounts in this organizational directory only"
 *    - Redirect URI: Single-page application (SPA) → http://localhost:5500/Connection-Hub/index.html
 *                    (update this to your actual URL when deployed)
 *    - Click "Register"
 *    - Copy the "Application (client) ID" and "Directory (tenant) ID"
 * 
 * 4. Configure API permissions:
 *    - In your app registration → API permissions → Add a permission
 *    - Microsoft Graph → Delegated permissions
 *    - Add: Sites.ReadWrite.All, User.Read
 *    - Click "Grant admin consent" (requires admin)
 * 
 * 5. Update the config below with your values
 */
const sharePointConfig = {
    // For personal OneDrive SharePoint lists, we need to construct the proper site path
    // Format: hostname:/personal/username_domain_com:
    siteUrl: 'ardaenacom-my.sharepoint.com:/personal/shahrashoub_ardaena_com:',
    
    // Your List ID (GUID from list settings URL)
    listId: '515bf299-bf7f-4e7e-8df0-fef477442678',
    
    // Azure AD App Registration Client ID (from step 3)
    clientId: '0fd93da5-a23b-4463-8205-f452caf959bf',
    
    // Azure AD Tenant ID (from step 3)
    tenantId: '83dc1d11-d7d1-467c-8118-b3c344d1c4f2'
};
