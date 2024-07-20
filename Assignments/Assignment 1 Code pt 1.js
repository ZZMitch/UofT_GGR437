// Assignment 1 Code pt 1 //

// Define Study Area: Ontario, Canada //
//print(area);
Map.centerObject(area, 5);
//Map.addLayer(area,  {}, 'Ontario');

// Create a 2020 peak summer Median/Medoid Composite //
// Load Input Image Collections
var landsat8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2"); // 2013 - 2021
var landsat7 = ee.ImageCollection("LANDSAT/LE07/C02/T1_L2"); // 1999 - 2021

// Filter
// Define time variables
var startDate20 = '2020-06-10';
var endDate20 = '2020-08-25';

// Landsat 8
var landsat8Filtered = landsat8.filterBounds(area).filterDate(startDate20, endDate20)
                               .filterMetadata('CLOUD_COVER', 'less_than', 70);
print('# Landsat 8 2020', landsat8Filtered.size());
// Landsat 7
var landsat7Filtered = landsat7.filterBounds(area).filterDate(startDate20, endDate20)
                               .filterMetadata('CLOUD_COVER', 'less_than', 70);
print('# Landsat 7 2020', landsat7Filtered.size());

// Map
// Define the scaling factor functions
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  return image.addBands(opticalBands, null, true)
}

// Apply the scaling factors to the collections
var landsat8Filtered = landsat8Filtered.map(applyScaleFactors);
var landsat7Filtered = landsat7Filtered.map(applyScaleFactors);

// Define the cloud mask function
function maskSRCloudsLandsat(image) {
  // Bits 3 and 4 are cloud shadow and cloud, respectively.
  var cloudsBitMask = (1 << 3); 
  var cloudShadowBitMask = (1 << 4); 
  // Get the pixel QA band.
  var qa = image.select('QA_PIXEL'); 
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

// Apply cloud mask to the collections
var landsat8FilteredMasked = landsat8Filtered.map(maskSRCloudsLandsat);
var landsat7FilteredMasked = landsat7Filtered.map(maskSRCloudsLandsat);

// Reduce //
// Reduce collections to RGB + NIR + SWIR 1/2
var landsat8FilteredMasked = landsat8FilteredMasked.select('SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7');
var landsat7FilteredMasked = landsat7FilteredMasked.select('SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7');

// Match up band names
function renameLandsat7(image){
  return image.select(
    ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'],
    ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7']);
}
var landsat7FilteredMasked = landsat7FilteredMasked.map(renameLandsat7);

// Merge Landsat collections
var landsat78 = landsat8FilteredMasked.merge(landsat7FilteredMasked);
print('Merged Landsat 7 and 8', landsat78);
//Map.addLayer(landsat78);

// Create Median/Medoid composite
var landsat20Median = landsat78.median().clip(area); // Calculate Median
Map.addLayer(landsat20Median, {bands:['SR_B4','SR_B3','SR_B2'], 
                              min:0, max:0.2},'Landsat 7/8 2020 Median');
print('Landsat Median 2020', landsat20Median);

//var landsat8Medoid = landsat8FilteredMasked.map(function(image) {
//  var diff = ee.Image(image).subtract(landsat8Median).pow(ee.Image.constant(2));
//  return diff.reduce('sum').addBands(image);
//}).reduce(ee.Reducer.min(7)).select([1, 2, 3, 4, 5, 6], ['SR_B2','SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7']).clip(area);
//
//Map.addLayer(landsat8Medoid, {bands:['SR_B4','SR_B3','SR_B2'], 
//                              min:0, max:0.2},'Landsat 8 2020 Medoid');


// Create a 1984 peak summer Median Composite //
// Load Input Image Collections
var landsat5 = ee.ImageCollection("LANDSAT/LT05/C02/T1_L2"); // 1984 - 2012
var landsat4 = ee.ImageCollection("LANDSAT/LT04/C02/T1_L2"); // 1982/83 - 1992/93

// Define time variables
var startDate84 = '1984-06-10';
var endDate84 = '1984-08-25';

// Filter
// Landsat 5
var landsat5Filtered = landsat5.filterBounds(area).filterDate(startDate84, endDate84)
                               .filterMetadata('CLOUD_COVER', 'less_than', 70);
print('# Landsat 5 1984', landsat5Filtered.size());
// Landsat 4
var landsat4Filtered = landsat4.filterBounds(area).filterDate(startDate84, endDate84)
                               .filterMetadata('CLOUD_COVER', 'less_than', 70);
print('# Landsat 4 1984', landsat4Filtered.size()); // Size 0, whats up with that? 

// Map //
// Apply the scaling factors to the collections
var landsat5Filtered = landsat5Filtered.map(applyScaleFactors);

// Apply cloud mask to the collections
var landsat5FilteredMasked = landsat5Filtered.map(maskSRCloudsLandsat);

// Reduce //
// Reduce collections to RGB + NIR + SWIR 1/2
var landsat5FilteredMasked = landsat5FilteredMasked.select('SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7');

print('Landsat 5', landsat5FilteredMasked);

// Create Median/Medoid composite
var landsat84Median = landsat5FilteredMasked.median().clip(area); // Calculate Median
Map.addLayer(landsat84Median, {bands:['SR_B3','SR_B2','SR_B1'], 
                              min:0, max:0.2},'Landsat 5 1984 Median');
print('Landsat Median 1984', landsat84Median);