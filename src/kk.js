
const proj4 = require("proj4");
const turf = require('@turf/turf');
const mbc = require("./mbc.js");


p1 = [50.06149225172495, 45.58328999999999]
p2 = [26.311591, 45.58328999999999]
d = turf.distance(p1, p2, {units: 'kilometers'})
console.log(d);
