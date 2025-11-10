# Connection Hub - Network Visualization

## Overview
Connection Hub is an interactive network visualization tool that displays professional connections from a Microsoft SharePoint List as an interactive graph. Users can explore connections, filter by different categories, and view detailed information about each person.

## Features
- **Interactive Graph Visualization**: Force-directed graph powered by D3.js
- **Multiple Connector Views**: Filter by "Related To", "Job Position", or "Key Words"
- **Zoom & Pan**: Navigate large networks with smooth zoom and pan controls
- **Detailed Information Cards**: Click any node to view complete contact details
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **SharePoint Integration**: Direct connection to Microsoft Lists (with authentication)

## Project Structure
```
Connection-Hub/
├── index.html                 # Main HTML file
├── assets/
│   ├── css/
│   │   └── style.css         # Styling
│   └── js/
│       ├── app.js            # Main application logic
│       ├── graph.js          # D3.js graph visualization
│       └── sharepoint-api.js # SharePoint API integration
└── README.md                 # This file
```

## Testing Locally

1. **Open the HTML file**: Simply open `index.html` in a modern web browser
2. **Mock Data**: The application includes sample data for testing without SharePoint connection
3. **Test Features**:
   - Change connector types using the dropdown
   - Drag nodes to rearrange the graph
   - Zoom in/out using mouse wheel or pinch gesture
   - Click person nodes to view details

## SharePoint Integration

### Quick Setup (3 Steps)

**See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions**

1. **Get your List ID** from SharePoint list settings
2. **Create Azure AD App** at portal.azure.com with `Sites.ReadWrite.All` permission
3. **Update config** in `assets/js/sharepoint-api.js`:
   ```javascript
   const sharePointConfig = {
       siteUrl: 'ardaenacom-my.sharepoint.com:/personal/shahrashoub_ardaena_com',
       listId: 'YOUR-LIST-ID-HERE',
       clientId: 'YOUR-CLIENT-ID-HERE',
       tenantId: 'YOUR-TENANT-ID-HERE'
   };
   ```

### Current Status
- ✅ MSAL.js authentication library included
- ✅ Mock mode works for testing without SharePoint
- ⚙️ Ready for SharePoint connection (needs configuration)

### Authentication
The app uses MSAL.js (Microsoft Authentication Library) for secure authentication:
- First-time: Interactive popup login
- Subsequent: Silent token refresh
- Permissions: `Sites.ReadWrite.All`, `User.Read`

## Integration with WordPress Website

### Method 1: Standalone Page (Recommended)
**Best for**: Full-page visualization with complete functionality

1. **Upload Files**:
   - Upload the entire `Connection-Hub` folder to your WordPress site
   - Location: `wp-content/uploads/connection-hub/` or custom directory

2. **Create WordPress Page**:
   - Create a new page with a custom template
   - Use the "Full Width" or "Blank" template
   - Add custom CSS/JS if needed

3. **Link to the Page**:
   - Menu: Add custom link to `/wp-content/uploads/connection-hub/index.html`
   - Or use redirect to the HTML file

**Pros**: Full control, no conflicts, better performance
**Cons**: Separate from WordPress theme styling

### Method 2: WordPress Shortcode Plugin
**Best for**: Embedding within WordPress pages/posts

1. **Create Custom Plugin**:
   Create `wp-content/plugins/connection-hub/connection-hub.php`:
   ```php
   <?php
   /*
   Plugin Name: Connection Hub
   Description: Network visualization from SharePoint List
   Version: 1.0
   */

   function connection_hub_enqueue_scripts() {
       wp_enqueue_script('d3js', 'https://d3js.org/d3.v7.min.js', array(), '7.0', true);
       wp_enqueue_script('connection-hub-sharepoint', plugins_url('assets/js/sharepoint-api.js', __FILE__), array(), '1.0', true);
       wp_enqueue_script('connection-hub-graph', plugins_url('assets/js/graph.js', __FILE__), array('d3js'), '1.0', true);
       wp_enqueue_script('connection-hub-app', plugins_url('assets/js/app.js', __FILE__), array('connection-hub-graph'), '1.0', true);
       wp_enqueue_style('connection-hub-style', plugins_url('assets/css/style.css', __FILE__));
   }

   function connection_hub_shortcode($atts) {
       connection_hub_enqueue_scripts();
       
       ob_start();
       include plugin_dir_path(__FILE__) . 'template.php';
       return ob_get_clean();
   }
   add_shortcode('connection_hub', 'connection_hub_shortcode');
   ```

2. **Copy Assets**:
   - Move `assets/` folder into the plugin directory
   - Create `template.php` with the main HTML content

3. **Use Shortcode**:
   Add `[connection_hub]` to any page or post

**Pros**: Integrated with WordPress, easy to embed
**Cons**: May have theme conflicts, requires plugin maintenance

### Method 3: iFrame Embed
**Best for**: Quick integration without code changes

1. **Host the HTML file** (as in Method 1)
2. **Add iFrame to WordPress**:
   ```html
   <iframe src="/wp-content/uploads/connection-hub/index.html" 
           width="100%" 
           height="800px" 
           frameborder="0">
   </iframe>
   ```

**Pros**: Simple, isolated from WordPress
**Cons**: Fixed height, potential responsive issues

### Method 4: React/Vue Integration (Advanced)
**Best for**: Modern WordPress themes using JavaScript frameworks

1. Convert to React/Vue component
2. Use WordPress REST API for data
3. Build and enqueue in theme

**Pros**: Modern architecture, reusable
**Cons**: Complex setup, requires build process

## Recommended Approach for Ardaena Website

**Option A: Standalone Page** (Easiest & Most Reliable)
1. Upload `Connection-Hub` to server
2. Create menu link to it
3. Use same header/footer as main site for consistency

**Option B: WordPress Plugin** (Most Integrated)
1. Create plugin using Method 2
2. Use shortcode in custom page template
3. Adjust styling to match theme

## Customization

### Styling
- Edit `assets/css/style.css` to match your brand colors
- Update gradient colors in header (currently purple gradient)
- Modify node colors in graph (main nodes: green, person nodes: blue)

### Data Fields
- Add/remove fields in the modal by editing `app.js` `showPersonDetails()` method
- Update `sharepoint-api.js` `transformData()` to map additional SharePoint columns

### Graph Behavior
- Adjust node spacing: Modify `distance` in `graph.js` (line 32)
- Change force strength: Modify `strength` in `graph.js` (line 33)
- Node sizes: Update `size` property in `processData()` method

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Not supported (requires D3.js v5 or polyfills)

## Performance Considerations
- Optimal for networks with up to 500 nodes
- For larger networks (500+), consider:
  - Implementing pagination
  - Virtual scrolling
  - WebGL rendering (using PixiJS or Three.js)

## Security Notes
- Keep Azure Client IDs secure (use environment variables in production)
- Implement proper CORS policies
- Use HTTPS for all API calls
- Validate and sanitize data from SharePoint

## Future Enhancements
- [ ] Search functionality to find specific people
- [ ] Export graph as image
- [ ] Filter by multiple criteria simultaneously
- [ ] Timeline view for contact history
- [ ] Integration with CRM systems
- [ ] Real-time collaboration features

## Support & Maintenance
- Test across browsers after WordPress theme updates
- Monitor SharePoint API changes
- Update D3.js version periodically
- Review Azure AD token expiration policies

## License
Proprietary - Ardaena Website Project
