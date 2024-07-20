var landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');

var worldCountries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');

var startDate = '2021-01-01';
var endDate = '2021-12-31';

var myLandsat8  = landsat8.filterDate(startDate, endDate).filterBounds(worldCountries);

// Apply scaling factors
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

myLandsat8 = myLandsat8.map(applyScaleFactors);

// Calculate and reduce to just Celcius band
function calcCelcius(image) {
  var celcius = image.select('ST_B.*').add(-273.15);
  return celcius;
}

var myLandsat8celcius = myLandsat8.map(calcCelcius);

// Reduce //
var maxLandsat8celcius = myLandsat8celcius.reduce(ee.Reducer.max());
var maxLandsat8celcius = maxLandsat8celcius.clip(worldCountries); // Clip to country
print('Max Celcius', maxLandsat8celcius);
Map.addLayer(maxLandsat8celcius, {min: 0, max: 40, palette: ['blue', 'red']}, 'Max Celcius');

var medianMaxCelcius = maxLandsat8celcius.reduceRegions({
  reducer: ee.Reducer.median(),
  collection: worldCountries,
  scale: 30
});
print('Median Max Temperature (C)', medianMaxCelcius);

// Country boundaries on top //
var empty = ee.Image().byte(); //Create empty image
var outline = empty.paint({featureCollection: worldCountries, color: 1, width: 2});

Map.addLayer(outline, {palette: 'black'}, 'Countries');