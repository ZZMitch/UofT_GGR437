var palettes = require('users/gena/packages:palettes') 
var ccdResults = ee.Image("projects/GLANCE/RESULTS/CHANGEDETECTION/SA/Rondonia_example_small")
print(ccdResults)

// Select time of break and change probability array images
var change = ccdResults.select('tBreak')
var changeProb =  ccdResults.select('changeProb')

// Set the time range we want to use and get as mask of 
// places that meet the condition
var start = 2000
var end = 2021
var mask = change.gt(start).and(change.lte(end)).and(changeProb.eq(1))

Map.addLayer(changeProb, {}, "change prob")

// Obtain number of breaks for the time range
var numBreaks = mask.arrayReduce(ee.Reducer.sum(), [0])

Map.addLayer(numBreaks, {min:0, max:5}, "Number of breaks")

// Obtain first change in that time period
var dates = change.arrayMask(mask).arrayPad([1])
var firstChange = dates.arraySlice(0, 0, 1)
                    .arrayFlatten([['firstChange']])
                    .selfMask()
Map.addLayer(firstChange, {palette: palettes.colorbrewer.YlOrRd[9], min:start, max:end}, "First change")

// Obtain last change in that time period
var lastChange = dates.arraySlice(0, -1)
                    .arrayFlatten([['lastChange']])
                    .selfMask()
                    
Map.addLayer(lastChange, {palette: palettes.colorbrewer.YlOrRd[9], min:start, max:end}, "Last change")

// Get masked magnitudes
var magnitudes = ccdResults.select('SWIR1_magnitude')
                           .arrayMask(mask)
                           .arrayPad([1])

// Get index of max abs magnitude of change
var maxIndex = magnitudes.abs()
                         .arrayArgmax()
                         .arrayFlatten([['index']])

// Select max magnitude and its timing
var selectedMag = magnitudes.arrayGet(maxIndex)
var selectedTbreak = dates.arrayGet(maxIndex).selfMask()

Map.addLayer(selectedMag, {palette: palettes.matplotlib.viridis[7], min:-0.15, max: 0.15}, "Max mag")
Map.addLayer(selectedTbreak, {palette: palettes.colorbrewer.YlOrRd[9], min:start, max: end}, "Time of max mag")