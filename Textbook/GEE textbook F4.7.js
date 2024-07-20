// GEE textbook F4.7 code

var utils = require('users/parevalo_bu/gee-ccdc-tools:ccdcUtilities/api');

var studyRegion = ee.Geometry.Rectangle([[-63.9533, -10.1315],[-64.9118,-10.6813]]);
Map.addLayer(studyRegion); 

// Define start, end dates and Landsat bands to use
var startDate = '2000-01-01';
var endDate = '2020-01-01';
var bands =  ['BLUE','GREEN','RED','NIR','SWIR1','SWIR2','TEMP'];

// Retrieve all clear, Landsat 4, 5, 7 and 8 observations (Collection 1, Tier 1).
var filteredLandsat = utils.Inputs.getLandsat()
	.filterBounds(studyRegion)
	.filterDate(startDate, endDate)
	.select(bands);
	
// getLandsat is the workhorse here
// Retrieve all surface reflectance bands (renamed and scaled) + VIs
// Select only bands we are going to use

print(filteredLandsat.first());

// Set CCD params to use 
var ccdParams = {
  breakpointBands: ['GREEN','RED','NIR','SWIR1','SWIR2'],
  tmaskBands: ['GREEN','SWIR2'],
  minObservations: 6,
  chiSquareProbability: 0.99,
  minNumOfYearsScaler: 1.33,
  dateFormat: 1,
  lambda: 20/10000,
  maxIterations: 10000,
  collection: filteredLandsat 
};
// Default params except break point bands, date format and lamda (pass dictionary)
// Break point detection: all bands except blue and surface temperature
// Date format set to 1 = fractional years
// Lambda default scalled to matcch scale of surface reflectance units

// Run CCD
var ccdResults = ee.Algorithms.TemporalSegmentation.Ccdc(ccdParams);
print(ccdResults);
// 26 bands

// Computationally expensive very quickly > memory errors (more so than LandTrendr)
// Export results to EE Asset first
// Create a metadata dictionary with the parameters and arguments used
var metadata = ccdParams;
metadata['breakpointBands'] = metadata['breakpointBands'].toString();
metadata['tmaskBands'] = metadata['tmaskBands'].toString();
metadata['startDate'] =  startDate;
metadata['endDate'] =  endDate;
metadata['bands'] =  bands.toString();

// Export results, assigning the metadata as image properties
Export.image.toAsset({
  image: ccdResults.set(metadata),
  region: studyRegion,
  pyramidingPolicy: {".default": 'sample'},
  scale:30
});

