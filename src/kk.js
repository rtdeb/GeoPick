
const proj4 = require("proj4");
const turf = require('@turf/turf');




madrid = [-3.70, 40.42]
barcelona = [2.18, 41.39]
d = turf.distance(madrid, barcelona, {units: 'kilometers'})
// console.log(d);

bergen = [5.32, 60.40]
bodo = [14.42, 67.28]
d = turf.distance(bergen, bodo, {units: 'kilometers'})
// console.log(d);

p1 = [5, 60]
p2 = [5, 69]
d = turf.distance(p1, p2, {units: 'kilometers'})
// console.log(d);

edinburgh = [3.17, 55.98]
alta = [23.25, 70.00]
d = turf.distance(edinburgh, alta, {units: 'kilometers'})
console.log(d);


