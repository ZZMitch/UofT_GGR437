// required parameters
var targetDay = "07-20";
var daysRange = 40;
var cloudsTh = 70;
var SLCoffPenalty = 0.7;
var opacityScoreMin = 0.2;
var opacityScoreMax = 0.3;
var cloudDistMax = 1500;
var despikeTh = 0.85;
var despikeNbands = 3;
var startYear = 1984;
var endYear = 2021;

// load the bap library
var library = require("users/sfrancini/bap:library"); 

// calculate BAP
var BAPCS = library.BAP(null, targetDay, daysRange, cloudsTh, 
SLCoffPenalty, opacityScoreMin, opacityScoreMax, cloudDistMax);

// de-spike the collection
BAPCS = library.despikeCollection(despikeTh, despikeNbands, BAPCS, 1984, 2021, true);

// infill datagaps 
BAPCS = library.infill(BAPCS, 1984, 2021, false, true);

// visualize the image
Map.centerObject(area, 5);
library.ShowCollection(BAPCS,startYear,endYear, area , false, null);
library.AddSLider(startYear, endYear); 