// Lecture 4 - ImageCollections + Filter/Map/Reduce - ENHANCE (merge collections, cloud masking) + under the hood

// Lets find warm countries :)

// Access ImageCollections //
var landsat5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2');
//print('# of Landsat 5 C2 T1 Images', landsat5.size()); // 1.9 Million images
//Map.addLayer(landsat5, {}, 'Landsat 5'); // Adding EVERY Landsat 5 image to the map

//var landsat7 = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2');

var landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');

// Access Polygon data //
var worldCountries = ee.FeatureCollection('USDOS/LSIB/2017');
//print(worldCountries);
//Map.addLayer(worldCountries, {}, 'Countries'); 

var country = 'Tajikistan';
var filterCountry = ee.Filter.eq('COUNTRY_NA', country);
var oneCountry = worldCountries.filter(filterCountry);
//Map.addLayer(oneCountry);

// Filter //
//var startDate = '2000-01-01'; 
//var endDate = '2000-12-31';

//var myLandsat5 = landsat5.filterDate(startDate, endDate); 
//Map.addLayer(myLandsat5, {}, 'Landsat 5'); // Uh oh... not global coverage! 

//var myLandsat7 = landsat7.filterDate(startDate, endDate); 
//Map.addLayer(myLandsat7, {}, 'Landsat 7'); // Almost global coverage (LTAP)

var startDate = '2021-01-01';
var endDate = '2021-12-31';

var myLandsat8  = landsat8.filterDate(startDate, endDate).filterBounds(oneCountry);
//print('# of 2021 Landsat 8 C2 T1 Images over a country', myLandsat8.size()); 

// Map //
// Apply scaling factors
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

myLandsat8 = myLandsat8.map(applyScaleFactors);

//Map.addLayer(myLandsat8, {}, "Landsat 8 images over a country");

// Calculate and reduce to just Celcius band
function calcCelcius(image) {
  var celcius = image.select('ST_B.*').add(-273.15);
  return celcius;
}

var myLandsat8celcius = myLandsat8.map(calcCelcius);
print('Landsat 8 Celcius over a country', myLandsat8celcius);
//Map.addLayer(myLandsat8celcius, {}, 'Celcius over a country');

// Reduce //
var maxLandsat8celcius = myLandsat8celcius.reduce(ee.Reducer.max());
var maxLandsat8celcius = maxLandsat8celcius.clip(oneCountry); // Clip to country
print('Max Celcius', maxLandsat8celcius);
Map.addLayer(maxLandsat8celcius, {min: 0, max: 40, palette: ['blue', 'red']}, 'Max Celcius');
// Issue with finding cold countries instead (e.g., using min reducer?) - clouds! 

// What is the median max 2021 temperature across a country? 
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