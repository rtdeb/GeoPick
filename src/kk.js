
const proj4 = require("proj4");
const turf = require('@turf/turf');
const mbc = require("./mbc.js");


p1 = [-3, 40]
p2 = [-3, 45]
d = turf.distance(p1, p2, {units: 'kilometers'})
console.log(d);


