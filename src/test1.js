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
wkt = "POLYGON ((0.650833 48.341646, -9.718925 45.706179, -5.852235 39.909736, -0.22796 41.112469, 0.650833 48.341646))";


wkt = "LINESTRING (-1.004225 42.868919, -0.622499 43.132059, -0.294325 42.765162, -1.004225 42.868919)"
wkt = "LINESTRING (2 42, 4 50, 7 35)";
wkt = "LINESTRING (0 40, 8 45, 16 40)"

site = parseFromWK(wkt);

console.log("=====================================================================");
console.log("ORIGINAL SITE");
console.log(site.coordinates);
console.log("---------------------------------------------------------------------");

// Centroid of incoming site, used to center the projection at the site
centroid = turf.centroid(site);
console.log("=====================================================================");
console.log("CENTROID ORIGINAL SITE");
console.log(centroid.geometry.coordinates);
console.log("---------------------------------------------------------------------");
var latlon_proj = new proj4.Proj('EPSG:4326');
var target_proj = new proj4.Proj("+proj=aeqd +lat_0=" + centroid.geometry.coordinates[1] + " +lon_0=" + centroid.geometry.coordinates[0] + " +x_0=0 +y_0=0 +R=6371000 +units=m +no_defs +type=crs");

target_proj = new proj4.Proj(params);

console.log(target_proj);
projectedCoordinates = site.coordinates.map(([lon, lat]) =>
  proj4(latlon_proj, target_proj, [lon, lat])
);
console.log("=====================================================================");
console.log("PROJECTED COORDINATES");
console.log(projectedCoordinates);
console.log("---------------------------------------------------------------------");
points = getPoints(projectedCoordinates);
unc_circle = mbc.makeCircle(points);
circle = circleToPolygon(unc_circle.x, unc_circle.y, unc_circle.r, 12);
console.log("CENTROID PROJECTED COORDINATES");
centroid = turf.centroid(circle);
x = parseFloat(centroid.geometry.coordinates[0])
y = parseFloat(centroid.geometry.coordinates[1])
console.log([x, y]);
console.log("---------------------------------------------------------------------");
console.log("CENTROID LAT/LON");
centroid = proj4.transform(target_proj, latlon_proj, [x, y]);
console.log(centroid);
console.log("---------------------------------------------------------------------");
console.log("UNCERTAINTY");
console.log(unc_circle.r);
console.log("---------------------------------------------------------------------");
// console.log(centroid.geometry.coordinates);

// console.log(circle);

// console.log(projectedCoordinates);
// circle = mbc.makeCircle(projectedCoordinates);
// console.log(circle);

// Note: https://github.com/postgis/postgis/blob/713f387f84ae40b6ee96f5db6d7577ddcb93c692/postgis/postgis.sql.in#L5303-5415