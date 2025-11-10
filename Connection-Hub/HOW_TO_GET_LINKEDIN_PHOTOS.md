# How to Add Profile Pictures to Connection Hub

## Overview
Connection Hub now displays profile pictures on person nodes! When a picture URL is provided, it shows in the node. Otherwise, it shows the person's initials.

## How to Get LinkedIn Profile Picture URLs

### Method 1: From LinkedIn Profile (Easiest)
1. Go to the person's LinkedIn profile
2. Right-click on their profile picture
3. Select **"Copy image address"** or **"Copy image link"**
4. Paste this URL into the "Profile Picture URL" field in Connection Hub

### Method 2: From Your Own LinkedIn Profile
1. Go to your LinkedIn profile
2. Click on your profile picture
3. When it opens in full view, right-click and select **"Copy image address"**
4. This is your profile picture URL

### Method 3: Upload to Cloud Storage
If you can't get the LinkedIn URL directly:
1. Save the profile picture to your computer
2. Upload it to a cloud storage service:
   - **OneDrive**: Upload → Get Share Link → Copy
   - **Google Drive**: Upload → Get Link → Copy
   - **Imgur**: Upload → Copy direct link
3. Use this URL in the Profile Picture field

## Adding Pictures in Connection Hub

### For New Connections:
1. Click **"Add New"** in the left panel
2. Fill in contact details
3. Paste the profile picture URL in **"Profile Picture URL"** field
4. Click **"Confirm"**

### For Existing Connections:
1. Click on a person node in the graph
2. Click **"Edit"** button
3. Paste or update the URL in **"Profile Picture URL"** field
4. Click **"Confirm"**

## What Happens:
- **With Picture URL**: Shows actual profile photo in circular node
- **Without Picture URL**: Shows colorful circle with person's initials (e.g., "JD" for John Doe)
- **If Image Fails to Load**: Automatically falls back to showing initials

## Tips:
- LinkedIn profile pictures work best when they're public
- If a LinkedIn URL doesn't work, try Method 3 (cloud storage)
- URLs must start with `http://` or `https://`
- Images are automatically cropped to circles

## Troubleshooting:
**Picture doesn't show?**
- Make sure the URL is correct and starts with `https://`
- Check if the image is publicly accessible
- Try opening the URL in a new browser tab to verify it works
- Some LinkedIn URLs expire - use cloud storage for permanent links

**Still having issues?**
The initials fallback ensures nodes always look professional even without pictures!
