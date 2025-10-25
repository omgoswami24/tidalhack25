# Google Maps API Setup for SafeSight

## 🔑 Getting Your Google Maps API Key

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Give your project a name (e.g., "SafeSight Maps")

### Step 2: Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - **Maps JavaScript API**
   - **Maps Embed API**
   - **Static Maps API** (optional, for fallback)

### Step 3: Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy your API key
4. (Optional) Restrict the API key to your domain for security

### Step 4: Update Your Code
1. Open `frontend/src/config/maps.js`
2. Replace `YOUR_API_KEY_HERE` with your actual API key:

```javascript
export const GOOGLE_MAPS_API_KEY = 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

### Step 5: Test the Application
1. Restart your frontend server
2. Click on any camera in the surveillance grid
3. In the detail view, you should see a Google Maps snippet in the Location card
4. Click on the map to open it in Google Maps

## 🆓 Free Tier Limits
- Google Maps API has a free tier with generous limits
- For development and small projects, you likely won't exceed the free tier
- Check your usage in the Google Cloud Console

## 🔒 Security Note
- Never commit your API key to version control
- Consider restricting your API key to specific domains
- Monitor your usage to avoid unexpected charges

## 🚀 Alternative: No API Key Required
If you don't want to set up an API key right now, the application will still work by:
- Showing a clickable map placeholder
- Opening Google Maps directly when clicked
- Displaying coordinates and location information

The map functionality will work without an API key, but you'll get a better experience with one!
