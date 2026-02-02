/**
 * MapleStory API Service
 * Handles communication with MapleStory.io API for item data
 */

class MapleStoryAPIService {
  static BASE_URL = 'https://maplestory.io/api/GMS/208.2.0';
  static CACHE_KEY = 'maplestory_api_cache';
  static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Initialize cache storage
   */
  static initCache() {
    if (typeof window !== 'undefined' && !window[this.CACHE_KEY]) {
      window[this.CACHE_KEY] = {};
    }
  }

  /**
   * Get cached data or null if expired/not found
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data or null
   */
  static getCachedData(key) {
    this.initCache();
    const cache = typeof window !== 'undefined' ? window[this.CACHE_KEY] : {};
    const cached = cache[key];
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    
    // Remove expired cache
    if (cached) {
      delete cache[key];
    }
    
    return null;
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  static setCachedData(key, data) {
    this.initCache();
    const cache = typeof window !== 'undefined' ? window[this.CACHE_KEY] : {};
    cache[key] = {
      data: data,
      timestamp: Date.now()
    };
  }

  /**
   * Make HTTP request to MapleStory API
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} API response
   */
  static async makeRequest(endpoint) {
    const url = `${this.BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`MapleStory API request failed: ${url}`, error);
      throw error;
    }
  }

  /**
   * Search for items by name
   * @param {string} itemName - Item name to search for
   * @param {number} count - Maximum number of results (default: 10)
   * @returns {Promise<Array>} Array of matching items
   */
  static async searchItems(itemName, count = 10) {
    const cacheKey = `search_${itemName}_${count}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const encodedName = encodeURIComponent(itemName);
    const endpoint = `/item?searchFor=${encodedName}&count=${count}`;
    
    try {
      const results = await this.makeRequest(endpoint);
      this.setCachedData(cacheKey, results);
      return results;
    } catch (error) {
      console.error(`Failed to search for item: ${itemName}`, error);
      return [];
    }
  }

  /**
   * Find exact match for item name
   * @param {string} itemName - Exact item name to find
   * @returns {Promise<Object|null>} Item object or null if not found
   */
  static async findExactItem(itemName) {
    const cacheKey = `exact_${itemName}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const results = await this.searchItems(itemName, 20);
    const exactMatch = results.find(item => 
      item.name.toLowerCase() === itemName.toLowerCase()
    );

    this.setCachedData(cacheKey, exactMatch || null);
    return exactMatch || null;
  }

  /**
   * Find best match for item name (fuzzy matching)
   * @param {string} itemName - Item name to find
   * @returns {Promise<Object|null>} Best matching item or null
   */
  static async findBestMatch(itemName) {
    const cacheKey = `best_${itemName}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const results = await this.searchItems(itemName, 20);
    
    if (results.length === 0) {
      this.setCachedData(cacheKey, null);
      return null;
    }

    // First try exact match
    const exactMatch = results.find(item => 
      item.name.toLowerCase() === itemName.toLowerCase()
    );
    
    if (exactMatch) {
      this.setCachedData(cacheKey, exactMatch);
      return exactMatch;
    }

    // Find best partial match (simple string similarity)
    let bestMatch = results[0];
    let bestScore = this.similarityScore(itemName, bestMatch.name);
    
    for (let i = 1; i < results.length; i++) {
      const score = this.similarityScore(itemName, results[i].name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = results[i];
      }
    }

    // Only return if similarity is reasonable (> 0.5)
    if (bestScore > 0.5) {
      this.setCachedData(cacheKey, bestMatch);
      return bestMatch;
    }

    this.setCachedData(cacheKey, null);
    return null;
  }

  /**
   * Calculate similarity score between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  static similarityScore(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Simple similarity based on common words
    const words1 = s1.split(' ');
    const words2 = s2.split(' ');
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || (word1.length > 3 && word2.includes(word1)) || (word2.length > 3 && word1.includes(word2))) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  /**
   * Get item by ID
   * @param {number} itemId - Item ID
   * @returns {Promise<Object|null>} Item object or null
   */
  static async getItemById(itemId) {
    const cacheKey = `item_${itemId}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const item = await this.makeRequest(`/item/${itemId}`);
      this.setCachedData(cacheKey, item);
      return item;
    } catch (error) {
      console.error(`Failed to get item by ID: ${itemId}`, error);
      return null;
    }
  }

  /**
   * Get item image URL for an item
   * @param {string|number} itemIdentifier - Item name or ID
   * @param {boolean} highQuality - Whether to return high quality URL
   * @returns {Promise<string|null>} Image URL or null
   */
  static async getItemImageUrl(itemIdentifier, highQuality = false) {
    let item = null;
    
    // If identifier is a number, treat as ID
    if (typeof itemIdentifier === 'number') {
      item = await this.getItemById(itemIdentifier);
    } else {
      // Try to find by name
      item = await this.findBestMatch(itemIdentifier);
    }

    if (!item) {
      return null;
    }

    const imageUrl = `${this.BASE_URL}/item/${item.id}/icon`;
    return highQuality ? `${imageUrl}?resize=2` : imageUrl;
  }

  /**
   * Clear all cached data
   */
  static clearCache() {
    if (typeof window !== 'undefined') {
      window[this.CACHE_KEY] = {};
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache info
   */
  static getCacheInfo() {
    this.initCache();
    const cache = typeof window !== 'undefined' ? window[this.CACHE_KEY] : {};
    
    const keys = Object.keys(cache);
    const expiredCount = keys.filter(key => 
      Date.now() - cache[key].timestamp >= this.CACHE_DURATION
    ).length;
    
    return {
      totalEntries: keys.length,
      expiredEntries: expiredCount,
      validEntries: keys.length - expiredCount
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapleStoryAPIService;
} else if (typeof window !== 'undefined') {
  window.MapleStoryAPIService = MapleStoryAPIService;
}