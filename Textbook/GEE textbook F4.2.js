// Code and notes for GEE Textbook F4.2

// Many remote sensing datasets consist of repeated observations over time. 
// Many applications require computing aggregations of data at a different 
// interval than at which it was produced. 

// Satellite images are typically captured at regular intervals, 
// which vary from platform to platform and sensor to sensor. 

// While individual scenes are informative, it is difficult to build a robust cloud-free time series 
// in most areas of the world due to the frequent or persistent presence of clouds. 
// Instead of working only with individual images in Earth Engine, 
// it can be highly valuable to create less noisy composites or numerical averages by 
// aggregating data to form monthly, seasonal or yearly composites built from individual scenes.  

// The primary computing time step for the CHIRPS dataset is the pentad. 
// A pentad represents the grouping of 5 days. 

//var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/PENTAD");
//var startDate = '2021-01-01';
//var endDate = '2022-01-01';
//var yearFiltered = chirps.filter(ee.Filter.date(startDate, endDate));

//print(yearFiltered);

// To aggregate the time-series, we need to learn how to create and manipulate 
// dates programmatically. 

//var startDate = ee.Date.fromYMD(2019, 1, 1);
//var endDate = startDate.advance(1, 'year'); 
//print(endDate);

var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/PENTAD");
var year = 2019;
var startDate = ee.Date.fromYMD(year, 1, 1);
var endDate = startDate.advance(1, 'year');
var yearFiltered = chirps
  .filter(ee.Filter.date(startDate, endDate));
print(yearFiltered);

// Another date function that is very commonly used across Earth Engine is millis(). 
// This function takes a date object and returns the number of milliseconds 
// since 1970-01-01T00:00:00Z. This is also known as the ‘Unix Timestamp’ 
// and is a standard way to convert dates to numbers and allows for easy comparison between dates. 
// Earth Engine objects store the timestamps for images and features in 
// special properties called system:time_start and system:time_end. 
// Both of these properties need to be supplied with a number instead of dates and the 
// millis() function can help you do that.

print('Date Object', startDate);
print('Date as Timestamp', startDate.millis());

// We can start aggregating the pentads into monthly sums. 
// This process has two fundamental steps. The first is to determine the beginning and ending 
// dates of one time interval, and the second is to sum up all of the pentads that 
// fall within that interval. 

// Create a list of months
var monthNumbers = ee.List.sequence(1, 12);

var createMonthlyImage = function(month) {
  var startDate = ee.Date.fromYMD(year, month, 1);
  var endDate = startDate.advance(1, 'month');
  var monthFiltered = yearFiltered
      .filter(ee.Filter.date(startDate, endDate));
      
 // Calculate total precipitation.
  var total = monthFiltered.reduce(ee.Reducer.sum());
  return total.set({
    'system:time_start': startDate.millis(),
    'system:time_end': endDate.millis(),
    'year': year,
    'month': month
  });
};

// The .map function passes over each image in the list 

// map() the function on the list of months
// This creates a list with images for each month in the list
var monthlyImages = monthNumbers.map(createMonthlyImage);

var monthlyCollection = ee.ImageCollection.fromImages(monthlyImages)
print(monthlyCollection);

// Create a point with coordinates for the city of Bengaluru, India
var point = ee.Geometry.Point(77.5946, 12.9716);

var chart = ui.Chart.image.series({
  imageCollection: monthlyCollection,
  region: point,
  reducer: ee.Reducer.mean(),
  scale: 5566
}).setOptions({
      lineWidth: 1,
      pointSize: 3,
      title: 'Monthly Rainfall at Bengaluru',
      vAxis: {title: 'Rainfall (mm)'},
      hAxis: {title: 'Month', gridlines: {count: 12}}
});
print(chart);