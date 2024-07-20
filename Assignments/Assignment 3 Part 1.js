////////////////////////////////////////////////////////////////////////////
////////// Assignment 3 Part 1: LandTrendr Input Data Exploration //////////
////////////////////////////////////////////////////////////////////////////

///// Define study area /////
var state = 'Maine';
var states = ee.FeatureCollection("TIGER/2018/States");
var filterState = ee.Filter.eq('NAME', state);
var aoi = states.filter(filterState).geometry().simplify({maxError: 100});
// geometry() needed to go from FeatureCollection to Polygon
// simplify() reduces the number of vertices (higher = more reduced)
//Map.addLayer(aoi);
//print(aoi); // Check number of vertices/data type

///// Load modules /////
var ltgee = require('users/emaprlab/public:Modules/LandTrendr.js'); //LandTrendr.js

// Helpful websites for exploring parameters (e.g., dates, indices, LandTrendr):
// https://emaprlab.users.earthengine.app/view/lt-gee-pixel-time-series
// https://jstnbraaten.users.earthengine.app/view/landsat-timeseries-explorer 

///// Define timing parameters /////
var startYear = 1984;
var endYear = 2021;
var startDay = '06-10';
var endDay = '08-30';
// Select dates based on data availabity / climate

///// Remove bad data (Fmask) /////
var maskThese = ['cloud', 'shadow', 'snow', 'water']; 
// Masked water because using TCW, lots of lakes/ocean in Maine

///// Build annual surface reflectance collection /////
// Define visualization parameters
var vizParamsSR = {
  bands: ['B4', 'B3', 'B2'], // FCC
  min: 0,
  max: 4000
};

// Build and map
var annualSR = ltgee.buildSRcollection(startYear, endYear, startDay, endDay, aoi, maskThese);
print('Annual Surface Reflectance Composites', annualSR);
//Map.addLayer(annualSR, vizParamsSR, 'Annual Surface Reflectance Composites', 0);
Map.addLayer(ee.Image(annualSR.filterDate('2021-01-01','2021-12-31').first().clip(aoi)), 
             vizParamsSR, '2021 Surface Reflectance Composite');
// First() needed to get clip() to work (converts to Image from ImageCollection?)
Map.addLayer(ee.Image(annualSR.filterDate('2002-01-01','2002-12-31').first().clip(aoi)), 
             vizParamsSR, '2002 Surface Reflectance Composite');
Map.addLayer(ee.Image(annualSR.filterDate('1984-06-10','1984-12-31').first().clip(aoi)), 
             vizParamsSR, '1984 Surface Reflectance Composite');
             

///// Build annual unmasked pixel count collection /////
// Define visualization parameters
var vizParamsPC = {
  min: 0,
  max: 15
};

// Build and map
var annualPC = ltgee.buildClearPixelCountCollection(startYear, endYear, startDay, endDay, aoi, maskThese);
print('Annual Unmasked Pixel Counts', annualPC);
//Map.addLayer(annualPC, vizParamsPC, 'Annual Unmasked Pixel Counts', 0); 
Map.addLayer(ee.Image(annualPC.filterDate('2021-01-01','2021-12-31').first().clip(aoi)), 
             vizParamsPC, '2021 Unmasked Pixel Counts');
Map.addLayer(ee.Image(annualPC.filterDate('2002-01-01','2002-12-31').first().clip(aoi)), 
             vizParamsPC, '2002 Unmasked Pixel Counts');
Map.addLayer(ee.Image(annualPC.filterDate('1984-06-10','1984-12-31').first().clip(aoi)), 
             vizParamsPC, '1984 Unmasked Pixel Counts');
             

// Easy for Image...
//var test = annualPC.filterDate('2021-01-01','2021-12-31').first().reduceRegion({
//  reducer: ee.Reducer.mean(),
//  geometry: aoi,
//  scale: 30,
//  maxPixels: 1e9
//});
//print(test);

// Find and print annual mean unmasked pixel count
// More complicated for image collection
var mean = function(image) {
  var mean = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: aoi,
    scale: 30,
    crs: 'EPSG:32619', // UTM zone 19N
    maxPixels: 1e9
  });
  return image.set(mean);
};

// Adds mean of each image as property in ImageCollection and prints
print(annualPC.map(mean).aggregate_array('B1'));

// B1 is newly added Band from mean function
// 0 corresponds to 1984, 37 to 2021
// Aggregates that property to a list and prints

///// Build annual vegetatoion index collection /////
// Select vegetation index of choice
var bandList = ['TCW']; // Tasseled Cap Wetness
var index = 'TCW';
var ftvList = ['TCW']; 
// Select index based on quantifying type of change 
// Change type thought to be most common / are most interested in
// TCW does really well at picking up timber harvest

// Transform surface reflectance collection to index
var vizParamsVI = {
  min: -2000,
  max: 0
};

// Build and map
var annualVI = ltgee.transformSRcollection(annualSR, bandList);
print('Annual Vegetation Index Composites', annualVI);
//Map.addLayer(annualVI, vizParamsVI, 'Annual Vegetation Index Composites', 0);
Map.addLayer(ee.Image(annualVI.filterDate('2021-01-01','2021-12-31').first().clip(aoi)), 
             vizParamsVI, '2021 Vegetation Index Composites');
Map.addLayer(ee.Image(annualVI.filterDate('2002-01-01','2002-12-31').first().clip(aoi)), 
             vizParamsVI, '2002 Vegetation Index Composites');
Map.addLayer(ee.Image(annualVI.filterDate('1984-06-10','1984-12-31').first().clip(aoi)), 
             vizParamsVI, '1984 Vegetation Index Composites');