/**
 * MapleStory Gear Image Service
 * Fetches gear images from MapleStory.io API using imageId from gear data
 */

class GearImageService {
  static BASE_URL = 'https://maplestory.io/api/GMS/253/item/';

  /**
   * Get full image URL for a gear item
   * @param {Object} gear - The gear object with imageId property
   * @returns {string|null} Full image URL or null if no imageId
   */
  static getItemImageUrl(gear) {
    if (!gear || !gear.imageId) return null;
    return `${this.BASE_URL}${gear.imageId}/icon`;
  }

  /**
   * Get image URL with fallback text for failed loading
   * @param {Object} gear - The gear object with imageId property
   * @param {string} fallbackText - Text to show if image fails (default: gear icon)
   * @returns {string} Image URL or fallback text
   */
  static getItemImageUrlWithFallback(gear, fallbackText = '📦') {
    const url = this.getItemImageUrl(gear);
    return url || fallbackText;
  }

  /**
   * Get high-quality image URL for a gear (2x size)
   * @param {Object} gear - The gear object with imageId property
   * @returns {string|null} High-quality image URL or null if no imageId
   */
  static getItemImageUrlHighQuality(gear) {
    const url = this.getItemImageUrl(gear);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GearImageService;
} else if (typeof window !== 'undefined') {
  window.GearImageService = GearImageService;
}
