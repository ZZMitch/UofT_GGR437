// GEE textbook F4.2 synthesis

var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/PENTAD");
print(chirps);

// Create a list of years
var years = ee.List.sequence(1981, 2021);

// Write a function that takes a year number
// and returns a yearly image
var createYearlyImage = function(beginningYear) {
  var startDate = ee.Date.fromYMD(beginningYear, 1, 1);
  var endDate = startDate.advance(1,  'year');
  var yearFiltered = chirps.filter(ee.Filter.date(startDate, endDate));

  var total = yearFiltered.reduce(ee.Reducer.sum());
  return total.set({
    'system:time_start': startDate.millis(),
    'system:time_end': endDate.millis(),
    'year': beginningYear,
    'month': 1
  });
};

//var yearlyImages = ee.FeatureCollection(years.map(createYearlyImage));

var yearlyImages = years.map(createYearlyImage);
var yearlyCollection = ee.ImageCollection.fromImages(yearlyImages);
print(yearlyCollection);
Map.addLayer(yearlyCollection);

// Point
var point = ee.Geometry.Point(-70.3388, 43.5656); // Scarborough, Maine

var chart = ui.Chart.image.series({
  imageCollection: yearlyCollection,
  region: point,
  reducer: ee.Reducer.mean(),
  scale: 5566
}).setOptions({
      lineWidth: 1,
      pointSize: 3,
      title: 'Yearly Rainfall in Scarborough, Maine',
      vAxis: {title: 'Rainfall (mm)'},
      hAxis: {title: 'Year', gridlines: {count: 5}}
});
print(chart);