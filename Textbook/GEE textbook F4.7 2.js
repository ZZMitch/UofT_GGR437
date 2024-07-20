// GEE textbook F4.7 2 code

var palettes = require('users/gena/packages:palettes');
//var ccdResults = ee.Image('projects/gee-book/assets/F4-7/Rondonia_example_small');
var ccdResults = ee.Image("projects/GLANCE/RESULTS/CHANGEDETECTION/SA/Rondonia_example_small");
Map.centerObject(ccdResults, 10);
print(ccdResults);

// 26 bands, some 2 dimensional (need array manipulation)

// Start by looking at the change bands (one of key outputs from CCDC)
// Select time of break and change probability array images
var change = ccdResults.select('tBreak');
var changeProb =  ccdResults.select('changeProb');

// Set the time range we want to use and get as mask of
// places that meet the condition
var start = 2000;
var end = 2021;
var mask = change.gt(start).and(change.lte(end)).and(changeProb.eq(1));
// Change probably = 1, removing spurious breaks

// Obtain number of breaks for the time range
var numBreaks = mask.arrayReduce(ee.Reducer.sum(), [0]);

Map.addLayer(numBreaks, {min:0, max:5}, "Number of breaks");
// # of times mask retrieved a positve result = number of changes detected by CCDC

// Visualize first or last time a break was recorded to help understand change dynamics
// Obtain first change in that time period
var dates = change.arrayMask(mask).arrayPad([1]);
var firstChange = dates
	.arraySlice(0, 0, 1)
	.arrayFlatten([['firstChange']])
	.selfMask();

var timeVisParams = {palette: palettes.colorbrewer.YlOrRd[9], min: start, max: end};
Map.addLayer(firstChange, timeVisParams, 'First change');

// Obtain last change in that time period
var lastChange = dates
	.arraySlice(0, -1)
	.arrayFlatten([['lastChange']])
	.selfMask();
Map.addLayer(lastChange, timeVisParams, 'Last change');
