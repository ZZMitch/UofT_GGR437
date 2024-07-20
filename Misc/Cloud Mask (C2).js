// Define the cloud mask function
function maskSRClouds(image) {
  // Bits 3 and 4 are cloud shadow and cloud, respectively.
  var cloudsBitMask = (1 << 3); // Set 3 and 4 to 1?
  var cloudShadowBitMask = (1 << 4); // Left shift operator (for bits)
  // Get the pixel QA band.
  var qa = image.select('QA_PIXEL'); 
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

// Apply cloud mask to collection
var l8FiltMasked = l8FiltClouds.map(maskSRClouds); 