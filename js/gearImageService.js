/**
 * MapleStory Gear Image Service
 * Maps gear IDs to MapleStory item image IDs using MapleStory.io API
 * Now uses dynamic item lookup via MapleStoryAPIService
 */

class GearImageService {
  static BASE_URL = 'https://maplestory.io/api/GMS/208.2.0/item/';
  
  /**
   * Fallback mappings for gear IDs to item names
   * Used when API lookup fails or for hardcoded items
   */
  static GEAR_ID_TO_ITEM_NAME = {
    // AbsoLab Set
    'absolab-mage-crown': 'AbsoLab Mage Crown',
    'absolab-mage-suit': 'AbsoLab Mage Suit',
    'absolab-mage-shoes': 'AbsoLab Mage Shoes',
    'absolab-mage-gloves': 'AbsoLab Mage Gloves',
    'absolab-mage-cape': 'AbsoLab Mage Cape',
    'absolab-spellsong-wand': 'AbsoLab Spellsong Wand',
    'absolab-mage-shoulder': 'AbsoLab Mage Shoulder',
    
    // Arcane Umbra Set
    'arcane-mage-crown': 'Arcane Mage Crown',
    'arcane-mage-cape': 'Arcane Mage Cape',
    'arcane-mage-suit': 'Arcane Mage Suit',
    'arcane-mage-shoes': 'Arcane Mage Shoes',
    'arcane-mage-gloves': 'Arcane Mage Gloves',
    'arcane-mage-shoulder': 'Arcane Mage Shoulder',
    
    // CRA Set (actual item names)
    'cra-mage-hat': 'Azure Loop',
    'cra-mage-overall': 'Fafnir Magician Overall',
    'cra-mage-pants': 'Fafnir Magician Pants',
    'cra-mage-gloves': 'Fafnir Magician Gloves',
    'cra-mage-shoes': 'Fafnir Magician Shoes',
    
    // Superior Gollux Set
    'superior-gollux-ring': 'Superior Gollux Ring',
    'superior-gollux-pendant': 'Superior Gollux Pendant',
    
    // Sweetwater Set
    'sweetwater-mage-hat': 'Sweetwater Hat',
    'sweetwater-mage-overall': 'Sweetwater Suit',
    'sweetwater-mage-pants': 'Sweetwater Pants',
    'sweetwater-mage-gloves': 'Sweetwater Gloves',
    'sweetwater-mage-shoes': 'Sweetwater Shoes',
    
    // Weapons
    'absolab-spellsong-wand': 'AbsoLab Spellsong Wand',
    'arcane-shade-wand': 'Arcane Shade Wand',
    
    // Common items (generic fallback)
    'common-ring-1': 'Ring',
    'common-earrings-1': 'Earrings',
    'common-earrings-2': 'Earrings',
    'common-pendant-1': 'Pendant',
    'common-shoulder': 'Shoulder'
  };

  /**
   * Legacy hardcoded item ID mappings (fallback only)
   */
  static LEGACY_ITEM_IDS = {
    'absolab-mage-crown': '1004423',
    'absolab-mage-suit': '1004425',
    'absolab-mage-shoes': '1004421',
    'absolab-mage-gloves': '1004422',
    'absolab-mage-cape': '1004427',
    'absolab-spellsong-wand': '1004428',
    'absolab-mage-shoulder': '1004429',
    'arcane-mage-crown': '1003701',
    'arcane-mage-cape': '1003756',
    'cra-mage-hat': '1003579',
    'cra-mage-overall': '1003580',
    'cra-mage-pants': '1003581',
    'cra-mage-gloves': '1003578',
    'cra-mage-shoes': '1003577',
    'superior-gollux-ring': '1003687',
    'superior-gollux-pendant': '1003691'
  };

  /**
   * Cache for resolved item IDs to avoid repeated API calls
   */
  static resolvedItemCache = {};

  /**
   * Get MapleStory item name for a gear ID
   * @param {string} gearId - The internal gear ID
   * @param {Object} gearData - Gear data from gear.json (optional)
   * @returns {string|null} Item name or null if not found
   */
  static getItemName(gearId, gearData = null) {
    // First try to use gear data name if provided
    if (gearData && gearData.name) {
      return gearData.name;
    }
    
    // Fall back to hardcoded mapping
    return this.GEAR_ID_TO_ITEM_NAME[gearId] || null;
  }

  /**
   * Resolve item ID using multiple strategies
   * @param {string} gearId - The internal gear ID
   * @param {Object} gearData - Gear data from gear.json (optional)
   * @returns {Promise<string|null>} MapleStory item ID or null if not found
   */
  static async resolveItemId(gearId, gearData = null) {
    // Check cache first
    if (this.resolvedItemCache[gearId]) {
      return this.resolvedItemCache[gearId];
    }

    let itemId = null;
    const itemName = this.getItemName(gearId, gearData);

    if (!itemName) {
      console.warn(`No item name found for gear ID: ${gearId}`);
      this.resolvedItemCache[gearId] = null;
      return null;
    }

    try {
      // Try dynamic lookup first
      if (typeof MapleStoryAPIService !== 'undefined') {
        const item = await MapleStoryAPIService.findBestMatch(itemName);
        if (item && item.id) {
          itemId = item.id.toString();
          console.log(`Resolved ${gearId} -> ${itemName} -> ID: ${itemId} (via API)`);
        }
      }

      // Fall back to legacy mapping if API lookup fails
      if (!itemId && this.LEGACY_ITEM_IDS[gearId]) {
        itemId = this.LEGACY_ITEM_IDS[gearId];
        console.log(`Resolved ${gearId} -> ${itemName} -> ID: ${itemId} (via legacy mapping)`);
      }

      // Cache the result
      this.resolvedItemCache[gearId] = itemId;
      return itemId;

    } catch (error) {
      console.error(`Failed to resolve item ID for ${gearId} (${itemName}):`, error);
      
      // Final fallback to legacy mapping
      if (this.LEGACY_ITEM_IDS[gearId]) {
        itemId = this.LEGACY_ITEM_IDS[gearId];
        console.log(`Resolved ${gearId} -> ${itemName} -> ID: ${itemId} (via emergency fallback)`);
        this.resolvedItemCache[gearId] = itemId;
        return itemId;
      }
      
      this.resolvedItemCache[gearId] = null;
      return null;
    }
  }

  /**
   * Get MapleStory item ID for a gear (synchronous fallback)
   * @param {string} gearId - The internal gear ID
   * @returns {string|null} MapleStory item ID or null if not found
   */
  static getItemImageId(gearId) {
    // Return cached ID if available
    if (this.resolvedItemCache[gearId]) {
      return this.resolvedItemCache[gearId];
    }
    
    // Return legacy mapping as synchronous fallback
    return this.LEGACY_ITEM_IDS[gearId] || null;
  }

  /**
   * Get full image URL for a gear (async with API lookup)
   * @param {string} gearId - The internal gear ID
   * @param {Object} gearData - Gear data from gear.json (optional)
   * @returns {Promise<string|null>} Full image URL or null if not found
   */
  static async getItemImageUrl(gearId, gearData = null) {
    try {
      // Try dynamic API lookup first
      if (typeof MapleStoryAPIService !== 'undefined') {
        const itemName = this.getItemName(gearId, gearData);
        if (itemName) {
          const imageUrl = await MapleStoryAPIService.getItemImageUrl(itemName);
          if (imageUrl) {
            return imageUrl;
          }
        }
      }

      // Fall back to legacy method
      const imageId = await this.resolveItemId(gearId, gearData);
      return imageId ? `${this.BASE_URL}${imageId}/icon` : null;

    } catch (error) {
      console.error(`Failed to get image URL for ${gearId}:`, error);
      
      // Final fallback to legacy synchronous method
      const imageId = this.getItemImageId(gearId);
      return imageId ? `${this.BASE_URL}${imageId}/icon` : null;
    }
  }

  /**
   * Get full image URL for a gear (enhanced sync method with async fallback)
   * @param {string} gearId - The internal gear ID
   * @param {Object} gearData - Gear data from gear.json (optional)
   * @returns {string|null} Full image URL or null if not found
   */
  static getItemImageUrlEnhanced(gearId, gearData = null) {
    // Return cached ID if available
    if (this.resolvedItemCache[gearId]) {
      return this.resolvedItemCache[gearId] ? 
        `${this.BASE_URL}${this.resolvedItemCache[gearId]}/icon` : null;
    }

    // Start async lookup in background but return fallback immediately
    if (typeof MapleStoryAPIService !== 'undefined') {
      const itemName = this.getItemName(gearId, gearData);
      if (itemName) {
        this.resolveItemId(gearId, gearData).catch(err => 
          console.warn(`Async lookup failed for ${gearId}:`, err)
        );
      }
    }

    // Return legacy fallback immediately
    const imageId = this.getItemImageId(gearId);
    return imageId ? `${this.BASE_URL}${imageId}/icon` : null;
  }
    try {
      // Try dynamic API lookup first
      if (typeof MapleStoryAPIService !== 'undefined') {
        const itemName = this.getItemName(gearId, gearData);
        if (itemName) {
          const imageUrl = await MapleStoryAPIService.getItemImageUrl(itemName);
          if (imageUrl) {
            return imageUrl;
          }
        }
      }

      // Fall back to legacy method
      const imageId = await this.resolveItemId(gearId, gearData);
      return imageId ? `${this.BASE_URL}${imageId}/icon` : null;

    } catch (error) {
      console.error(`Failed to get image URL for ${gearId}:`, error);
      
      // Final fallback to legacy synchronous method
      const imageId = this.getItemImageId(gearId);
      return imageId ? `${this.BASE_URL}${imageId}/icon` : null;
    }
  }

  /**
   * Get full image URL for a gear (synchronous fallback)
   * @param {string} gearId - The internal gear ID
   * @returns {string|null} Full image URL or null if not found
   */
  static getItemImageUrlSync(gearId) {
    const imageId = this.getItemImageId(gearId);
    return imageId ? `${this.BASE_URL}${imageId}/icon` : null;
  }

  /**
   * Get image URL with fallback text for failed loading (async)
   * @param {string} gearId - The internal gear ID
   * @param {Object} gearData - Gear data from gear.json (optional)
   * @param {string} fallbackText - Text to show if image fails (default: gear icon)
   * @returns {Promise<string>} Image URL or fallback text
   */
  static async getItemImageUrlWithFallback(gearId, gearData = null, fallbackText = '📦') {
    try {
      const url = await this.getItemImageUrl(gearId, gearData);
      return url || fallbackText;
    } catch (error) {
      console.error(`Error getting image URL with fallback for ${gearId}:`, error);
      return fallbackText;
    }
  }

  /**
   * Get image URL with fallback text for failed loading (sync fallback)
   * @param {string} gearId - The internal gear ID
   * @param {Object} gearData - Gear data from gear.json (optional)
   * @param {string} fallbackText - Text to show if image fails (default: gear icon)
   * @returns {string} Image URL or fallback text
   */
  static getItemImageUrlWithFallbackSync(gearId, gearData = null, fallbackText = '📦') {
    const url = this.getItemImageUrlEnhanced(gearId, gearData);
    return url || fallbackText;
  }

  /**
   * Get high-quality image URL for a gear (2x size) (async)
   * @param {string} gearId - The internal gear ID
   * @param {Object} gearData - Gear data from gear.json (optional)
   * @returns {Promise<string|null>} High-quality image URL or null if not found
   */
  static async getItemImageUrlHighQuality(gearId, gearData = null) {
    try {
      // Try dynamic API lookup first
      if (typeof MapleStoryAPIService !== 'undefined') {
        const itemName = this.getItemName(gearId, gearData);
        if (itemName) {
          const imageUrl = await MapleStoryAPIService.getItemImageUrl(itemName, true);
          if (imageUrl) {
            return imageUrl;
          }
        }
      }

      // Fall back to legacy method
      const url = await this.getItemImageUrl(gearId, gearData);
      return url ? `${url}?resize=2` : null;

    } catch (error) {
      console.error(`Failed to get high-quality image URL for ${gearId}:`, error);
      
      // Final fallback to legacy synchronous method
      const url = this.getItemImageUrlSync(gearId);
      return url ? `${url}?resize=2` : null;
    }
  }

  /**
   * Get high-quality image URL for a gear (2x size) (sync fallback)
   * @param {string} gearId - The internal gear ID
   * @returns {string|null} High-quality image URL or null if not found
   */
  static getItemImageUrlHighQualitySync(gearId) {
    const url = this.getItemImageUrlSync(gearId);
    return url ? `${url}?resize=2` : null;
  }

  /**
   * Preload image with error handling
   * @param {string} url - Image URL to preload
   * @param {Function} callback - Function to call on load/error
   */
  static preloadImage(url, callback) {
    const img = new Image();
    img.onload = () => callback(null, img);
    img.onerror = () => callback(new Error(`Failed to load image: ${url}`), null);
    img.src = url;
  }

  /**
   * Batch resolve item IDs for multiple gear items
   * @param {Array} gearItems - Array of gear objects with id and optional data
   * @returns {Promise<Object>} Mapping of gear IDs to resolved item IDs
   */
  static async batchResolveItemIds(gearItems) {
    const results = {};
    const promises = gearItems.map(async (gear) => {
      const itemId = await this.resolveItemId(gear.id, gear.data);
      results[gear.id] = itemId;
      return { gearId: gear.id, itemId };
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Clear all resolved item caches
   */
  static clearCache() {
    this.resolvedItemCache = {};
    if (typeof MapleStoryAPIService !== 'undefined') {
      MapleStoryAPIService.clearCache();
    }
  }

  /**
   * Get cache information
   * @returns {Object} Cache statistics
   */
  static getCacheInfo() {
    const itemCount = Object.keys(this.resolvedItemCache).length;
    const resolvedCount = Object.values(this.resolvedItemCache).filter(id => id !== null).length;
    
    let apiCacheInfo = {};
    if (typeof MapleStoryAPIService !== 'undefined') {
      apiCacheInfo = MapleStoryAPIService.getCacheInfo();
    }
    
    return {
      gearItemCache: {
        totalEntries: itemCount,
        resolvedEntries: resolvedCount,
        failedEntries: itemCount - resolvedCount
      },
      apiCache: apiCacheInfo
    };
  }

  /**
   * Warm up cache with all gear items
   * @param {Object} gearData - Complete gear data object from gear.json
   * @returns {Promise<Object>} Results of cache warmup
   */
  static async warmUpCache(gearData) {
    if (!gearData || !gearData.gear) {
      throw new Error('Invalid gear data provided for cache warmup');
    }

    console.log('Starting cache warmup for all gear items...');
    const startTime = Date.now();
    
    const results = await this.batchResolveItemIds(gearData.gear);
    const endTime = Date.now();
    
    console.log(`Cache warmup completed in ${endTime - startTime}ms`);
    return {
      itemsProcessed: gearData.gear.length,
      itemsResolved: Object.values(results).filter(id => id !== null).length,
      processingTime: endTime - startTime,
      results
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GearImageService;
} else if (typeof window !== 'undefined') {
  window.GearImageService = GearImageService;
}