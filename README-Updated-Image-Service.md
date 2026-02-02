# MapleStory Gear Image Service - Updated Implementation

## Overview
The gear image service has been completely rewritten to use dynamic item lookup via the MapleStory.io API, ensuring that images always match the correct items in the game.

## What's New

### 1. MapleStory API Service (`mapleStoryAPIService.js`)
- **Dynamic Item Search**: Search for items by name using MapleStory.io API
- **Caching**: 24-hour cache to minimize API calls and improve performance
- **Error Handling**: Robust error handling with fallback mechanisms
- **Fuzzy Matching**: Best-match algorithm for items with similar names

### 2. Updated Gear Image Service (`gearImageService.js`)
- **Async Lookup**: All image resolution methods now have async versions
- **Fallback Mechanism**: Falls back to legacy mappings if API fails
- **Batch Processing**: Efficiently resolve multiple items at once
- **Cache Management**: Built-in cache warming and monitoring

### 3. Corrected Gear Data (`gear.json`)
- **Fixed Mismatches**: Corrected "Royal Circlet" to "Azure Loop"
- **Added Missing Items**: Complete CRA and Arcane sets
- **Proper Naming**: All items now use their official MapleStory names

## Usage Examples

### Basic Image URL Resolution
```javascript
// Async (recommended)
const imageUrl = await GearImageService.getItemImageUrl(gearId, gearData);

// Sync fallback
const imageUrl = GearImageService.getItemImageUrlSync(gearId);
```

### With Fallback
```javascript
const imageUrl = await GearImageService.getItemImageUrlWithFallback(
  gearId, 
  gearData, 
  '📦' // Fallback text/emoji
);
```

### High-Quality Images
```javascript
const hqUrl = await GearImageService.getItemImageUrlHighQuality(gearId, gearData);
```

### Batch Processing
```javascript
const results = await GearImageService.batchResolveItemIds(gearItems);
console.log(results); // { 'gear-id': 'item-id', ... }
```

### Cache Management
```javascript
// Warm up cache for all gear items
const warmupResults = await GearImageService.warmUpCache(gearData);

// Get cache information
const cacheInfo = GearImageService.getCacheInfo();

// Clear cache
GearImageService.clearCache();
```

## Testing

### Browser Testing
Open `test-gear-service.html` in your browser to:
- Test API functionality
- Verify image resolution
- See all gear items with their images
- Monitor cache performance

### Manual API Testing
```bash
# Search for items
curl "https://maplestory.io/api/GMS/208.2.0/item?searchFor=AbsoLab%20Mage%20Crown"

# Get specific item
curl "https://maplestory.io/api/GMS/208.2.0/item/1004423"
```

## Migration Guide

### For Existing Code
The service now provides multiple methods for different use cases:

**Sync Fallback (for immediate rendering):**
```javascript
const imageUrl = GearImageService.getItemImageUrlSync(gearId);
const enhancedUrl = GearImageService.getItemImageUrlEnhanced(gearId, gearData);
```

**Async with API Lookup (for accuracy):**
```javascript
const imageUrl = await GearImageService.getItemImageUrl(gearId, gearData);
const urlWithFallback = await GearImageService.getItemImageUrlWithFallback(gearId, gearData, '📦');
```

**Enhanced Method (background async with sync fallback):**
```javascript
// Uses cached/legacy data immediately while starting async lookup
const imageUrl = GearImageService.getItemImageUrlEnhanced(gearId, gearData);
```

### For New Implementations
1. Use async methods by default
2. Pass gear data when available for better name resolution
3. Implement error handling for API failures
4. Consider warming up cache for better user experience

## API Endpoints Used

- **Search**: `GET /api/{region}/{version}/item?searchFor={name}&count={limit}`
- **Specific Item**: `GET /api/{region}/{version}/item/{itemId}`
- **Item Icon**: `GET /api/{region}/{version}/item/{itemId}/icon`
- **High Quality**: Add `?resize=2` to icon URL

## Cache Strategy

- **Duration**: 24 hours for API responses
- **Storage**: Browser memory (window object)
- **Fallback**: Legacy hardcoded mappings always available
- **Cleanup**: Automatic expired cache removal

## Error Handling

The system uses a multi-layer fallback approach:
1. **Dynamic API Lookup** (most accurate)
2. **Legacy Item IDs** (emergency fallback)
3. **Default Placeholder** (last resort)

## Performance Considerations

- **First Load**: Slower due to API calls
- **Subsequent Loads**: Fast due to caching
- **Batch Operations**: Use batch processing for multiple items
- **Network Resilience**: Works offline with cached/legacy data

## Troubleshooting

### Images Not Loading
1. Check browser console for API errors
2. Verify network connectivity
3. Clear cache: `GearImageService.clearCache()`
4. Check gear.json for correct item names

### API Rate Limiting
- MapleStory.io may have rate limits
- Use cache warming to minimize calls
- Implement retry logic if needed

### Wrong Item Images
1. Verify item names in gear.json
2. Check API directly for correct names
3. Update GEAR_ID_TO_ITEM_NAME mapping

## File Structure

```
js/
├── mapleStoryAPIService.js    # API communication layer
├── gearImageService.js        # Main image resolution service
└── testGearImageService.js    # Node.js test suite

data/
└── gear.json                 # Gear database with corrected names

test-gear-service.html         # Browser-based testing interface
```

## Contributing

When adding new gear items:
1. Verify correct item names via API search
2. Add items to gear.json with proper structure
3. Update GEAR_ID_TO_ITEM_NAME if needed
4. Test with the HTML test interface

## Browser Compatibility

- **Modern Browsers**: Full async/await support required
- **Legacy Browsers**: Falls back to sync methods
- **Mobile**: Responsive design in test interface

## License

This implementation maintains the same licensing as the original project while adding enhanced functionality for better item image accuracy.