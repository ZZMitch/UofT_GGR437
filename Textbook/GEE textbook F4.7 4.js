// Load the required libraries
var palettes = require('users/gena/packages:palettes');
var utils = require('users/parevalo_bu/gee-ccdc-tools:ccdcUtilities/api');

// Load the results
var ccdcResults = ee.Image("projects/GLANCE/RESULTS/CHANGEDETECTION/SA/Rondonia_example_small");
Map.centerObject(ccdcResults, 10);

// Convert date into fractional years
var inputDate = '2005-09-25';
var dateParams = {inputFormat: 3, inputDate: inputDate, outputFormat: 1};
var formattedDate = utils.Dates.convertDate(dateParams);

// Band names originally used as inputs to the CCD algorithm
var BANDS = ['BLUE', 'GREEN', 'RED', 'NIR', 'SWIR1', 'SWIR2', 'TEMP'];

// Names for the time segments to retrieve
var SEGS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'];
// List length = max number of segments to retrieve per pixel
// Requesting a pre-defined max number of segments ensure structure of multi-band image is known
// Greatly facilitating its manipulation and display

// Transform CCD results into regular multiband image
var ccdImage = utils.CCDC.buildCcdImage(ccdcResults, SEGS.length, BANDS);

print(ccdImage);

// Define bands to select.
var SELECT_BANDS = ['RED', 'GREEN', 'BLUE', 'NIR'];

// Define coefficients to select.
// This list contains all possible coefficients, and the RMSE
var SELECT_COEFS = ['INTP', 'SLP', 'RMSE'];

// Obtain coefficients.
var coefs = utils.CCDC.getMultiCoefs(
  ccdImage, formattedDate, SELECT_BANDS, SELECT_COEFS, true, SEGS, 'after');
print(coefs);

// Show a single coefficient.
var slpVisParams = {palette: palettes.matplotlib.viridis[7], min: -0.0005, max: 0.005};
Map.addLayer(coefs.select('RED_SLP'), slpVisParams, 'RED SLOPE 2005-09-25');
Map.addLayer(coefs.select('NIR_SLP'), slpVisParams, 'NIR SLOPE 2005-09-25');
// High positive = change = bright

var rmseVisParams = {palette: palettes.matplotlib.viridis[7], min: 0, max: 0.1};
Map.addLayer(coefs.select('NIR_RMSE'), rmseVisParams, 'NIR RMSE 2005-09-25');
// Forest more predictable (stable, lower RMSE)

// Show an RGB with three coefficients.
var rgbVisParams = {bands: ['RED_INTP', 'GREEN_INTP', 'BLUE_INTP'], min: 0, max: 0.1};
Map.addLayer(coefs, rgbVisParams, 'RGB 2005-09-25');
// Intercept calculate from middle point of timesegment intercept the date requested
// Representing the average reflectance for the span of the selected segment
// Similar to composite image for the selected date, but advantage of being cloud free