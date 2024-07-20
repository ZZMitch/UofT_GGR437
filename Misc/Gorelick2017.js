// Example code in Gorelick et al., 2017
// Edited because out of date

var collection = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
//print(collection) // More than 5000 images
var winter = collection.filter(ee.Filter.calendarRange(11, 1, "month"))
//print(winter) // More than 5000 images
var summer = collection.filter(ee.Filter.calendarRange(6, 8, "month"))
var diff = summer.median().subtract(winter.median())
print(diff)
Map.addLayer(diff)