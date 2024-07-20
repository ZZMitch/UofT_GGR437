// Lecture 4: Single Image ("traditional method")

// Browse  the Data Catalog/Earth Explorer for good single images

// Set visualization parameters
var vizParams8 = {bands: ['SR_B5', 'SR_B4', 'SR_B3'],
                  min: 7000, max: 27000};
                  
var vizParams57 = {bands: ['SR_B4', 'SR_B3', 'SR_B2'],
                  min: 7000, max: 27000};

// Add selected images to GEE
// OLI
var imOLI = ee.Image('LANDSAT/LC08/C02/T1_L2/LC08_012030_20180719');
print('Cloud-free OLI Image', imOLI);
//Map.addLayer(imOLI, {}, 'Cloud-free OLI Image');
Map.addLayer(imOLI, vizParams8, 'FCC OLI sum2018');

// ETM+
var imETM = ee.Image('LANDSAT/LE07/C02/T1_L2/LE07_012030_20030819');
print('Cloud-free ETM+ Image', imETM);
//Map.addLayer(imETM, {}, 'Cloud-free ETM+ Image');
Map.addLayer(imETM, vizParams57, 'FCC ETM+ 2003');

// TM
var imTM = ee.Image('LANDSAT/LT05/C02/T1_L2/LT05_012030_19880614');
print('Cloud-free TM Image', imTM);
//Map.addLayer(imTM, {}, 'Cloud-free TM Image');
Map.addLayer(imTM, vizParams57, 'FCC TM 1988');

// Explore Images in Code, in Console, in Map/Layer manager
// Inspector Tool / console outputs
// ETM+ SLC off
// High DN numbers (mention fix in Tutorial 3)
// Change through time
// Can do thing like calculate NDVI etc... covered in Tutorial! 