// Code in GEE textbook F1.0

// print('Hello World');

// var city = 'San Francisco';
// print(city);

// var population = 873965; 
// print(population);

// var cities = ['San Francisco', 'Los Angeles', 'New York', 'Atlanta']; 
// print(cities);

// var cityData = { 
//   'city': 'San Francisco', 
//   'population': 873965, 
//   'coordinates': [-122.4194, 37.7749] 
// }; 
// print(cityData);

// var greet = function(name) { 
//   return 'Hello ' + name; 
// }; 
// print(greet('World')); 
// print(greet('Readers'));
// print(greet('GGR437'));

// This is a comment (Ctrl + /)

var a = 1; 
var b = 2;

var result = ee.Number(a).add(b);
print(result);

var yearList = ee.List.sequence(1980, 2020, 5) ;
print(yearList);

// Create a new string variable called result
// Combine these two strings (Sentinel2A) and print it in the Console
var mission = ee.String('Sentinel') 
var satellite = ee.String('2A')

var result = ee.String(mission).cat(satellite)
print(result);