// Lecture 4 - ImageCollections + Filter/Map/Reduce: ENHANCE + under the hood

// Access Polygon data //
var worldCountries = ee.FeatureCollection('USDOS/LSIB/2017');
//print(worldCountries);
//Map.addLayer(worldCountries, {}, 'Countries'); 

var country = 'France';
var filterCountry = ee.Filter.eq('COUNTRY_NA', country);
var oneCountry = worldCountries.filter(filterCountry);
//Map.addLayer(oneCountry);

// Access ImageCollections //
// Landsat 8
var landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
//Map.addLayer(landsat8, {}, 'Full Landsat 8 ImageCollection');

// Landsat 7
var landsat7 = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2');
//Map.addLayer(landsat7, {}, 'Full Landsat 7 ImageCollection');

// Filter //
var startDate = '2021-01-01';
var endDate = '2022-01-01'; 

// Landsat 8
var myLandsat8  = landsat8.filterDate(startDate, endDate).filterBounds(oneCountry)
                          .filterMetadata('CLOUD_COVER', 'less_than', 70);
print('# Landsat 8 Images', myLandsat8.size());
//print('Filtered Landsat 8 ImageCollection', myLandsat8); 
//Map.addLayer(myLandsat8, {}, 'Filtered Landsat 8 ImageCollection');
// Landsat 7
var myLandsat7 = landsat7.filterDate(startDate, endDate).filterBounds(oneCountry)
                         .filterMetadata('CLOUD_COVER', 'less_than', 70); 
print('# Landsat 7 Images', myLandsat7.size()); 
//print('Filtered Landsat 7 ImageCollection', myLandsat7); 
//Map.addLayer(myLandsat7, {}, 'Filtered Landsat 7 ImageCollection');

// Map //
// Define and Apply scaling factors
function applyScaleFactors(image) {
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(thermalBands, null, true);
}
myLandsat8 = myLandsat8.map(applyScaleFactors);
//print('Scaled Landsat 8 ImageCollection', myLandsat8); 
//Map.addLayer(myLandsat8, {}, "Scaled Landsat 8 ImageCollection");
myLandsat7 = myLandsat7.map(applyScaleFactors);
//print('Scaled Landsat 7 ImageCollection', myLandsat7); 
//Map.addLayer(myLandsat7, {}, "Scaled Landsat 7 ImageCollection");

// Define and Apply cloud mask
function maskSRCloudsLandsat(image) {
  var cloudsBitMask = (1 << 3); 
  var cloudShadowBitMask = (1 << 4); 
  var qa = image.select('QA_PIXEL'); 
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}
var myLandsat8 = myLandsat8.map(maskSRCloudsLandsat);
//print('Cloud-masked Landsat 8 ImageCollection', myLandsat8); 
//Map.addLayer(myLandsat8, {}, "Cloud-masked Landsat 8 ImageCollection");
var myLandsat7 = myLandsat7.map(maskSRCloudsLandsat);
//print('Cloud-masked Landsat 7 ImageCollection', myLandsat7); 
//Map.addLayer(myLandsat7, {}, "Cloud-masked Landsat 7 ImageCollection");

// Calculate and reduce to just Celcius band
function calcCelcius(image) {
  var celcius = image.select('ST_B.*').add(-273.15);
  return celcius;
}
var myLandsat8celcius = myLandsat8.map(calcCelcius);
//print('Landsat 8 Celcius ImageCollection', myLandsat8celcius);
//Map.addLayer(myLandsat8celcius, {}, 'Landsat 8 Celcius ImageCollection');
var myLandsat7celcius = myLandsat7.map(calcCelcius);
//print('Landsat 7 Celcius ImageCollection', myLandsat7celcius);
//Map.addLayer(myLandsat7celcius, {}, 'Landsat 7 Celcius ImageCollection');

// Reduce //
// Match Landsat 7 ST_B6 name to Landsat 8 ST_B10
//var myLandsat7celcius = myLandsat7celcius.first().rename('ST_B10'); 
// rename works on Images not ImageCollections. Need to write a function. 
function renameLandsat7(image) {
  return image.rename('ST_B10');
}
var myLandsat7celcius = myLandsat7celcius.map(renameLandsat7);
//print('Renamed Lansat 7 Celcius ImageCollection', myLandsat7celcius);
//Map.addLayer(myLandsat7celcius, {}, 'Renamed Landsat 7 Celcius ImageCollection');

// Merge Landsat 7 and 8 collections
var myLandsat78celcius = myLandsat8celcius.merge(myLandsat7celcius);
//print('Merged Landsat 7&8 Celcius ImageCollection', myLandsat78celcius);
//Map.addLayer(myLandsat78celcius, {}, 'Merged Landsat 7&8 Celcius ImageCollection');

var mergedGoodPixelCount = myLandsat78celcius.reduce(ee.Reducer.count()).clip(oneCountry);
print('# Good Pixels in merged ImageCollection', mergedGoodPixelCount);
Map.addLayer(mergedGoodPixelCount, {min: 0, max: 50, 
             palette: 'red,orange,yellow,green,blue'}, 
             '# Good Pixels in merged ImageCollection');

// Max Reduce
var maxLandsat78celcius = myLandsat78celcius.reduce(ee.Reducer.max()).clip(oneCountry);
print('Max Landsat 7&8 Celcius Image', maxLandsat78celcius);
Map.addLayer(maxLandsat78celcius, {min: 0, max: 40, palette: ['blue', 'red']}, 
             'Max Landsat 7&8 Celcius Image');
             

// Country boundaries on top //
var empty = ee.Image().byte(); //Create empty image
var outline = empty.paint({featureCollection: worldCountries, color: 1, width: 2});
Map.addLayer(outline, {palette: 'black'}, 'Countries');

// What is the median max temperature? 
var medianMaxCelcius = maxLandsat78celcius.reduceRegion({
  reducer: ee.Reducer.median(),
  geometry: oneCountry,
  scale: 30,
  bestEffort: true,
  maxPixels: 100000
});
print('Median Max Temperature (C)', medianMaxCelcius);

// Display Histograms of temperature and good pixel counts //
// Code help from: 
// https://code.earthengine.google.com/3bf352e3116afeed9c39b000c7288545

// What is the distribution of temperatures? 
var distMaxCelcius = maxLandsat78celcius.reduceRegion({
  reducer: ee.Reducer.autoHistogram(100, 1), 
  geometry: oneCountry,
  scale: 30,
  bestEffort: true,
  maxPixels: 100000
});
//print('Max Temperature (C) Distribution', distMaxCelcius);

var histArray = ee.Array(distMaxCelcius.get('ST_B10_max'));
var binBottom = histArray.slice(1, 0, 1).project([0]);
var nPixels = histArray.slice(1, 1, null).project([0]);
var histColumnFromArray = ui.Chart.array.values({
  array:nPixels,
  axis: 0,
  xLabels: binBottom})
  .setChartType('ColumnChart');
print(histColumnFromArray);

// What is the distribution of pixel counts? 
var distGoodPixels = mergedGoodPixelCount.reduceRegion({
  reducer: ee.Reducer.autoHistogram(100, 1), 
  geometry: oneCountry,
  scale: 30,
  bestEffort: true,
  maxPixels: 100000
});

var histArray = ee.Array(distGoodPixels.get('ST_B10_count'));
var binBottom = histArray.slice(1, 0, 1).project([0]);
var nPixels = histArray.slice(1, 1, null).project([0]);
var histColumnFromArray = ui.Chart.array.values({
  array:nPixels,
  axis: 0,
  xLabels: binBottom})
  .setChartType('ColumnChart');
print(histColumnFromArray);

