// Tutorial 3 Code

// Exploring the full Landat 8 collection
//var landsat8All = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
var landsat8All = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
//print(landsat8All);
print('Number Images (All)', landsat8All.size());

// Filter to just images collected in 2021
//var startDate = '2021-01-01';
//var endDate = '2021-12-31';

//var landsat8Filtered = landsat8All.filterDate(startDate, endDate);
//print(landsat8Filtered.size());

// Filter to just images collected in summer 2021
//var startDate = '2021-06-10';
//var endDate = '2021-08-25';

//var landsat8Filtered = landsat8All.filterDate(startDate, endDate);
//print(landsat8Filtered.size());

// Filter to just images collected in summer 2021 over UTM Campus
var startDate = '2021-06-10';
var endDate = '2021-08-25';
var geoPoint = ee.Geometry.Point(-79.66, 43.55);

var landsat8Filtered = landsat8All.filterDate(startDate, endDate)
                                  .filterBounds(geoPoint);
print('Number Images (Filtered)', landsat8Filtered.size());

// Explore ImageCollecton metadata and map
print('Filtered Landsat 8 metadata', landsat8Filtered);
// Map.addLayer(landsat8Filtered,{} ,'Filtered Landsat 8');

// Output cloud_cover_land for all images in filtered ImageCollection
var cloudLand = landsat8Filtered.aggregate_array('CLOUD_COVER_LAND'); 
print('% Clouds over Land', cloudLand);

// Apply scaling factors
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

landsat8Filtered = landsat8Filtered.map(applyScaleFactors);

// Add NDVI band to all images in ImageCollection (or just return NDVI band)
var calcNDVI = function(image) {
  var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
  //return image.addBands(ndvi);
  return ndvi;
};

var landsat8FilteredNDVI = landsat8Filtered.map(calcNDVI);
print('Filtered Landsat 8 metadata + NDVI', landsat8FilteredNDVI);

// Reduce to mean
var mean2021 = landsat8FilteredNDVI.reduce(ee.Reducer.mean());
print('Mean NDVI 2021', mean2021);
Map.addLayer(mean2021, {min: 0, max: 1}, 'Mean NDVI 2021');

// Reduce to median
var median2021 = landsat8FilteredNDVI.reduce(ee.Reducer.median()); 
print('Median NDVI 2021', median2021);
Map.addLayer(median2021, {min: 0, max: 1}, 'Median NDVI 2021');

// Reduce to maximum
var max2021 = landsat8FilteredNDVI.reduce(ee.Reducer.max()); 
print('Max NDVI 2021', max2021);
Map.addLayer(max2021, {min: 0, max: 1}, 'Max NDVI 2021');

// 30th percentile
var p30_2021 = landsat8FilteredNDVI.reduce(ee.Reducer.percentile([30]));
print('30th percentile NDVI 2021', p30_2021);
Map.addLayer(p30_2021, {min: 0, max: 1}, '30th percentile NDVI 2021');