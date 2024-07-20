// Tutorial 3 Code pt 2

// Load ImageCollection
var landsat8All = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');

// Filter to just images collected in summer 2021
var startDate = '2021-06-10';
var endDate = '2021-08-25';

var landsat8Filtered = landsat8All.filterDate(startDate, endDate);

// Apply scaling factors
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

landsat8Filtered = landsat8Filtered.map(applyScaleFactors);

// Calculate NDVI
var calcNDVI = function(image) {
  var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
  return ndvi;
};

var landsat8FilteredNDVI = landsat8Filtered.map(calcNDVI);

// Reduce to maximum
var max2021 = landsat8FilteredNDVI.reduce(ee.Reducer.max()); 
print('Max NDVI 2021', max2021);
Map.addLayer(max2021, {min: 0, max: 1}, 'Max NDVI 2021');
