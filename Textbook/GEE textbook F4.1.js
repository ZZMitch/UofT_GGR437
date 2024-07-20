// GEE  textbook F4.1 code

// Define a region of interest as a point in Lisbon, Portugal.
var lisbonPoint = ee.Geometry.Point(-9.179473, 38.763948);

// Center the map at that point.
Map.centerObject(lisbonPoint, 16);

// filter the large ImageCollection to be just images from 2020 
// around Lisbon. From each image, select true-color bands to draw
var filteredIC = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA")
  .filterDate('2020-01-01', '2021-01-01')
  .filterBounds(lisbonPoint)
  .select(['B6', 'B5', 'B4']);

// Add the filtered ImageCollection so that we can inspect values 
// via the Inspector tool
Map.addLayer(filteredIC, {}, 'TOA image collection');

// compute and show the number of observations in an image collection
var count = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA")
  .filterDate('2020-01-01', '2021-01-01')
  .select(['B6'])
.count();

Map.addLayer(count, {
    min: 0,
    max: 50,
    palette: ['red', 'yellow', 'green']
}, 'landsat 8 image count (2020)');


var meanFilteredIC = filteredIC.reduce(ee.Reducer.mean());
Map.addLayer(meanFilteredIC, {}, 'Mean values within image collection');

var medianFilteredIC = filteredIC.reduce(ee.Reducer.median());
Map.addLayer(medianFilteredIC, {}, 'Median values within image collection');

// compute a 30% (quantile) 
var p30 = filteredIC.reduce(ee.Reducer.percentile([30]));

Map.addLayer(p30, {
    min: 0.05,
    max: 0.35
}, '30%');

var percentiles = [0, 10, 20, 30, 40, 50, 60, 70, 80]

// let's compute percentile images and add them as separate layers
percentiles.map(function(p) {
  var image = filteredIC.reduce(ee.Reducer.percentile([p]))
  Map.addLayer(image, { min: 0.05, max: 0.35 }, p + '%')
})