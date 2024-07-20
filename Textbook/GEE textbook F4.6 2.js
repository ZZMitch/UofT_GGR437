// Region of interest - point.
var roi = ee.Geometry.Point([-121.059,37.9242]); // point over California

// The dependent variable we are modeling.
var dependent = 'NDVI';

// The number of cycles per year to model.
var harmonics = 3; //change cycle here.

// Make a list of harmonic frequencies to model.  
// These also serve as band name suffixes.
var harmonicFrequencies = ee.List.sequence(1, harmonics);

// Function to get a sequence of band names for harmonic terms.
var getNames = function(base, list) {
  return ee.List(list).map(function(i) { 
    return ee.String(base).cat(ee.Number(i).int());
  });
};

// Construct lists of names for the harmonic terms.
var cosNames = getNames('cos_', harmonicFrequencies);
var sinNames = getNames('sin_', harmonicFrequencies);

// Independent variables.
var independents = ee.List(['constant', 't'])
  .cat(cosNames).cat(sinNames);

// Define the cloud mask function.
function maskSRClouds(image) {
  // Bits 3 and 4 are cloud shadow and cloud, respectively.
  var cloudsBitMask = (1 << 3);
  var cloudShadowBitMask = (1 << 4);
  // Get the pixel QA band.
  var qa = image.select('QA_PIXEL');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

// Define function to scale, and add variables (NDVI, time and a constant)
// to Landsat 8 imagery.
var addVariables = function(image) {
  // Scale bands.
  var img = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var imgScaled = image.addBands(img,null,true);
  // Compute time in fractional years since the epoch.
  var date = ee.Date(image.get('system:time_start'));
  var years = date.difference(ee.Date('1970-01-01'), 'year');
  var timeRadians = ee.Image(years.multiply(2 * Math.PI));
  // Return the image with the added bands.
  return imgScaled
    // Add an NDVI band.
    .addBands(imgScaled.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI'))
    // Add a time band.
    .addBands(timeRadians.rename('t'))
    .float()
    // Add a constant band.
    .addBands(ee.Image.constant(1));
};


// Function to compute the specified number of harmonics
// and add them as bands.  Assumes the time band is present.
var addHarmonics = function(freqs) {
  return function(image) {
    // Make an image of frequencies.
    var frequencies = ee.Image.constant(freqs);
    // This band should represent time in radians.
    var time = ee.Image(image).select('t');
    // Get the cosine terms.
    var cosines = time.multiply(frequencies).cos()
      .rename(cosNames);
    // Get the sin terms.
    var sines = time.multiply(frequencies).sin()
      .rename(sinNames);
    return image.addBands(cosines).addBands(sines);
  };
};

// Import the USGS Landsat 8 Level 2, Collection 2, Tier 1 image collection),
// filter, and map functions.
var harmonicLandsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
            .filterBounds(roi)
            .filterDate('2013-01-01','2018-01-01')
            .map(maskSRClouds)
            .map(addVariables)  
            .map(addHarmonics(harmonicFrequencies));
  
// The output of the regression reduction is a 4x1 array image.
var harmonicTrend = harmonicLandsat
  .select(independents.add(dependent))
  .reduce(ee.Reducer.linearRegression(independents.length(), 1));

// Turn the array image into a multi-band image of coefficients.
var harmonicTrendCoefficients = harmonicTrend.select('coefficients')
  .arrayProject([0])
  .arrayFlatten([independents]);

// Compute fitted values.
var fittedHarmonic = harmonicLandsat.map(function(image) {
  return image.addBands(
    image.select(independents)
      .multiply(harmonicTrendCoefficients)
      .reduce('sum')
      .rename('fitted'));
});

// Plot the fitted model and the original data at the ROI.
print(ui.Chart.image.series(
  fittedHarmonic.select(['fitted', 'NDVI']), roi, ee.Reducer.mean(), 30)
    .setOptions({
      title: 'Harmonic model: original and fitted values',
      lineWidth: 1,
      pointSize: 3,
}));