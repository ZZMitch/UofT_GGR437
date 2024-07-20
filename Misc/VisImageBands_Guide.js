// From https://developers.google.com/earth-engine/tutorials/tutorial_api_02

// Instantiate an image with the Image constructor.
var image = ee.Image('CGIAR/SRTM90_V4');

// Zoom to a location.
//Map.setCenter(-112.8598, 36.2841, 9); // Center on the Grand Canyon.

// Display the image on the map.
Map.addLayer(image, {min: 0, max: 3000, palette: ['blue', 'green', 'red']}, 'custom visualization');

print('SRTM image', image);

var slope = ee.Terrain.slope(image);
print('SRTM slope', slope);
Map.setCenter(11.1, 46.1, 8);
Map.addLayer(slope, {min: 0, max: 45}, 'global slope');
