// Imports
var aoi_old = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-71.20585937500002, 47.565183593175995],
          [-71.20585937500002, 42.831423970138324],
          [-66.60258789062502, 42.831423970138324],
          [-66.60258789062502, 47.565183593175995]]], null, false),
    states = ee.FeatureCollection("TIGER/2018/States");

///// Assignment 3 Code  /////

///// Define study area /////
var state = 'Maine';
var filterState = ee.Filter.eq('NAME', state);
var aoi = states.filter(filterState);
//Map.addLayer(aoi);

///// Load modules /////
var ltgee = require('users/emaprlab/public:Modules/LandTrendr.js'); //LandTrendr.js

// Helpful websites for exploring parameters (e.g., dates, indices, LandTrendr):
// https://emaprlab.users.earthengine.app/view/lt-gee-pixel-time-series
// https://jstnbraaten.users.earthengine.app/view/landsat-timeseries-explorer 

///// Define parameters /////
// Timing
var startYear = 1984;
var endYear = 2021;
var startDay = '06-10';
var endDay = '08-30';
// Select dates based on data availabity / climate

// coords, aoi

// Remove bad data (Fmask)
var maskThese = ['cloud', 'shadow', 'snow']; 
// Not masked: water

// Select vegetation index of choice
var bandList = ['TCW']; // Tasseld Cap Wetness
var index = 'TCW';
var ftvList = ['TCW']; 
// Select index based on quantifying type of change 
// Change type thought to be most common / are most interested in
// TCW does really well at picking up timber harvest


// Select LandTrendr parameters of choice
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

// Define change parameters
var changeParams = { 
  delta:  'loss',
  sort:   'greatest',
  year:   {checked: false, start: 2000, end: 2010},
  mag:    {checked: true,  value: 1,    operator: '>', dsnr: true},
  dur:    {checked: true,  value: 4,    operator: '<'},
  preval: {checked: false, value:300,   operator: '>'},
  mmu:    {checked: true,  value: 11},
};

///// Explore Collections that go into LandTrendr  /////
// Build annual surface reflectance collection
var vizParamsSR = {
  bands: ['B4', 'B2', 'B1'],
  min: 0,
  max: 4000
};

var annualSR = ltgee.buildSRcollection(startYear, endYear, startDay, endDay, aoi_old, maskThese);
print('Annual Surface Reflectance Composites', annualSR);
Map.addLayer(annualSR, vizParamsSR, 'Annual Surface Reflectance Composites', 0); // Mapped, but not shown
Map.addLayer(ee.Image(annualSR.filterDate('2021-01-01','2021-12-31').first().clip(aoi)), 
             vizParamsSR, '2021 Surface Reflectance Composite');
Map.addLayer(ee.Image(annualSR.filterDate('2002-01-01','2002-12-31').first().clip(aoi)), 
             vizParamsSR, '2002 Surface Reflectance Composite');
Map.addLayer(ee.Image(annualSR.filterDate('1984-06-10','1984-12-31').first().clip(aoi)), 
             vizParamsSR, '1984 Surface Reflectance Composite');

// Build annual unmasked pixel count collection
var vizParamsPC = {
  min: 0,
  max: 15
};

var annualPC = ltgee.buildClearPixelCountCollection(startYear, endYear, startDay, endDay, aoi_old, maskThese);
print('Annual Unmasked Pixel Counts', annualPC);
Map.addLayer(annualPC, vizParamsPC, 'Annual Unmasked Pixel Counts', 0); // Mapped, but not shown
Map.addLayer(ee.Image(annualPC.filterDate('2021-01-01','2021-12-31').first().clip(aoi)), 
             vizParamsPC, '2021 Unmasked Pixel Counts');
Map.addLayer(ee.Image(annualPC.filterDate('2002-01-01','2002-12-31').first().clip(aoi)), 
             vizParamsPC, '2002 Unmasked Pixel Counts');
Map.addLayer(ee.Image(annualPC.filterDate('1984-06-10','1984-12-31').first().clip(aoi)), 
             vizParamsPC, '1984 Unmasked Pixel Counts');

// Transform surface reflectance collection to index
var vizParamsVI = {
  min: -2000,
  max: 0
};

var annualVI = ltgee.transformSRcollection(annualSR, bandList);
print('Annual Vegetation Index Composites', annualVI);
Map.addLayer(annualVI, vizParamsVI, 'Annual Vegetation Index Composites', 0); // Mapped, but not shown
Map.addLayer(ee.Image(annualVI.filterDate('2021-01-01','2021-12-31').first().clip(aoi)), 
             vizParamsVI, '2021 Vegetation Index Composites');
Map.addLayer(ee.Image(annualVI.filterDate('2002-01-01','2002-12-31').first().clip(aoi)), 
             vizParamsVI, '2002 Vegetation Index Composites');
Map.addLayer(ee.Image(annualVI.filterDate('1984-06-10','1984-12-31').first().clip(aoi)), 
             vizParamsVI, '1984 Vegetation Index Composites');

///// Run LandTrendr /////
var LTr = ltgee.runLT(startYear, endYear, startDay, endDay, aoi_old, index, ftvList, runParams, maskThese);
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

// Biggest Disturbance Magnitude
var magVizParams = {
  min: 200,
  max: 1200,
  palette: palette
};

Map.addLayer(biggestLoss.select(['mag']).clip(aoi), magVizParams, 'Magnitude of Change');

// What % of Maine has undergone a disturbance since 1984?

// What is the by-pixel distribution of biggest disturbance years? 
var distDisturbanceYear = biggestLoss.select(['yod']).unmask(0).clip(aoi).reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(), 
  geometry: aoi,
  scale: 30,
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