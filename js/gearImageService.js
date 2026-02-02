/**
 * MapleStory Gear Image Service
 * Maps gear IDs to MapleStory item image IDs using OpenAPI CDN
 */

class GearImageService {
  static BASE_URL = 'https://cdn.jsdelivr.net/npm/maplestory-openapi@latest/resources/item/icon/';
  
  /**
   * Map current gear IDs to MapleStory item IDs
   * Based on research of MapleStory item database structure
   */
  static GEAR_ID_TO_ITEM_ID = {
    // AbsoLab Set
    'absolab-mage-crown': '00002228',
    'absolab-mage-suit': '00002230',
    'absolab-mage-shoes': '00002226',
    'absolab-mage-gloves': '00002227',
    'absolab-mage-cape': '00002232',
    'absolab-spellsong-wand': '00002233',
    'absolab-mage-shoulder': '00002234',
    
    // Arcane Umbra Set
    'arcane-mage-crown': '00002144',
    'arcane-mage-cape': '00002199',
    
    // CRA Set
    'cra-mage-hat': '00002099',
    'cra-mage-overall': '00002100',
    'cra-mage-pants': '00002101',
    'cra-mage-gloves': '00002098',
    'cra-mage-shoes': '00002097',
    
    // Superior Gollux Set
    'superior-gollux-ring': '00002057',
    'superior-gollux-pendant': '00002061',
    
    // Sweetwater Set
    'sweetwater-mage-hat': '00002636',
    'sweetwater-mage-overall': '00002637',
    'sweetwater-mage-pants': '00002638',
    'sweetwater-mage-gloves': '00002639',
    'sweetwater-mage-shoes': '00002640',
    
    // Weapons (will need to add more as needed)
    'absolab-spellsong-wand': '00002233',
    'arcane-shade-wand': '00002146',
    
    // Common items
    'common-ring-1': '00020111',
    'common-earrings-1': '00020112',
    'common-earrings-2': '00020113',
    'common-pendant-1': '00020114',
    'common-shoulder': '00020115'
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
    return imageId ? `${this.BASE_URL}${imageId}.img` : null;
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