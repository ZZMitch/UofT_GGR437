//  Code in GEE textbook F1.1

var first_image = ee.Image('LANDSAT/LT05/C02/T1_L2/LT05_118038_20000606');
print(first_image);

Map.addLayer( 
  first_image, // dataset to display 
  { 
    bands: ['SR_B1'], // band to display 
    min: 8000, // display range 
    max: 17000 
  }, 
  "Layer 1" // name to show in Layer Manager 
  );
  
Map.addLayer( 
  first_image, 
  { 
    bands: ['SR_B2'], 
    min: 8000, 
    max: 17000 
  }, 
  'Layer 2', 
  0, // shown
  1 // opacity 
  );
  
Map.addLayer( 
  first_image, 
  { 
    bands: ['SR_B3'], 
    min: 8000, 
    max: 17000 
  }, 
  'Layer 3', 
  1, // shown 
  0 // opacity 
  );
  
Map.addLayer( 
  first_image, 
  { 
    bands: ['SR_B3', 'SR_B2', 'SR_B1'], 
    min: 8000, 
    max: 17000 
  }, 
  "Natural Color");
  
Map.addLayer( 
  first_image, 
  { 
    bands: ['SR_B4', 'SR_B3', 'SR_B2'], 
    min: 8000, 
    max: 17000 }, 
    "False Color");
    
Map.addLayer( 
  first_image, 
  { 
    bands: ['SR_B5', 'SR_B4', 'SR_B2'], 
    min: 8000, 
    max: 17000
}, 
"Short wave false color");

var lights93 = ee.Image('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS/F101993'); 
print('Nighttime lights',lights93);

15
Map.addLayer( 
  lights93, 
  { 
    bands: ['stable_lights'], 
    min: 0, 
    max: 63 
  }, 
  "Lights");
  
  var lights03 = ee.Image('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS/F152003') 
      .select('stable_lights').rename('2003');
  var lights13 = ee.Image('NOAA/DMSP-OLS/NIGHTTIME_LIGHTS/F182013') 
      .select('stable_lights').rename('2013');
  var changeImage = lights13.addBands(lights03) 
      .addBands(lights93.select('stable_lights').rename('1993'));
  
  print("change image", changeImage);
  
  Map.addLayer( 
    changeImage, 
    { 
      min: 0, 
      max: 63 }, 
      "Change composite");