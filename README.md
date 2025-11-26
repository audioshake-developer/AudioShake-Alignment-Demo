# AudioShake Alignment Demo

A modern, browser-based application for testing the AudioShake Lyrics Alignment API. Create time-aligned lyrics and visualize word-level synchronization with audio/video playback.

[Live Demo](https://audioexplorer.github.io/AudioShake-Alignment-Demo/)

## Features

- **API Integration**: Full AudioShake Tasks API support with secure key storage
- **Asset Management**: Load demo assets via file upload, URL, or built-in demos
- **Real-time Alignment**: Create alignment tasks and poll for completion
- **Synced Playback**: Word-level lyric highlighting synchronized to media
- **API Console**: Live debugging with request/response inspection
- **Code Examples**: View API usage in JavaScript, cURL, and Python
- **Modern UI**: Clean, responsive design with dark mode support

## Quickstart

1. **Open `index.html`** in a modern web browser
2. **Authorize**: Click "Authorize" and enter your AudioShake API key
   - Get your key at [dashboard.audioshake.ai](https://dashboard.audioshake.ai)
3. **Load Assets**: 
   - Click "Load Demo Assets" for quick testing
   - Upload your own `demo-assets.json` file
   - Or enter a URL to your assets JSON
4. **Select Media**: Click any asset to load it in the player
5. **Create Alignment**: Click "Create Alignment" to process the selected media
6. **View Results**: Watch synchronized lyrics highlight as the media plays

## File Structure

```
audioshake-alignment-demo/
├── index.html       # Main HTML structure
├── styles.css       # Complete styling with theme support
├── app.js           # Application logic and UI management
├── api.js           # AudioShake API client
├── code.js          # Live Code Examples
└── README.md        # This file
```

## Demo Assets Format

Create a `demo-assets.json` file with this structure:

```json
{
  "assets": [
    {
      "src": "https://example.com/audio.mp3",
      "title": "Song Name",
      "format": "audio/mpeg"
    }
  ]
}
```

Use the [create-demo-assets](https://www.npmjs.com/package/create-demo-assets) tool to generate pre-signed S3 URLs.

## API Methods

### Create Task
```javascript
POST /tasks
Headers: { 'x-api-key': 'YOUR_API_KEY' }
Body: {
  "url": "https://example.com/audio.mp3",
  "targets": [
    {
      "model": "alignment",
      "formats": ["json"],
      "language": "en"
    }
  ]
}
```

### Get Task Status
```javascript
GET /tasks/{taskId}
Headers: { 'x-api-key': 'YOUR_API_KEY' }
```

### List Tasks
```javascript
GET /tasks?take=20
Headers: { 'x-api-key': 'YOUR_API_KEY' }
```

## Task Response Structure

Tasks return a targets array.
Each target has:
- `model`: The processing model (e.g., 'alignment')
- `status`: 'processing', 'completed', or 'failed'
- `output`: Array of output files with `link`, `format`, `type`
- `cost`: Credits used for processing

## Features Breakdown

### Asset Management
- Drag-and-drop file upload
- URL loading for remote assets
- Built-in demo assets
- Format detection (audio/video/JSON)

### Media Player
- Video and audio playback support
- Word-level lyric synchronization
- Click-to-seek functionality
- Automatic scroll-to-active word

### API Console
- Real-time request/response logging
- Color-coded debug output
- Quick method execution
- Task status monitoring

### Code Viewer
- Multi-language examples
- Syntax highlighting
- One-click copy to clipboard
- Context-aware samples

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Requirements**: Modern browser with IndexedDB and Web Audio API support.

## Storage

- **API Keys**: Stored securely in IndexedDB
- **Preferences**: Theme and UI state in localStorage
- **No Server Required**: Fully client-side application

## Customization

### Theme
Toggle between light and dark modes with the theme button. Preferences persist across sessions.

### Styling
Edit `styles.css` CSS variables to customize colors:

```css
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  --success: #10b981;
  /* ... */
}
```

## Development

No build process required. Simply edit files and refresh your browser.

### Adding Features
- **New API methods**: Add to `api.js` and wire up in `app.js`
- **UI components**: Update HTML structure and add styles
- **Event handlers**: Register in `setupEventListeners()`

## Troubleshooting

**"API key not set" error**
- Click Authorize and enter your API key
- Check browser console for storage errors

**Assets not loading**
- Verify URL is accessible and returns valid JSON
- Check CORS headers on remote assets
- Ensure pre-signed URLs haven't expired

**Alignment not appearing**
- Wait for task completion (can take 1-2 minutes)
- Check API Console for error messages
- Verify media URL is publicly accessible

**Lyrics not syncing**
- Ensure alignment data loaded successfully
- Check browser console for timing errors
- Verify media is playing

## Resources
- [Live Demo](https://audioexplorer.github.io/Audioshake-Alignment-Demo/)
- [AudioShake API Documentation](https://docs.audioshake.ai)
- [Create Demo Assets Tool](https://www.npmjs.com/package/create-demo-assets)
- [AudioShake Dashboard](https://dashboard.audioshake.ai)

## License

This demo application is provided as-is for testing AudioShake API integration.

## Support

For API issues, contact AudioShake support at [support@audioshake.ai](mailto:support@audioshake.ai)