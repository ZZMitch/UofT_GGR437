// Code for GEE textbook F4.0

var imgCol = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2'); 
// How many Tier 1 Landsat 5 images have ever been collected? 
print(imgCol.size());
// How many Landsat 5 images have ever been collected? A very large number (1,860,433)

// How many images were collected in the 2000s? 
var startDate = '2000-01-01'; 
var endDate = '2010-01-01';

var imgColfilteredByDate = imgCol.filterDate(startDate, endDate); 
print(imgColfilteredByDate.size()); 
// A smaller (but still large) number (644,922)

var imgColfilteredByDateHere = imgColfilteredByDate.filterBounds(Map.getCenter());
print(imgColfilteredByDateHere.size());
// A smaller number (125 - Shenghai, China)

var L5FilteredLowCloudImages = imgColfilteredByDateHere .filterMetadata('CLOUD_COVER', 'less_than', 50); 
print(L5FilteredLowCloudImages.size());
// A smaller number (83)

var makeLandsat5EVI = function(oneL5Image) { 
  // compute the EVI for any Landsat 5 image. Note is it specific to 
  // Landsat 5 images because of the band numbers. Do not run this exact 
  // function for images from sensors other than Landsat 5. 
  
  // select the proper bands from the Landsat 5 image and give them 
  // names that represent their role in the formula. 
  var theNIR = oneL5Image.select('SR_B4'); 
  var theRed = oneL5Image.select('SR_B3'); 
  var theBlue = oneL5Image.select('SR_B1'); 
  
  var theNumerator = (theNIR.subtract(theRed)).multiply(2.5); 
  // note the order is done from left to right 
  var denomClause1 = theRed.multiply(6); 
  var denomClause2 = theBlue.multiply(7.5); 
  var theDenominator = theNIR.add(denomClause1).subtract(denomClause2).add(1); 
  var landsat5EVI = theNumerator.divide(theDenominator).rename(["EVI"]); 
  return (landsat5EVI); 
  //return (oneL5Image.addBands(landsat5EVI))
};

print(L5FilteredLowCloudImages);
var L5EVIimages = L5FilteredLowCloudImages.map(makeLandsat5EVI); 
print(L5EVIimages.size()); 
print(L5EVIimages);

Map.addLayer(L5EVIimages, {min: -1, max: 2, palette: ['red', 'white', 'green']}, 'L5EVIimages');

var L5EVImean = L5EVIimages.reduce(ee.Reducer.mean()); 
print(L5EVImean); 
Map.addLayer(L5EVImean, {min: -1, max: 2, palette: ['red', 'white', 'green']}, 'Mean EVI');

var L5EVImedian = L5EVIimages.reduce(ee.Reducer.median()); 
print(L5EVImedian); 
Map.addLayer(L5EVImedian, {min: -1, max: 2, palette: ['red', 'white', 'green']}, 'Median EVI');

var L5EVIminMax = L5EVIimages.reduce(ee.Reducer.minMax()); 
print(L5EVIminMax);
Map.addLayer(L5EVIminMax, {min: -1, max: 2}, 'minMax EVI');

//Change the EVI function so that it returns the original image with the EVI band appended, 
//by replacing the return statement with this: return (oneL5Image.addBands(landsat5EVI)) 
//What does the reducer return in that case?
// Image mosaic with all bands, EVI added as a band

//Change the code so that you are reducing not the EVI but all the bands in each image. 
//If the same reducer is executed on an ImageCollection containing multi-banded images, what is the result?
var L5median = L5FilteredLowCloudImages.reduce(ee.Reducer.median()); 
print(L5median); 
Map.addLayer(L5median, {min: -1, max: 2, palette: ['red', 'white', 'green']}, 'Median');
// Median value for all the bands from 2000 - 2010