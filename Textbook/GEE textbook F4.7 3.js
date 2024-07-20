// GEE textbook F4.7 3 code

var palettes = require('users/gena/packages:palettes')
var ccdResults = ee.Image("projects/GLANCE/RESULTS/CHANGEDETECTION/SA/Rondonia_example_small");
Map.centerObject(ccdResults, 10);
print(ccdResults);

// Display segment start and end times
var start = ccdResults.select('tStart');
var end = ccdResults.select('tEnd');
Map.addLayer(start, {min:1999, max:2001}, 'Segment start');
Map.addLayer(end, {min:2010, max:2020}, 'Segment end');

// Stable: only one harmonic segment

// Find the segment that intersects a given date
var targetDate = 2005.5;
var selectSegment = start.lte(targetDate).and(end.gt(targetDate));
Map.addLayer(selectSegment, {}, 'Identified segment');

// First segment in list cross middle of 2005

// Get all coefs in the SWIR1 band.
var SWIR1Coefs = ccdResults.select('SWIR1_coefs');
Map.addLayer(SWIR1Coefs, {}, 'SWIR1 coefs');

// Select only those for the segment that we identified previously.
var sliceStart = selectSegment.arrayArgmax().arrayFlatten([['index']]);
var sliceEnd = sliceStart.add(1);
var selectedCoefs = SWIR1Coefs.arraySlice(0, sliceStart, sliceEnd);
Map.addLayer(selectedCoefs, {}, 'Selected SWIR1 coefs');

// Retrieve only the intercept coefficient.
var intercept = selectedCoefs.arraySlice(1, 0, 1).arrayProject([1]);
var intVisParams = {palette: palettes.matplotlib.viridis[7], min: -6, max: 6};
Map.addLayer(intercept.arrayFlatten([['INTP']]), intVisParams, 'INTP_SWIR1');

//  Intercept should represent the "average" reflectance of a segment
// But some outside 0 - 1 range
// Intercept calculate by CCDC at origin (e.g., time 0), not for requested year
