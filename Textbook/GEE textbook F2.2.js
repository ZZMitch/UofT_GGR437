// GEE Textbook F2.2 Code

// Create an Earth Engine Point object over Milan.
var pt = ee.Geometry.Point(9.453,45.424);

// Filter the Landsat 8 collection and select the least cloudy image.
var landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
                     .filterDate('2019-01-01', '2020-01-01')
                     .filterBounds(pt)
                     .sort('CLOUD_COVER').first();

// Center the map in that image.
Map.centerObject(landsat,8);

// Add Landsat image to the map.
Map.addLayer(landsat, {bands: ['SR_B4', 'SR_B3', 'SR_B2'], min: 7000,max: 12000}, 'Landsat 8 image');


// Import the reference dataset.
var data = ee.FeatureCollection('projects/gee-book/assets/F2-2/milan_data');
print(data, "Reference dataset");
Map.addLayer(data, {}, "Reference data");

// Define the prediction bands.
var predictionBands = ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7', 'ST_B10', 
  'ndvi', 'ndwi'];

// Split the dataset into training and testing sets.
var trainingTesting = data.randomColumn();
var trainingSet = trainingTesting
    .filter(ee.Filter.lessThan('random', 0.8));
var testingSet = trainingTesting
    .filter(ee.Filter.greaterThanOrEquals('random', 0.8));

print(trainingSet, "Training set");
print(testingSet, "Testing set");
    
// Train the Random Forest Classifier with the trainingSet
var RFclassifier = ee.Classifier.smileRandomForest(50).train({
  features:trainingSet, 
  classProperty: 'class',
  inputProperties:predictionBands
});

// Now, to test the classification (verify model's accuracy), 
// we classify the testingSet and get a confusion matrix
var confusionMatrix = testingSet.classify(RFclassifier)
    .errorMatrix({
      actual: 'class', 
      predicted: 'classification'
    });
    
print('Confusion matrix:', confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());
print('Producers Accuracy:', confusionMatrix.producersAccuracy());
print('Users Accuracy:', confusionMatrix.consumersAccuracy());
print('Kappa:', confusionMatrix.kappa());

// Hyperparameter tuning.
var numTrees = ee.List.sequence(5, 100, 5);

var accuracies = numTrees.map(function(t) {
  var classifier = ee.Classifier.smileRandomForest(t)
    .train({
      features: trainingSet, 
      classProperty: 'class', 
      inputProperties: predictionBands
    });
  return testingSet
    .classify(classifier)
    .errorMatrix('class', 'classification')
    .accuracy();
});

print(ui.Chart.array.values({
  array: ee.Array(accuracies), 
  axis: 0, 
  xLabels: numTrees
}).setOptions({
  hAxis: {title: 'Number of trees'},
  vAxis: {title: 'Accuracy'},
  title: 'Accuracy per number of trees'
}));