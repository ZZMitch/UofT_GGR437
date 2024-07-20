// CCDC tutorial
// From: https://gee-ccdc-tools.readthedocs.io/en/latest/lctutorial/change.html

var utils = require('users/parevalo_bu/gee-ccdc-tools:ccdcUtilities/api');

// Define parameters

// Change detection parameters
var changeDetection = {
  breakpointBands: ['GREEN','RED','NIR','SWIR1','SWIR2'],
  tmaskBands: ['GREEN','SWIR2'],
  minObservations: 6,
  chiSquareProbability: 0.99,
  minNumOfYearsScaler: 1.33,
  dateFormat: 2,
  lambda: 0, //20/10000,
  maxIterations: 0 //25000
}; // GEE defaults to LASSO instead of OLS


// Classification parameters
var classification = {
  bandNames: ["B1","B2","B3","B4","B5","B6","B7"],
  inputFeatures: ["INTP", "SLP","PHASE","RMSE"],
  coefs: ["INTP", "SLP","COS", "SIN","RMSE","COS2","SIN2","COS3","SIN3"],
  ancillaryFeatures: ["ELEVATION","ASPECT","DEM_SLOPE","RAINFALL","TEMPERATURE"],
  resultFormat: 'SegCollection',
  classProperty: 'LC_Class',
  yearProperty: 'year',
  classifier: ee.Classifier.smileRandomForest,
  classifierParams: {
    numberOfTrees: 150,
    variablesPerSplit: null,
    minLeafPopulation: 1,
    bagFraction: 0.5,
    maxNodes: null
  },
  outPath: 'projects/GLANCE/RESULTS/CLASSIFICATION/VERSION_1',
  segs: ["S1", "S2", "S3", "S4", "S5", "S6"],
  trainingPath: 'projects/GLANCE/TRAINING/MASTER/NA/NA_V1/NA_Training_Master_V1_NO_LCMAP_2021_03_17',
  trainingPathPredictors: 'projects/GLANCE/TRAINING/MASTER/NA/NA_V1/NA_Training_Master_V1_NO_LCMAP_2021_03_17_predictors',
};

var studyRegion = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filterMetadata('country_na','equals','Kenya').union();

var params = {
  start: '2000-01-01',
  end: '2020-01-01',
  ChangeDetection: changeDetection,
  Classification: classification,
  StudyRegion: studyRegion
};

// Filter by date and a location in Kenya
var filteredLandsat = utils.Inputs.getLandsat()
    .filterBounds(params.StudyRegion)
    .filterDate(params.start, params.end);

print(filteredLandsat.size());

params.ChangeDetection.collection = filteredLandsat;

var results = ee.Algorithms.TemporalSegmentation.Ccdc(params.ChangeDetection);
print(results);
//Map.addLayer(results);

// Prepare training data

// Importing training data as an Earth Engine Asset
var trainingData = ee.FeatureCollection(params.Classification.trainingPath);
print(trainingData.first());

// Creating a numeric land cover attribute
print(trainingData.aggregate_histogram('LC_Class'));
trainingData  = trainingData.remap(['Bare','Developed','Forest','Herbaceous','Shrub','Snow/Ice','Water'],[1,2,3,4,5,6,7],'LC_Class');
print(trainingData.aggregate_histogram('LC_Class'));

// Add a year attribute
trainingData  = trainingData.map(function(feat) {
  return feat.set('year',2014)});
  
// Get predictor data for each training point
// Define bands to use in classification
var bands = params.Classification.bandNames

// Define coefficients to use in classification
var coefs = params.Classification.coefs

// Segment ids
var segs = params.Classification.segs

// Property corresponding to year of training data
var yearProperty = params.Classification.yearProperty

// Define path to change detection results
params.Classification.changeResults = results;

// Load ccd image stack with coefficients and change information
var ccdImage = utils.CCDC.buildCcdImage(params.Classification.changeResults, params.Classification.segs.length, params.Classification.bandNames)

print('CCD Image:', ccdImage)

// Finally, get ancillary topographic and climate data
var ancillary = utils.Inputs.getAncillary()

///// Error at this point about bands not matching /////