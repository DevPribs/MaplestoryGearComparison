/**
 * MapleStory Gear Image Service
 * Maps gear IDs to MapleStory item image IDs using MapleStory.io API
 */

class GearImageService {
  static BASE_URL = 'https://maplestory.io/api/GMS/253/item/';
  
  /**
   * Map current gear IDs to MapleStory item IDs
   * Based on research of MapleStory item database structure
   */
  static GEAR_ID_TO_ITEM_ID = {
    // AbsoLab Set (Level 160)
    'absolab-mage-crown': '1004423',
    'absolab-mage-suit': '1052887',
    'absolab-mage-shoes': '1073032',
    'absolab-mage-gloves': '1082637',
    'absolab-mage-cape': '1102794',
    'absolab-mage-shoulder': '1152176',
    'absolab-spellsong-wand': '1372222',

    // Arcane Umbra Set (Level 200)
    'arcane-mage-crown': '1004809',
    'arcane-mage-cape': '1102941',
    'arcane-mage-suit': '1053064',
    'arcane-mage-shoes': '1073159',
    'arcane-mage-gloves': '1082696',
    'arcane-mage-shoulder': '1152197',
    'arcane-umbra-wand': '1372228',
    'arcane-umbra-staff': '1382265',

    // CRA Set (Level 150) - Royal Dunwitch for Mage
    'cra-mage-hat': '1003798',

    // Superior Gollux Set (Level 150, 15-star cap)
    'superior-gollux-ring': '1113075',
    'superior-gollux-pendant': '1122267',
    'superior-gollux-earrings': '1032223',

    // Sweetwater Set (Level 160)
    'sweetwater-hat': '1003976',
    'sweetwater-suit': '1052669',
    'sweetwater-shoes': '1072870',
    'sweetwater-gloves': '1082556',
    'sweetwater-cape': '1102623',
    'sweetwater-shoulder': '1152160',
    'sweetwater-ring': '1113078',
    'sweetwater-pendant': '1122269',
    'sweetwater-earrings': '1032224',
    'sweetwater-belt': '1132247',
    'sweetwater-tattoo': '1012438',
    'sweetwater-monocle': '1022211',
    'sweetwater-wand': '1372195',
    'sweetwater-staff': '1382231'
  };

  /**
   * Get MapleStory item ID for a gear
   * @param {string} gearId - The internal gear ID
   * @returns {string|null} MapleStory item ID or null if not found
   */
  static getItemImageId(gearId) {
    return this.GEAR_ID_TO_ITEM_ID[gearId] || null;
  }

  /**
   * Get full image URL for a gear
   * @param {string} gearId - The internal gear ID
   * @returns {string|null} Full image URL or null if not found
   */
  static getItemImageUrl(gearId) {
    const imageId = this.getItemImageId(gearId);
    return imageId ? `${this.BASE_URL}${imageId}/icon` : null;
  }

  /**
   * Get image URL with fallback text for failed loading
   * @param {string} gearId - The internal gear ID
   * @param {string} fallbackText - Text to show if image fails (default: gear icon)
   * @returns {string} Image URL or fallback text
   */
  static getItemImageUrlWithFallback(gearId, fallbackText = '📦') {
    const url = this.getItemImageUrl(gearId);
    return url || fallbackText;
  }

  /**
   * Get high-quality image URL for a gear (2x size)
   * @param {string} gearId - The internal gear ID
   * @returns {string|null} High-quality image URL or null if not found
   */
  static getItemImageUrlHighQuality(gearId) {
    const url = this.getItemImageUrl(gearId);
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