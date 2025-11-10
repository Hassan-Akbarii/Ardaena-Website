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
    }

    /**
     * Authenticate with Microsoft Graph API
     * Uses MSAL.js for authentication
     */
    async authenticate() {
        // TODO: Implement MSAL authentication
        // For now, this is a placeholder for the authentication flow
        console.log('Authentication required - please implement MSAL.js');
        throw new Error('Authentication not implemented - see configuration guide');
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

            // Construct the Graph API endpoint
            const endpoint = `https://graph.microsoft.com/v1.0/sites/${this.siteUrl}/lists/${this.listId}/items?expand=fields`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return this.transformData(data.value);

        } catch (error) {
            console.error('Error fetching SharePoint data:', error);
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
            return {
                'Name': fields.Title || fields.Name || '',
                'Key words': fields.Keywords || fields.KeyWords || '',
                'Related to': fields.RelatedTo || fields.Related_x0020_to || '',
                'Firm': fields.Firm || '',
                'Website': fields.Website || '',
                'Job position': fields.JobPosition || fields.Job_x0020_position || '',
                'Linkedin': fields.Linkedin || fields.LinkedIn || '',
                'Profile Picture': fields.ProfilePicture || fields.Profile_x0020_Picture || '',
                'Date of last contact': fields.DateOfLastContact || fields.Date_x0020_of_x0020_last_x0020_contact || '',
                'Note': fields.Note || fields.Notes || ''
            };
        });
    }

    /**
     * Get mock data for testing without SharePoint connection
     * @returns {Array} Sample data matching the SharePoint list structure
     */
    getMockData() {
        return [
            {
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
 * Replace these values with your actual SharePoint configuration
 */
const sharePointConfig = {
    // Your SharePoint site URL (without https://)
    siteUrl: 'ardaenacom-my.sharepoint.com:/sites/yoursitename',
    
    // Your List ID (can be found in list settings)
    listId: 'your-list-id-here',
    
    // Azure AD App Registration Client ID
    clientId: 'your-client-id-here',
    
    // Azure AD Tenant ID
    tenantId: 'your-tenant-id-here'
};
