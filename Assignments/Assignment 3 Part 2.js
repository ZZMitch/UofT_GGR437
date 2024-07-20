//////////////////////////////////////////////////////////////////////////////////////////////
////////// Assignment 3 Part 2: Mapping and Quantifying Land Change with LandTrendr //////////
//////////////////////////////////////////////////////////////////////////////////////////////

///// Define study area /////
var state = 'Maine';
var states = ee.FeatureCollection("TIGER/2018/States");
var filterState = ee.Filter.eq('NAME', state);
var aoi = states.filter(filterState).geometry().simplify({maxError: 100});

///// Load modules /////
var ltgee = require('users/emaprlab/public:Modules/LandTrendr.js'); //LandTrendr.js

///// Define parameters /////
// Timing
var startYear = 1984;
var endYear = 2021;
var startDay = '06-10';
var endDay = '08-30';

// Masking
var maskThese = ['cloud', 'shadow', 'snow', 'water']; 

// Vegetation index
var bandList = ['TCW']; // Tasseld Cap Wetness
var index = 'TCW';
var ftvList = ['TCW']; 

// LandTrendr parameters
var runParams = { 
  maxSegments:            8,    // Up from 6 (longer time-series now)
  spikeThreshold:         0.9,
  vertexCountOvershoot:   3,
  preventOneYearRecovery: true, 
  recoveryThreshold:      0.25,
  pvalThreshold:          0.05,
  bestModelProportion:    0.75,
  minObservationsNeeded:  6
};

// Change parameters
var changeParams = { 
  delta:  'loss',
  sort:   'greatest',
  year:   {checked: false, start: 2000, end: 2010},
  mag:    {checked: true,  value: 1,    operator: '>', dsnr: true},
  dur:    {checked: true,  value: 4,    operator: '<'},
  preval: {checked: false, value:300,   operator: '>'},
  mmu:    {checked: true,  value: 11},
};

///// Run LandTrendr /////
var LTr = ltgee.runLT(startYear, endYear, startDay, endDay, aoi, index, ftvList, runParams, maskThese);
print('Annual LandTrendr Outputs', LTr);
//Map.addLayer(LTr, {}, 'LTr (LTr Guide)');

///// Explore LandTrendr Outputs /////
// Yearly Fitted Data
var vizParamsLT = {
  bands: ['yr_1984', 'yr_2002', 'yr_2020'],
  min: -2000,
  max: 0,
};

var fittedData = ltgee.getFittedData(LTr, startYear, endYear, index);
print('Annual LandTrendr fitted VIs', fittedData);
Map.addLayer(fittedData.clip(aoi), vizParamsLT, 'Annual LandTrendr fitted VIs');

// Find and export annual mean vegetation index value
// Note fittedData is an Image, not ImageCollection
var mean = fittedData.reduceRegion({ 
  reducer: ee.Reducer.mean(), 
  geometry: aoi,
  scale: 30, // 30 m Landsat pixels
  crs: 'EPSG:32619', // WGS 84 UTM zone 19N 
  maxPixels: 1e10,
  tileScale: 4 // Higher helps with memory errors
});
// Export
Export.table.toDrive({
  collection: ee.FeatureCollection([ee.Feature(null, mean)]),
  description: 'meanAnnualVegetationIndex',
  fileFormat: 'CSV'
});

// Find an and export change data from LandTrendr
// Building Change Data from LandTrendr
changeParams.index = index; // Need otherwise you get an error

var biggestLoss = ltgee.getChangeMap(LTr, changeParams);
print('Biggest Disturbance Information from LandTrendr', biggestLoss);
//Map.addLayer(biggestLoss);
// Give time to run (takes a while to populate)

// Biggest Disturbance Year
// Give these time to show up on map (takes a while)
// May want to zoom in (may not fully display at far out zooms)
var palette = ['#9400D3', '#4B0082', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'];
// Purple - Darker Purple - Blue - Green - Yellow - Orange - Red
// 1986 (Purple) - 2021 (Red)

var yodVizParams = {
  min: startYear,
  max: endYear,
  palette: palette
};

Map.addLayer(biggestLoss.select(['yod']).clip(aoi), yodVizParams, 'Year of Detection');

// Export
Export.image.toDrive({
  image: biggestLoss.clip(aoi).select(['yod']),
  description: 'BiggestLoss_Year',
  scale: 30,
  crs: 'EPSG:32619', // WGS 84 UTM zone 19N 
  region: aoi,
  maxPixels: 1e9,
});

// Biggest Disturbance Magnitude
var magVizParams = {
  min: 200,
  max: 1200,
  palette: palette
};

Map.addLayer(biggestLoss.select(['mag']).clip(aoi), magVizParams, 'Magnitude of Change');

// Export
Export.image.toDrive({
  image: biggestLoss.clip(aoi).select(['mag']),
  description: 'BiggestLoss_Mag',
  scale: 30,
  crs: 'EPSG:32619', // WGS 84 UTM zone 19N 
  region: aoi,
  maxPixels: 1e9
});

// What is the by-pixel distribution of biggest disturbance years? 
var distDisturbanceYear = biggestLoss.select(['yod']).unmask(0).clip(aoi).reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(), 
  geometry: aoi,
  scale: 30,
  crs: 'EPSG:32619', 
  maxPixels: 1e9,
  tileScale: 4
});
// Important: Need to set non-disturbed areas to 0 (no disturbance year) with unmask(0)
// https://developers.google.com/earth-engine/apidocs/ee-image-reduceregion
// https://developers.google.com/earth-engine/guides/reducers_reduce_region

// Export
Export.table.toDrive({
  collection: ee.FeatureCollection([ee.Feature(null, distDisturbanceYear)]),
  description: 'distDisturbanceYear',
  fileFormat: 'CSV'
});