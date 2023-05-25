const { parseFromWK } = require("wkt-parser-helper");
const proj4 = require("proj4");
const turf = require('@turf/turf');
const mbc = require("./mbc.js");

const circleToPolygon = function(centerX, centerY, radius, sides) {
  const angle = (2 * Math.PI) / sides;
  const polygon = [];

  for (let i = 0; i < sides; i++) {
    const x = centerX + radius * Math.cos(i * angle);
    const y = centerY + radius * Math.sin(i * angle);
    polygon.push([ x, y ]);
  }
  const geoJsonPolygon = {
      type: 'Polygon',
      coordinates: [polygon]
    };
  return geoJsonPolygon;
}

const getPoints = function(coordinates){
  var points = [];
  for(i = 0; i < projectedCoordinates.length; i++){        
          coordinates = projectedCoordinates[i]; 
          // console.log(coordinates);           
          points.push(new mbc.Point(coordinates[0], coordinates[1]));            
      }        
  return points;
};

// =============================================================================== //
wkt = "LINESTRING (0 40, 8 45, 16 40)"
centroid = [8, 43]; //calculated in R
var source_proj = '+proj=longlat +datum=WGS84 +no_defs +type=crs';
var target_proj = "+proj=gnom +lat_0=90 +lon_0=0 +x_0=6300000 +y_0=6300000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
target_proj = "+proj=aeqd +lat_0=" + centroid[1] + " +lon_0=" + centroid[0] + " +x_0=0 +y_0=0 +R=6371000 +units=m +no_defs +type=crs";
console.log(target_proj);
target_proj = "+proj=aeqd +lat_0=42 +lon_0=8 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs"
//I'm not going to redefine those two in latter examples.
kk = proj4(source_proj, target_proj,[8, 42.64482]);
console.log(kk);



site = parseFromWK(wkt);

console.log("=====================================================================");
console.log("ORIGINAL SITE");
console.log(site.coordinates);
console.log("---------------------------------------------------------------------");
console.log("ORIGINAL CENTROID");
console.log([centroid[0], centroid[1]]);
console.log("---------------------------------------------------------------------");
console.log("PROJECTED CENTROID");
var latlon_proj = new proj4.Proj('EPSG:4326');
var target_proj = new proj4.Proj('EPSG:3857');
lng = parseFloat(centroid[0]);
lat = parseFloat(centroid[1]);
centroid_tr = proj4.transform(latlon_proj, target_proj, [lng, lat])
console.log([centroid_tr.x, centroid_tr.y]);
console.log("---------------------------------------------------------------------");



console.log("TARGET PROJECTION");
console.log(crs);
console.log("---------------------------------------------------------------------");

projectedCoordinates = site.coordinates.map(([lon, lat]) =>
  proj4(latlon_proj, target_proj, [lon, lat])
);

console.log("PROJECTED COORDINATES");
console.log(projectedCoordinates);
console.log("---------------------------------------------------------------------");
console.log("=====================================================================");