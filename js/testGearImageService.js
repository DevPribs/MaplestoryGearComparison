/**
 * Test script for updated GearImageService with dynamic API lookup
 */

// Node.js environment setup for testing
if (typeof window === 'undefined') {
  global.window = {};
  global.fetch = async (url) => {
    // Mock fetch for testing - in real browser this would make actual HTTP requests
    console.log(`Mock fetch: ${url}`);
    
    // Return mock responses for known items
    if (url.includes('searchFor=AbsoLab%20Mage%20Crown')) {
      return {
        ok: true,
        json: async () => [{
          id: 1004423,
          name: 'AbsoLab Mage Crown'
        }]
      };
    }
    
    if (url.includes('searchFor=Royal%20Circlet')) {
      return {
        ok: true,
        json: async () => []
      };
    }
    
    // Default empty response
    return {
      ok: true,
      json: async () => []
    };
  };
}

// Load the services (in real usage, these would be loaded via script tags)
require('./mapleStoryAPIService.js');
require('./gearImageService.js');

const { MapleStoryAPIService } = global.window;
const { GearImageService } = global.window;

// Test data
const testGearItems = [
  { id: 'absolab-mage-crown', name: 'AbsoLab Mage Crown' },
  { id: 'cra-mage-hat', name: 'Royal Circlet' },
  { id: 'superior-gollux-ring', name: 'Superior Gollux Ring' }
];

async function runTests() {
  console.log('=== GearImageService Test Suite ===\n');

  try {
    // Test 1: Basic API search functionality
    console.log('1. Testing API search for "AbsoLab Mage Crown"...');
    const searchResult = await MapleStoryAPIService.searchItems('AbsoLab Mage Crown');
    console.log('   Search results:', searchResult.length > 0 ? '✅ Found' : '❌ Not found');
    
    // Test 2: Exact match finding
    console.log('\n2. Testing exact match for "AbsoLab Mage Crown"...');
    const exactMatch = await MapleStoryAPIService.findExactItem('AbsoLab Mage Crown');
    console.log('   Exact match:', exactMatch ? `✅ Found (ID: ${exactMatch.id})` : '❌ Not found');
    
    // Test 3: Best match finding
    console.log('\n3. Testing best match for "Royal Circlet"...');
    const bestMatch = await MapleStoryAPIService.findBestMatch('Royal Circlet');
    console.log('   Best match:', bestMatch ? `✅ Found (${bestMatch.name})` : '❌ Not found (expected)');
    
    // Test 4: Item ID resolution
    console.log('\n4. Testing item ID resolution...');
    for (const gear of testGearItems) {
      const itemId = await GearImageService.resolveItemId(gear.id, gear);
      console.log(`   ${gear.name}:`, itemId ? `✅ Resolved to ${itemId}` : '❌ Failed to resolve');
    }
    
    // Test 5: Image URL generation
    console.log('\n5. Testing image URL generation...');
    for (const gear of testGearItems) {
      const imageUrl = await GearImageService.getItemImageUrl(gear.id, gear);
      console.log(`   ${gear.name}:`, imageUrl ? `✅ ${imageUrl}` : '❌ Failed to generate URL');
    }
    
    // Test 6: High-quality image URL
    console.log('\n6. Testing high-quality image URL generation...');
    const firstGear = testGearItems[0];
    const highQualityUrl = await GearImageService.getItemImageUrlHighQuality(firstGear.id, firstGear);
    console.log(`   ${firstGear.name} (HQ):`, highQualityUrl ? `✅ ${highQualityUrl}` : '❌ Failed');
    
    // Test 7: Fallback functionality
    console.log('\n7. Testing fallback functionality...');
    const fallbackUrl = await GearImageService.getItemImageUrlWithFallback('non-existent-item', null, '❌');
    console.log(`   Non-existent item:`, fallbackUrl === '❌' ? '✅ Fallback worked' : '❌ Fallback failed');
    
    // Test 8: Cache functionality
    console.log('\n8. Testing cache functionality...');
    const cacheInfo = GearImageService.getCacheInfo();
    console.log('   Cache info:', JSON.stringify(cacheInfo, null, 2));
    
    // Test 9: Batch resolution
    console.log('\n9. Testing batch item ID resolution...');
    const batchResults = await GearImageService.batchResolveItemIds(testGearItems);
    console.log('   Batch results:', Object.keys(batchResults).length, 'items processed');
    Object.entries(batchResults).forEach(([gearId, itemId]) => {
      console.log(`   ${gearId}:`, itemId ? `✅ ${itemId}` : '❌ Failed');
    });
    
    console.log('\n=== Test Suite Complete ===');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testGearItems };