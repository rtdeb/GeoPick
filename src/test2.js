const { parseFromWK } = require("wkt-parser-helper");
const proj4 = require("proj4");
const turf = require('@turf/turf');
const mbc = require("./mbc.js");

wkt = "LINESTRING (0 40, 8 45, 16 40)"
centroid = [8, 42.64482]; //calculated in R

site = parseFromWK(wkt);

console.log("=====================================================================");
console.log("ORIGINAL SITE");
console.log(site.coordinates);
console.log("---------------------------------------------------------------------");

var latlon_proj = new proj4.Proj('EPSG:4326');
var target_proj = new proj4.Proj("+proj=aeqd +lat_0=" + centroid[1] + " +lon_0=" + centroid[0] + " +x_0=0 +y_0=0 +R=6371000 +units=m +no_defs +type=crs");

projectedCoordinates = site.coordinates.map(([lon, lat]) =>
  proj4(latlon_proj, target_proj, [lon, lat])
);
console.log("=====================================================================");
console.log("PROJECTED COORDINATES");
console.log(projectedCoordinates);
console.log("---------------------------------------------------------------------");
