# Connection Hub - SharePoint Integration Setup Guide

## Prerequisites
- Microsoft 365 account with access to SharePoint
- Azure AD administrator access (to create app registration and grant permissions)
- Your Microsoft List URL: `https://ardaenacom-my.sharepoint.com/:l:/g/personal/shahrashoub_ardaena_com/...`

## Step-by-Step Setup

### Step 1: Get Your List ID

1. Open your Microsoft List: "Atefeh's list"
2. Click the **Settings** gear icon (⚙️) in the top right
3. Select **List settings**
4. Look at the URL in your browser's address bar
5. Find the part that says `List=%7B...%7D`
6. Copy the GUID (the long string of letters and numbers)
   - Example: If URL shows `List=%7B12345678-1234-1234-1234-123456789ABC%7D`
   - Your List ID is: `12345678-1234-1234-1234-123456789ABC`

**Alternative method:**
1. In your list, click on any item
2. In the URL, you'll see something like: `lists/list-name/AllItems.aspx`
3. Or use PowerShell/Graph Explorer to query your lists

### Step 2: Create Azure AD App Registration

1. **Go to Azure Portal**
   - Navigate to: https://portal.azure.com
   - Sign in with your admin account

2. **Navigate to App Registrations**
   - Search for "Azure Active Directory" or click from left menu
   - Click **App registrations** in the left sidebar
   - Click **+ New registration**

3. **Register the Application**
   - **Name**: `Connection Hub App`
   - **Supported account types**: Select "Accounts in this organizational directory only (Ardaena only - Single tenant)"
   - **Redirect URI**: 
     - Platform: **Single-page application (SPA)**
     - URL: `http://localhost:5500/Connection-Hub/index.html` (for testing)
     - Note: Add your production URL later (e.g., `https://ardaena.com/connection-hub/`)
   - Click **Register**

4. **Copy Important IDs**
   After registration, you'll see the Overview page:
   - **Application (client) ID**: Copy this (e.g., `12345678-90ab-cdef-1234-567890abcdef`)
   - **Directory (tenant) ID**: Copy this (e.g., `abcdef12-3456-7890-abcd-ef1234567890`)

### Step 3: Configure API Permissions

1. **Add Permissions**
   - In your app registration, click **API permissions** in the left sidebar
   - Click **+ Add a permission**
   - Select **Microsoft Graph**
   - Select **Delegated permissions**
   - Search and add these permissions:
     - ✅ `Sites.ReadWrite.All` (Read and write items in all site collections)
     - ✅ `User.Read` (Sign in and read user profile)
   - Click **Add permissions**

2. **Grant Admin Consent**
   - Click the **Grant admin consent for [your organization]** button
   - Click **Yes** to confirm
   - Wait for the status to show "Granted" with green checkmarks

### Step 4: Add Production Redirect URI (When Deploying)

When you deploy to your website:
1. Go back to your app registration
2. Click **Authentication** in the left sidebar
3. Under **Single-page application**, click **+ Add URI**
4. Add your production URL: `https://ardaena.com/connection-hub/index.html`
5. Click **Save**

### Step 5: Update Configuration File

Open `Connection-Hub/assets/js/sharepoint-api.js` and update the `sharePointConfig` object:

```javascript
const sharePointConfig = {
    // Your site URL - already correct!
    siteUrl: 'ardaenacom-my.sharepoint.com:/personal/shahrashoub_ardaena_com',
    
    // Replace with your List ID from Step 1
    listId: 'YOUR-LIST-ID-HERE',
    
    // Replace with Application (client) ID from Step 2
    clientId: 'YOUR-CLIENT-ID-HERE',
    
    // Replace with Directory (tenant) ID from Step 2
    tenantId: 'YOUR-TENANT-ID-HERE'
};
```

### Step 6: Test the Connection

1. **Open the Application**
   - Open `index.html` in your browser
   - Or use Live Server in VS Code

2. **First Time Login**
   - Click **Refresh Data** button
   - A popup window will appear asking you to sign in
   - Sign in with your Microsoft 365 account (shahrashoub@ardaena.com)
   - Grant the requested permissions
   - The popup will close automatically

3. **Verify Data Loading**
   - You should see your connections from the Microsoft List
   - Click on any node to view details
   - Try editing or adding a new connection

## Troubleshooting

### Error: "MSAL not initialized"
- Make sure you've replaced `YOUR-CLIENT-ID-HERE` with your actual client ID
- Check that the MSAL.js library is loading (check browser console)

### Error: "AADSTS50011: The reply URL specified in the request does not match"
- Add your current URL to the Redirect URIs in Azure AD app registration
- Make sure you selected "Single-page application (SPA)" platform

### Error: "Access token acquisition failed"
- Verify API permissions are granted in Azure AD
- Make sure admin consent was granted
- Try signing out and signing in again

### Error: "List not found" or "404"
- Double-check your List ID
- Verify the siteUrl is correct
- Ensure your account has access to the list

### Error: "Insufficient privileges to complete the operation"
- Check that `Sites.ReadWrite.All` permission is granted
- Verify you have edit permissions on the SharePoint list
- Re-grant admin consent in Azure AD

## Column Name Mapping

The app expects these columns in your Microsoft List:
- **Title** or **Name** → Person's name
- **KeyWords** → Keywords/tags
- **Related_x0020_to** → Related to person
- **Firm** → Company/organization
- **Website** → Website URL
- **Job_x0020_position** → Job title
- **LinkedIn** → LinkedIn URL
- **Date_x0020_of_x0020_last_x0020_contact** → Last contact date
- **Note** → Additional notes

**Note**: SharePoint internal names use `_x0020_` for spaces. The app handles this automatically.

## Security Best Practices

1. **Never commit credentials to Git**
   - Keep your client ID and tenant ID in a separate config file
   - Add `config.local.js` to `.gitignore`

2. **Use Environment Variables in Production**
   - Store sensitive values in environment variables
   - Use a build process to inject them

3. **Limit Redirect URIs**
   - Only add trusted domains to redirect URIs
   - Remove localhost URLs in production

4. **Regular Permission Audits**
   - Review app permissions periodically
   - Remove unused apps from Azure AD

## Support

If you need help:
1. Check the browser console for detailed error messages
2. Verify all setup steps were completed
3. Test the Microsoft Graph API directly using Graph Explorer: https://developer.microsoft.com/graph/graph-explorer
4. Check Azure AD app registration audit logs

## Next Steps

Once connected:
- ✅ View real-time data from your Microsoft List
- ✅ Add new connections directly from the app
- ✅ Edit existing connections
- ✅ Changes sync instantly with SharePoint
- 🔜 Implement calendar reminders (right panel)
