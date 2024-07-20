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
print('Filtered L8', landsat8.size());
Map.addLayer(landsat8, {}, 'Filtered L8 ImCol');

// Landsat 7
var landsat7 = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2');
print('Filtered L7', landsat7.size());
Map.addLayer(landsat7, {}, 'Filtered L7 ImCol');

// Filter //
var startDate = '2021-01-01';
var endDate = '2022-01-01'; 

// Landsat 8
var myLandsat8  = landsat8.filterDate(startDate, endDate).filterBounds(oneCountry);
// Add Cloud metadata filter
//print('# of 2021 Landsat 8 C2 T1 Images over a country', myLandsat8.size()); 

// Landsat 7
//var myLandsat7 = landsat7.filterDate(startDate, endDate).filterBounds(oneCountry); 

// Map //
// Landsat 8: Apply scaling factors
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}
myLandsat8 = myLandsat8.map(applyScaleFactors);
//Map.addLayer(myLandsat8, {}, "Landsat 8 images over a country");

// Define and Apply cloud mask

// Landsat 8: Calculate and reduce to just Celcius band
function calcCelcius(image) {
  var celcius = image.select('ST_B.*').add(-273.15);
  return celcius;
}
var myLandsat8celcius = myLandsat8.map(calcCelcius);
print('Landsat 8 Celcius over a country', myLandsat8celcius);
//Map.addLayer(myLandsat8celcius, {}, 'Celcius over a country');

// Reduce //
// Landsat 8 
var maxLandsat8celcius = myLandsat8celcius.reduce(ee.Reducer.max()).clip(oneCountry);
print('Max Celcius', maxLandsat8celcius);
Map.addLayer(maxLandsat8celcius, {min: 0, max: 40, palette: ['blue', 'red']}, 'Max Celcius');

// What is the median max temperature across a country? 
var medianMaxCelcius = maxLandsat8celcius.reduceRegion({
  reducer: ee.Reducer.median(),
  geometry: oneCountry,
  scale: 30,
  bestEffort: true,
  maxPixels: 100000
});
print('Median Max Temperature (C)', medianMaxCelcius);

// Country boundaries on top //
var empty = ee.Image().byte(); //Create empty image
var outline = empty.paint({featureCollection: worldCountries, color: 1, width: 2});

Map.addLayer(outline, {palette: 'black'}, 'Countries');