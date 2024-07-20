// GEE textook F4.3 Notes and Code

// Demonstrate different approaches for image composite generation when using data quality flags
// Pixel selection for composite development can exclude unwanted pixels—
// such as those impacted by cloud, shadow, and smoke or haze—and can also 
// preferentially select pixels based upon proximity to a target date or a preferred sensor type.  

// Cloud cover is one of the most common limitations of optical sensors providing 
// continuous time series of data for surface mapping and monitoring. 

// Clouds and cloud shadows reduce the view of optical sensors and completely block or 
// obscure the spectral response from Earth’s surface.
// Working with pixels that are cloud-contaminated can significantly influence 
// the accuracy and information content of products derived from a variety of 
// remote sensing activities
// unscreened clouds might be mapped as false changes 

// more accurate cloud detection algorithms are based on the analysis of Landsat time series 
// The presence and extent of cloud contamination within a pixel is currently provided with 
// Landsat and Sentinel-2 imagery as ancillary data via quality flags at the pixel level. 
// The quality flags are ideally suited to reduce users’ manual supervision and 
// maximize the automatic processing approaches.

// Image representation over the study area should be seamless, 
// containing as few data gaps as possible. 
// Compositing approaches rely on the outputs of cloud detection algorithms and 
// quality flags to include or exclude pixels from the resulting composite products
// considering the pixels from all images acquired in a given period (e.g., season, year). 

// The information provided by the cloud masks and pixel flags guides the establishment of rules
// to rank the quality of the pixels based on the presence and distance to clouds, 
// cloud shadows, or atmospheric haze.
// Higher scores are assigned to pixels with more desirable conditions, based on the presence 
// of clouds but also other acquisition circumstances, such as acquisition date or sensor. 
// Those pixels with the highest score are included in the subsequent composite development. 
// Generating image composites at regular intervals (e.g., annually) allows for the analysis 
// of long temporal series over large areas, fulfilling a critical information need for 
// monitoring programs.

// The general workflow to generate a cloud-free composite involves:
// 1.	Defining your area of interest (AOI).
// 2.	Filtering (ee.Filter) the satellite ImageCollection to desired parameters.
// 3.	Applying a cloud mask.
// 4.	Reducing (ee.Reducer) the collection to generate a composite.

// Goal: Nationwide composite for Colombia
// Define AOI
var country = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017")
                .filterMetadata('country_na','equals','Colombia'); // Mozambique

// Center map
Map.centerObject(country,5);

// Creating a composite from the Landsat 8 collection
// Define time variables
var startDate = '2019-01-01';
var endDate = '2019-12-31';

// Define and filter Landsat 8 collection
var l8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
          .filterBounds(country)
          .filterDate(startDate,endDate);

// Build a surface reflectance composite, so we define a function to apply the scaling factors
// Apply scaling factors
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

var l8 = l8.map(applyScaleFactors);

// Create a composite. We will use the median function 
// Create composite
//var composite = l8.median().clip(country);

//Map.addLayer(composite,{bands:['SR_B4','SR_B3','SR_B2'],min:0,max:0.2},'L8 Composite');
//print('All Images #', l8.size());
// We can see a lot of clouds

// First filter images for cloud cover
// Filter by CLOUD_COVER
var l8FiltClouds = l8.filterBounds(country)
               .filterDate(startDate,endDate)
               .filterMetadata('CLOUD_COVER','less_than',50);

// Create Composite
//var compositeFiltClouds = l8FiltClouds.median().clip(country);

//Map.addLayer(compositeFiltClouds,{bands:['SR_B4','SR_B3','SR_B2'],min:0,max:0.2},
//'L8 Composite cloud filter');
//print('All Images < 50% clouds #', l8FiltClouds.size());
// Slightly better than the previous one but still very cloudy

// There is a trade-off between a stricter cloud cover threshold and data availability

// We can apply a cloud mask to improve the results. 
// The Landsat 8 Collection 2 contains a quality assessment (QA) band called QA_PIXEL 
// that provides useful information of certain conditions within the data, 
// and allows users to apply per-pixel filters.
// Of particular interest here are bits 3 and 4, which represent cloud and cloud shadow

// Create a function to apply a cloud mask to every image in the ImageCollection 
// by using the ImageCollection function map

// Define the cloud mask function
function maskSRClouds(image) {
  // Bits 3 and 4 are cloud shadow and cloud, respectively.
  var cloudsBitMask = (1 << 3); // Set 3 and 4 to 1?
  var cloudShadowBitMask = (1 << 4); // Left shift operator (for bits)
  // Get the pixel QA band.
  var qa = image.select('QA_PIXEL'); 
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

// Apply cloud mask to collection
var l8FiltMasked = l8FiltClouds.map(maskSRClouds); 
// Remember to set the cloud cover threshold back to 50

// Create Composite
var l8compositeMasked = l8FiltMasked.median().clip(country);

//Map.addLayer(l8compositeMasked,
//             {bands:['SR_B4','SR_B3','SR_B2'],min:0,max:0.2},
//             'L8 composite masked');
// Masked clouds and is a great improvement compared to previous composites. 
// However, data gaps are still an issue due to cloud cover. 

// Bringing in imagery from other sensors for the time period of interest
// Incorporating Landsat 7 Level 2, Collection 2, Tier 1 images from 2019 to fill the gaps 

// Define Landsat 7 Level 2, Collection 2, Tier 1 collection
var l7 = ee.ImageCollection("LANDSAT/LE07/C02/T1_L2");

// Scaling factors for L7
function applyScaleFactorsL7(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBand = image.select('ST_B6').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBand, null, true);
}

// Filter collection, apply cloud mask, and scaling factors
var l7FiltMasked = l7.filterBounds(country)
                .filterDate(startDate,endDate)
                .filterMetadata('CLOUD_COVER','less_than',50)
                .map(maskSRClouds)
                .map(applyScaleFactorsL7);

// Create composite
var l7compositeMasked = l7FiltMasked.median().clip(country);

//Map.addLayer(l7compositeMasked,{bands:['SR_B3','SR_B2','SR_B1'],min:0,max:0.2},'L7 composite masked');

// Landsat 7 and 8 have different band designations. 
// Hence, let's start by creating a function to rename the bands from Landsat 7 
// to match Landsat 8's and map that function to our L7 collection.

// Since Landsat 7 and 8 have different band designations,
// let's create a function to rename L7 bands to match up L8.
function rename(image){
  return image.select(
    ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'],
    ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7']);
}

// Apply the rename function
var l7FiltMaskedRenamed = l7FiltMasked.map(rename);

// Merge Landsat collections
// var l78 = l7FiltMaskedRenamed.merge(l8FiltMasked);
// print('Merged collections',l78);
// Two image collections can be merged only if they have the same number of bands

// Merge Landsat collections
var L8smaller = l8FiltMasked.select('SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7');
var l78 = l7FiltMaskedRenamed.merge(L8smaller);
print('Merged collections',l78);

// Create Landsat 7 and 8 image composite and add to Map
var l78composite = l78.median().clip(country); 
Map.addLayer(l78composite,{bands:['SR_B4','SR_B3','SR_B2'],min:0,max:0.2},'L7 and L8 composite');

//var l78 = l7FiltMaskedRenamed.merge(l8FiltMasked.select('SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'))
//                             .map(function(img){
//  return img.toFloat()});
//print('Merged collections',l78);

// Number of Landsat 7 and 8 Images in filtered ImageCollection
print('L7 #', l7FiltMaskedRenamed.size());
print('L8 #', l8FiltMasked.size());

// Some of the gaps have been filled

// Medoid: representative object of a dataset whose average dissimilarity to all the 
// objects in a cluster is minimal. 
// For a given image pixel, the medoid is the value for a given band that is numerically closest 
// to the median of all corresponding pixels among images considered (all images in the collection). 
// We use the medoid approach to find the best available pixels for compositing. 
// The process is robust, and fast. You can think of the medoid as a multidimensional median. 

// We first calculate the difference between the median and the observation per image per band; 
// then we get the medoid by selecting the image pixel with the smallest difference between the 
// median and the observation per band. We will create a medoid composite for the Landsat 7 and 8 
// merged collection of 2019.

// Medoid composite

// Calculate the difference between the median and the observation per image per band,
// then get the medoid by selecting the image pixel with the smallest difference 
// between median and observation per band.
var l78medoidComposite = l78.map(function(image) {
        var diff = ee.Image(image).subtract(l78composite).pow(ee
            .Image.constant(2)
            ); // get the difference between each image/band and 
                //  the corresponding band median and take to power
                //  of 2 to make negatives positive and make greater                   
                //  differences weight more
        return diff.reduce('sum').addBands(
        image); // per image in collection, sum the powered difference across the bands - set this as the first band add the SR bands to it - now a 7 band image collection
    }).reduce(ee.Reducer.min(7)).select([1, 2, 3, 4, 5, 6], ['SR_B2',
        'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'
    ]) // find the powered difference that is the least - what image object is the closest to the median of the collection - and then subset the SR bands and name them - leave behind the powered difference band;
    .clip(country);

Map.addLayer(l78medoidComposite, {
    bands: ['SR_B4', 'SR_B3', 'SR_B2'],
    min: 0,
    max: 0.2
}, 'L7 and L8 Medoid composite');

// Different cloud patterns globally
// The larger the country, the longer it will take to generate the composite.

// Image compositing algorithms provide robust and transparent tools to address issues 
// with clouds, cloud shadows, haze, and smoke in remotely sensed images derived from 
// optical satellite data, and expand data availability for remote sensing applications.
// The tools and approaches described here should provide you with some useful strategies 
// to aid in mitigating the presence of cloud cover in your data. 
// Tuning or optimization of compositing parameters is possible (and recommended) 
// to ensure best capture of the physical conditions of interest. 