// Satellite basemap. 
Map.setOptions('SATELLITE');

// Define roi.
var roi = ee.Geometry.Point([-59.985146,-2.871413]); // Point over the Brazilian Amazon

// Add point to map.
Map.addLayer(roi,{color:'red'});
Map.centerObject(roi,16);

// The dependent variable we are modeling.
var dependent = 'NDVI';

// The number of cycles per year to model.
var harmonics = 1; //change cycle here.

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

// Define scaling function for Landsat 8 Collection 2 image collection.
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

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

// Define function to add variables for NDVI, time and a constant
// to Landsat 8 imagery.
var addVariables = function(image) {
  // Compute time in fractional years since the epoch.
  var date = ee.Date(image.get('system:time_start'));
  var years = date.difference(ee.Date('1970-01-01'), 'year');
  var timeRadians = ee.Image(years.multiply(2 * Math.PI));
  // Return the image with the added bands.
  return image
    // Add an NDVI band.
    .addBands(image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI'))
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
// and map functions.
var harmonicLandsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
            .filterBounds(roi)
            .map(applyScaleFactors)
            .map(maskSRClouds)
            .map(addVariables)  
            .map(addHarmonics(harmonicFrequencies));


// Filter for the pre-disturbance period.
var harmonicLandsatPre = harmonicLandsat.filterDate('2013-01-01','2014-12-12');

// The output of the regression reduction is a 4x1 array image.
var harmonicTrendPre = harmonicLandsatPre
  .select(independents.add(dependent))
  .reduce(ee.Reducer.linearRegression(independents.length(), 1));

// Turn the array image into a multi-band image of coefficients.
var harmonicTrendCoefficientsPre = harmonicTrendPre.select('coefficients')
  .arrayProject([0])
  .arrayFlatten([independents]);

// Compute fitted values.
var fittedHarmonicPre = harmonicLandsatPre.map(function(image) {
  return image.addBands(
    image.select(independents)
      .multiply(harmonicTrendCoefficientsPre)
      .reduce('sum')
      .rename('fitted'));
});


// Filter for the disturbance period.
var harmonicLandsatDist = harmonicLandsat.filterDate('2014-12-13','2019-01-01');
  
// The output of the regression reduction is a 4x1 array image.
var harmonicTrendDist = harmonicLandsatDist
  .select(independents.add(dependent))
  .reduce(ee.Reducer.linearRegression(independents.length(), 1));

// Turn the array image into a multi-band image of coefficients.
var harmonicTrendCoefficientsDist = harmonicTrendDist.select('coefficients')
  .arrayProject([0])
  .arrayFlatten([independents]);

// Compute fitted values.
var fittedHarmonicDist = harmonicLandsatDist.map(function(image) {
  return image.addBands(
    image.select(independents)
      .multiply(harmonicTrendCoefficientsDist)
      .reduce('sum')
      .rename('fitted'));
});


// Merge fitted models.
var mergedFitted = fittedHarmonicPre.merge(fittedHarmonicDist);

// Plot the fitted models and the original data at the ROI.
print(ui.Chart.image.series(
  mergedFitted.select(['fitted', 'NDVI']), roi, ee.Reducer.mean(), 30)
    .setOptions({
      title: 'Harmonic model: original and fitted values Merged models',
      lineWidth: 1,
      pointSize: 3,
}));
