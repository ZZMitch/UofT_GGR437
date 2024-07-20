// GEE Code and Notes from GEE textbook F2.0

// Spectral indices are based on the fact that different objects and land covers on the Earth’s surface 
// reflect different amounts of light from the sun at different wavelengths. 

// Vegetation generally reflects large amounts of near infrared light.

// Spectral indices use math to express how objects reflect light across multiple portions of the spectrum as a single number. 
// Indices combine multiple bands, often with simple operations of subtraction and division, 
// to create a single value across an image that is intended to help to distinguish particular land uses or land covers of interest. 

// Band arithmetic is the process of adding, subtracting, multiplying, or dividing two or more bands from an image. 

// The red and near-infrared bands provide a lot of information about vegetation due to vegetation’s high reflectance in these wavelengths. 
// If the red and near infrared bands could be combined, they would provide substantial information about vegetation.
// NDVI: robust single value that would convey the health of vegetation along a scale of −1 to 1.
// (NIR - Red) / (NIR + Red)
// The general form of this equation is called a “normalized difference”;
// the numerator is the “difference” and the denominator “normalizes” the value.

/////
// Band Arithmetic
/////

// Calculate NDVI using Sentinel 2

// Import and filter imagery by location and date.
var sfoPoint = ee.Geometry.Point(-122.3774, 37.6194);
var sfoImage = ee.ImageCollection("COPERNICUS/S2")
    .filterBounds(sfoPoint)
    .filterDate('2020-02-01', '2020-04-01')
    .first();

// Display the image as a false color composite.
Map.centerObject(sfoImage, 11);
Map.addLayer(sfoImage, {bands: ['B8', 'B4', 'B3'], min: 0, max: 2000}, 'False color');

// The simplest mathematical operations in Earth Engine are the .add, .subtract, .multiply, and .divide functions. 

// Extract the near infrared and red bands.
var nir = sfoImage.select('B8');
var red = sfoImage.select('B4');

// Calculate the numerator and the denominator using subtraction and addition respectively.
var numerator = nir.subtract(red);
var denominator = nir.add(red);

// Now calculate NDVI
var ndvi= numerator.divide(denominator);

// And add the layer to our map with a palette.
var vegPalette = ['red', 'white', 'green'];
Map.addLayer(ndvi, {min:-1, max:1, palette: vegPalette}, 'NDVI Manual');

// Normalized differences like NDVI are so common in remote sensing that Earth Engine provides 
// the ability to do the subtraction, addition, and division in a single step, using the normalizedDifference() method

// Now use the built in normalizedDifference function to achieve the same outcome.
var ndviND = sfoImage.normalizedDifference(['B8', 'B4']);
Map.addLayer(ndviND, {min:-1, max:1, palette: vegPalette}, 'NDVI normalizedDiff');

// Note that the order that you provide the two bands is important. 
// The normalizedDifference() method uses the first parameter value for the ‘NIR’ part of the NDVI equation, 
// and the second parameter value as the ‘Red’ component. 

// Normalized Difference Water Index (NDWI) was developed by Gao (1996) as an index of vegetation water content.

// Use normalizedDifference to calculate NDWI
var ndwi = sfoImage.normalizedDifference(['B8', 'B11']);
var waterPalette = ['white', 'blue'];
Map.addLayer(ndwi, {min: -0.5, max: 1, palette: waterPalette}, 'NDWI');

/////
// Thresholding, Masking, and Remapping Images
/////

// Create an NDVI image using Sentinel 2
var seaPoint = ee.Geometry.Point(-122.2040,47.6221);
var seaImage = ee.ImageCollection("COPERNICUS/S2")
    .filterBounds(seaPoint)
    .filterDate('2020-08-15', '2020-10-01')
    .first();

var seaNDVI = seaImage.normalizedDifference(['B8', 'B4']);

// And map it.
Map.centerObject(seaPoint, 10);
Map.addLayer(seaNDVI, 
             {min: -1, max: 1, palette: vegPalette},
             'NDVI Seattle');

// Implement a threshold
var seaVeg = seaNDVI.gt(0.5)

// Map the threshold
Map.addLayer(seaVeg,
             {min:0, max:1, palette: ['white', 'green']},
             "Non-forest vs. Forest");

// The .gt function is from the family of Boolean operators. 
// For every pixel in the image it tests whether the NDVI value is greater than 0.5. 

// Other operators in this Boolean family include less than (.lt), less than or equal to (.lte), 
// equal to (.eq), not equal to (.neq), and greater than or equal to (.gte) and more. 

// Earth Engine provides a tool, the .where clause, that conditionally evaluates to true or false within each pixel 
// depending on the outcome of a test. 

// Implement .where
// Create a starting image
var seaWhere = ee.Image(1) // create a new image with all values = 1
.clip(seaNDVI.geometry());   // use clip to constrain size of new image

// Make all NDVI values less than -0.1 equal 0
seaWhere = seaWhere.where(seaNDVI.lte(-0.1), 0);

// Make all NDVI values greater than 0.5 equal 2
seaWhere = seaWhere.where(seaNDVI.gte(0.5), 2);

// Map our layer that has been divided into three classes.
Map.addLayer(seaWhere, 
              {min:0, max:2, palette: ['blue', 'white', 'green']},
              "Water, Non-forest, Forest");

// Masking an image is a technique that removes specific areas of an image--those covered by the mask--from being displayed or analyzed.

// Implement masking
// View the seaVeg layer's current mask
Map.centerObject(seaPoint, 9);
Map.addLayer(seaVeg.mask(), {}, 'seaVeg Mask');

// Create a binary mask of non-forest.
var vegMask = seaVeg.eq(1);

// Update the seaVeg mask with the non-forest mask.
var maskedVeg = seaVeg.updateMask(vegMask);

// Map the updated Veg layer
Map.addLayer(maskedVeg, 
            {min:0, max:1, palette: ['green']},
            "Masked Forest Layer");

// Map the updated mask 
Map.addLayer(maskedVeg.mask(), {}, 'maskedVeg Mask');

// Remapping takes specific values in an image and assigns them a different value. This is particularly useful for categorical datasets
// Implement remapping
// Remap the values from the seaWhere layer from 0,1,2 to 9,11,10
var seaRemap = seaWhere.remap([0,1,2], // Existing values
                              [9,11,10]); // Remapped values
                              
Map.addLayer(seaRemap, 
              {min:9, max:11, palette: ['blue', 'green', 'white']},
              "Remapped Values");

// Classified rasters in Earth Engine have additional metadata attached that can help with analysis and visualization. 
// This includes lists of the names, values, and colors associated with class. 
// These are used if there are no other visualization parameters specified. 

// Advanced remapping using NLCD
// Import NLCD
var nlcd = ee.ImageCollection("USGS/NLCD_RELEASES/2016_REL")


// Use Filter to select the 2016 dataset.
var nlcd2016 = nlcd.filter(ee.Filter.eq('system:index', '2016'))
                  .first();

// Select the land cover band.
var landcover = nlcd2016.select('landcover');

// Map the NLCD land cover.
Map.addLayer(landcover, null, 'Landcover');

// Now suppose we want to change the color palette. 
var newPalette = ['466b9f','d1def8','dec5c5',
                  'ab0000','ab0000','ab0000',
                  'b3ac9f','68ab5f','1c5f2c',
                  'b5c58f','af963c','ccb879',
                  'dfdfc2','d1d182','a3cc51',
                  '82ba9e','dcd939','ab6c28',
                  'b8d9eb','6c9fb8'];

Map.addLayer(landcover, {palette:newPalette}, 'NLCD New Palette');

// Extract the class values and save them as a list.
var values = ee.List(landcover.get("landcover_class_values"));

// Determine the maximum index value
var maxIndex = values.size().subtract(1);

// Create a new index for the remap
var indexes = ee.List.sequence(0, maxIndex);

// Remap NLCD and display in the map.
var colorized = landcover.remap(values, indexes)
            .visualize({min:0, max: maxIndex, palette: newPalette});
Map.addLayer(colorized, {},
              'NLCD Remapped Colors');