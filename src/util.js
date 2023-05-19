const ui = require('./ui');
require('leaflet-spin');
const turf = require('@turf/turf');
const mbc = require("./mbc.js");
const proj4 = require("proj4").default;

const api_base_url = process.env.API_URL;
const api_username = process.env.USER;
const api_pwd = process.env.PASSWORD;

const spin_opts = {
    lines: 13, 
    length: 38, 
    width: 17, 
    radius: 54, 
    color: '#ffffff'
}

const parse_api_data = function(data){    
    const all_data = JSON.parse(data[0]);
    const mbc = JSON.parse(all_data.mbc[0]);
    const site = JSON.parse(all_data.site[0]);
    const center = JSON.parse(all_data.centre[0]);
    var spatial_fit;
    if( all_data.spatial_fit[0] == 'Inf' ){
        spatial_fit = 'N/A';
    }else{
        spatial_fit = JSON.parse(all_data.spatial_fit[0]);        
    }     
    return {
        center: { type: 'Feature', 'geometry': center },
        mbc: { type: 'Feature', 'geometry': mbc },
        site: site,
        spatial_fit: spatial_fit,
        uncertainty: all_data.uncertainty[0]
    };
}

const promote_reference_to_editable = function(editableLayers, reference_layer, buffer_layer, centroid_layer, map){
    var geom = reference_layer.toGeoJSON().features;
    if(geom.length > 1){
        var geom_type = '';
        var coords = [];
        for(var i = 0; i < geom.length; i++){
            geom_type = geom[i].geometry.type;
            coords.push(geom[i].geometry.coordinates);
        }
        if( geom_type == 'Polygon'){
            geom = turf.multiPolygon(coords);
        }        
    }

    const fetchdata = {
        method: 'POST',
        body: JSON.stringify(geom),
        headers: new Headers({
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Basic ' + btoa(api_username + ":" + api_pwd)
        })        
    }

    map.spin(true, spin_opts);    
    fetch( api_base_url + 'mbc',fetchdata)
    .then(function(response){
        return response.json();
    })
    .then(function(data){     
        editableLayers.clearLayers();
        buffer_layer.clearLayers();
        centroid_layer.clearLayers();
        reference_layer.clearLayers();

        const parsed_json = parse_api_data(data);        
        map.spin(false);
        buffer_layer.addData( parsed_json.mbc );
        centroid_layer.addData( parsed_json.center );
        map.fitBounds(buffer_layer.getBounds());
        ui.show_api_centroid_data( parsed_json, geom );        
        var layer = L.geoJSON(parsed_json.site);        
        layer.eachLayer(
        function(l){
            editableLayers.addLayer(l);
        });
        editableLayers.bringToFront();        
    })
    .catch(function(error){
        ui.toast_error(error);
        map.spin(false);
    });        
}

const load_api_data2 = function(editableLayers, buffer_layer, centroid_layer, map){
    // var geom = editableLayers.toGeoJSON().features;
    
    // // Get all points of geometries to pass to makeCircle for the mbc
    // var epsg_4326 = new proj4.Proj('EPSG:4326');
    // var epsg_3857 = new proj4.Proj('EPSG:3857');
    
    // var points = geometryToPoints(geom);
    // unc_circle = mbc.makeCircle(points);
    // findFurthestPoint()
    
    
    // points = reprojectPoints(points, 4326, 3857);
    // radius = unc_circle.r;
    // // Is centroid inside polygon(s)?
    // centroid_4326 = proj4.transform(epsg_3857, epsg_4326, [unc_circle.x, unc_circle.y]);
    // is_inside = false;
    // for(i = 0; i < geom.length; i++){
    //     if(turf.booleanPointInPolygon(turf.point([centroid_4326.x, centroid_4326.y]), geom[i].geometry)){
    //     is_inside = true;
    //     }
    // }
    
    // // If centroid is not inside any of the polygons move it to closest line point
    // if(is_inside == false){
    //     // console.log(geom);
    //     // mp = turf.multiPolygon(geom);
    //     // console.log("1");
    //     centroid_json = findNearestPointInPerimeter(geom, centroid_4326);
    //     radius = findFurthestPoint(centroid_json, geom);
    //     console.log(centroid_json);
    //     unc_circle = proj4.transform(epsg_4326, epsg_3857, centroid_json.coordinates);
    //     unc_circle = proj4.transform(epsg_3857, epsg_4326, [unc_circle.x, unc_circle.y]);
    //     // console.log(unc_circle);                
    //     unc_circle = new mbc.Circle(unc_circle.x, unc_circle.y, radius);                
    //     console.log("radius:" + radius);
    // } else {
    //     // console.log("2");
    //     centroid = proj4.transform(epsg_3857, epsg_4326, [unc_circle.x, unc_circle.y])
    //     centroid_json = {
    //         type: 'Point',
    //         coordinates: [centroid.x, centroid.y]
    //     };    
    //     unc_circle = new mbc.Circle(centroid.x, centroid.y, radius);                
    // }
    // console.log(unc_circle);
    // pol_json = circleToPolygon(unc_circle.x, unc_circle.y, unc_circle.r, 36);
    // // console.log(centroid_json);
    // // console.log(pol_json);
    // // buffer_layer.addData( pol_json );
    // centroid_layer.addData( centroid_json );
    // centroid_json_original = {
    //     type: 'Point',
    //     coordinates: [centroid_4326.x, centroid_4326.y]
    // };    
    // centroid_layer.addData( centroid_json_original );
    // // centroid_layer.addData( point );

    // console.log(unc_circle);
    // addPointCircleToMap(unc_circle.y, unc_circle.x, unc_circle.r);
    addPointCircleToMap(63.555625, 6.792595, 1012000.282);
    // addPointCircleToMap(40.414, -3.71, 505940);
    // map.fitBounds(buffer_layer.getBounds());
}

const load_api_data = function(editableLayers, buffer_layer, centroid_layer, map){
    var geom = editableLayers.toGeoJSON().features;
    
    // Get all points of geometries to pass to makeCircle for the mbc
    var epsg_4326 = new proj4.Proj('EPSG:4326');
    var epsg_3857 = new proj4.Proj('EPSG:3857');
    
    var points = geometryToPoints(geom);
    
    
    points = reprojectPoints(points, 4326, 3857);
    unc_circle = mbc.makeCircle(points);
    radius = unc_circle.r;
    // Is centroid inside polygon(s)?
    centroid_4326 = proj4.transform(epsg_3857, epsg_4326, [unc_circle.x, unc_circle.y]);
    is_inside = false;
    for(i = 0; i < geom.length; i++){
        if(turf.booleanPointInPolygon(turf.point([centroid_4326.x, centroid_4326.y]), geom[i].geometry)){
        is_inside = true;
        }
    }
    
    // If centroid is not inside any of the polygons move it to closest line point
    if(is_inside == false){
        // console.log(geom);
        // mp = turf.multiPolygon(geom);
        // console.log("1");
        centroid_json = findNearestPointInPerimeter(geom, centroid_4326);
        radius = findFurthestPoint(centroid_json, geom);
        console.log(centroid_json);
        unc_circle = proj4.transform(epsg_4326, epsg_3857, centroid_json.coordinates);
        unc_circle = proj4.transform(epsg_3857, epsg_4326, [unc_circle.x, unc_circle.y]);
        // console.log(unc_circle);                
        unc_circle = new mbc.Circle(unc_circle.x, unc_circle.y, radius);                
        console.log("radius:" + radius);
    } else {
        // console.log("2");
        centroid = proj4.transform(epsg_3857, epsg_4326, [unc_circle.x, unc_circle.y])
        centroid_json = {
            type: 'Point',
            coordinates: [centroid.x, centroid.y]
        };    
        unc_circle = new mbc.Circle(centroid.x, centroid.y, radius);                
    }
    console.log(unc_circle);
    pol_json = circleToPolygon(unc_circle.x, unc_circle.y, unc_circle.r, 36);
    // console.log(centroid_json);
    // console.log(pol_json);
    // buffer_layer.addData( pol_json );
    centroid_layer.addData( centroid_json );
    centroid_json_original = {
        type: 'Point',
        coordinates: [centroid_4326.x, centroid_4326.y]
    };    
    centroid_layer.addData( centroid_json_original );
    // centroid_layer.addData( point );

    console.log(unc_circle);
    addPointCircleToMap(unc_circle.y, unc_circle.x, unc_circle.r);
    // addPointCircleToMap(40.414, -3.71, 505940);
    // map.fitBounds(buffer_layer.getBounds());
}

const geometryToPoints = function(geom){
    var points = [];
    for(i = 0; i < geom.length; i++){        
        features = turf.explode(geom[i].geometry).features;
        for(j = 0; j < features.length; j++){
            coordinates = features[j].geometry.coordinates; 
            // console.log(coordinates);           
            points.push(new mbc.Point(coordinates[0], coordinates[1]));            
        }        
    }     
    return points;
}

const reprojectPoints = function(points, epsg_source, epsg_target){
    var epsg_source = new proj4.Proj('EPSG:' + epsg_source);
    var epsg_target = new proj4.Proj('EPSG:' + epsg_target);
    var points_out = [];
    for(i = 0; i < points.length; i++){
        p = proj4.transform(epsg_source, epsg_target, [points[i].x, points[i].y]);
        points_out.push(new mbc.Point(p.x, p.y));            
        
    }
    return points_out;
  }
  
const findFurthestPoint = function(centroid_json, geom){
    max_dist = 0;
    for(i = 0; i < geom.length; i++){        
        features = turf.explode(geom[i].geometry).features;
        for(j = 0; j < features.length; j++){
            coordinates = features[j].geometry.coordinates;                        
            dist = turf.distance(centroid_json, coordinates, {units: 'kilometers'});
            // console.log(dist);
            if(dist > max_dist)
                max_dist = dist;        
        }        
    }   
    return max_dist * 1000;
}
const findNearestPointInPerimeter = function(geom, centroid){
    min_dist = 99999;    
    for(i=0; i < geom.length; i++){
        lines = turf.polygonToLine(geom[i].geometry);
        centroid_point = turf.nearestPointOnLine(lines, [centroid.x, centroid.y], {units: 'kilometers'});
        // console.log(centroid_point);    
        dist = centroid_point.properties.dist;
        if(dist < min_dist){
            min_dist = dist;
            nearest_point = centroid_point;
        }
    }    
    
    // console.log(nearest_point);    
    return nearest_point.geometry;
}
const findNearestPointInPerimeter2 = function(polygon){
    lines = turf.polygonToLine(polygon);
    centroid_point = turf.nearestPointOnLine(lines, [centroid_4326.x, centroid_4326.y], {units: 'miles'});    
    
    console.log(centroid_json.toGeoJSON());
    console.log(centroid_point);    
}

const circleToPolygon = function(centerX, centerY, radius, sides) {
    var proj_4326 = new proj4.Proj('EPSG:4326');
    var proj_3857 = new proj4.Proj('EPSG:3857');

    const angle = (2 * Math.PI) / sides;
    const polygon4326 = [];
  
    for (let i = 0; i < sides; i++) {
      const x = centerX + radius * Math.cos(i * angle);
      const y = centerY + radius * Math.sin(i * angle);
      coord_4326 = proj4.transform(proj_3857, proj_4326, [x, y]);            
      x2 = coord_4326.x;
      y2 = coord_4326.y;
      polygon4326.push([ x2, y2 ]);
    }
    const geoJsonPolygon = {
        type: 'Polygon',
        coordinates: [polygon4326]
      };
    console.log("kk");
    console.log(proj4.transform(proj_3857, proj_4326, [centerX, centerY]));
    console.log(geoJsonPolygon);
    return geoJsonPolygon;
  }
  
  
  module.exports = {
    parse_api_data,
    load_api_data,
    load_api_data2,
    promote_reference_to_editable
}

