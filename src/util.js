const turf = require('@turf/turf');
const ui = require('./ui');
const mec = require('./minimum_enclosing_circle');

var max_distance_point_to_geometry = function(centroid, turf_geometry){
    var geometry_coordinates = turf.coordAll(turf_geometry);
    var from = turf.point(centroid.geometry.coordinates);
    var options = {units: 'kilometers'};
    var distances = [];
    for(var i = 0; i < geometry_coordinates.length; i++){
        var to = turf.point(geometry_coordinates[i]);
        var distance = turf.distance(from, to, options);
        distances.push(distance);    
    }
    distances.sort(function(a, b){return b - a});    
    return distances[0];
}

/* Might return a polygon, multipolygon, line or multiline */
var get_geometry_from_layer = function(containing_geometry){
    var geometry_type = containing_geometry.features[0].geometry.type;    
    var turf_geometry = null;
    if(containing_geometry.features.length > 1){        
        
        var coord_list = [];
        for(var i=0; i < containing_geometry.features.length; i++){
            var feature = containing_geometry.features[i];
            coord_list.push( feature.geometry.coordinates );
        }

        if(geometry_type == 'LineString'){            
            turf_geometry = turf.multiLineString(coord_list);
        }else if(geometry_type == 'Polygon'){            
            turf_geometry = turf.multiPolygon(coord_list);
        }else{
            console.log("Unexpected geometry type");
        }

    }else{        
        if(geometry_type == 'LineString'){
            turf_geometry = turf.lineString(containing_geometry.features[0].geometry.coordinates);
        }else if(geometry_type == 'Polygon'){
            turf_geometry = turf.polygon(containing_geometry.features[0].geometry.coordinates);
        }else{
            console.log("Unexpected geometry type");
        }
    }
    return turf_geometry;
}

var get_centroid = function(containing_geometry, type){
    var geometry_type = containing_geometry.features[0].geometry.type;
    if(type == 0){                
        return turf.centroid(containing_geometry);
    }else{
        var coords = turf.coordAll(containing_geometry);
        var points = [];
        if(geometry_type == 'Polygon'){
            for(var i = 0; i < coords.length - 1; i++){
                // Transform to a ref system which uses meters ** THIS IS IMPORTANT **
                var turf_mercator = turf.toMercator(turf.point([ coords[i][0], coords[i][1] ]));
                var p = new mec.Point( turf_mercator.geometry.coordinates[0], turf_mercator.geometry.coordinates[1] );
                points.push( p );
            }
        }else if(geometry_type == 'LineString'){
            for(var i = 0; i < coords.length; i++){
                // Transform to a ref system which uses meters ** THIS IS IMPORTANT **
                var turf_mercator = turf.toMercator(turf.point([ coords[i][0], coords[i][1] ]));
                var p = new mec.Point( turf_mercator.geometry.coordinates[0], turf_mercator.geometry.coordinates[1] );
                points.push( p );
            }
        }else{
            console.log("Unexpected geometry type");
        }
        //console.log(points);
        var c = mec.makeCircle(points);
        //It's mercator, transform back to WGS84
        return turf.toWgs84(turf.point( [ c.x, c.y ] ));
    }
}

var compute_centroid_data = function(containing_geometry, buffer_layer, centroid_layer){
    
    var display_data = {};

    var centroid = get_centroid(containing_geometry, 1);

    display_data.centroid_x = centroid.geometry.coordinates[0];
    display_data.centroid_y = centroid.geometry.coordinates[1];
    display_data.s_centroid_x = 'N/A';
    display_data.s_centroid_y = 'N/A';
    
    var inside = false;
    
    var turf_geometry = get_geometry_from_layer(containing_geometry);    
    if ( turf_geometry.geometry.type == 'Polygon'){
        inside = turf.booleanPointInPolygon(centroid, turf_geometry);
        if( !inside ){
            var snapped = turf.nearestPointOnLine(turf.polygonToLineString(turf_geometry), centroid, {units: 'kilometers'});
            centroid = snapped;
        }                
    }else if( turf_geometry.geometry.type == 'MultiPolygon' ){
        inside = turf.booleanPointInPolygon(centroid, turf_geometry);
        if( !inside ){
            var min_distance_to_line_hull = -1;
            for(var i = 0; i < turf_geometry.geometry.coordinates.length; i++){
                var polygon = turf.polygon(turf_geometry.geometry.coordinates[i]);
                var linestring = turf.polygonToLineString(polygon);
                var snapped_point = turf.nearestPointOnLine(linestring, centroid, {units: 'kilometers'});
                var distance_to_line_hull = turf.distance( snapped_point, centroid, {units: 'kilometers'} );
                if( min_distance_to_line_hull == -1 ||  distance_to_line_hull < min_distance_to_line_hull ){
                    min_distance_to_line_hull = distance_to_line_hull;
                    centroid = snapped_point;
                }                
            }
        }                    
    }else if( turf_geometry.geometry.type == 'LineString' ){
        inside = turf.booleanPointOnLine(centroid, turf_geometry);
        if( !inside ){
            var snapped = turf.nearestPointOnLine(turf_geometry, centroid, {units: 'kilometers'});
            centroid = snapped;            
        }
    }else if( turf_geometry.geometry.type == 'MultiLineString' ){
        // check inside for individual lines
        for(var i = 0; i < turf_geometry.geometry.coordinates.length; i++){
            var line = turf.lineString(turf_geometry.geometry.coordinates[i]);
            inside = turf.booleanPointOnLine(centroid, line);
        }
        if( !inside ){
            var min_distance_to_line_hull = -1;
            for(var i = 0; i < turf_geometry.geometry.coordinates.length; i++){
                var line = turf.lineString(turf_geometry.geometry.coordinates[i]);                
                var snapped_point = turf.nearestPointOnLine(line, centroid, {units: 'kilometers'});
                var distance_to_line_hull = turf.distance( snapped_point, centroid, {units: 'kilometers'} );
                if( min_distance_to_line_hull == -1 ||  distance_to_line_hull < min_distance_to_line_hull ){
                    min_distance_to_line_hull = distance_to_line_hull;
                    centroid = snapped_point;
                }                
            }
        }
    }else{
        console.log("Unsupported geometry type");
    } 
    
    if(!inside){
        display_data.s_centroid_x = centroid.geometry.coordinates[0];
        display_data.s_centroid_y = centroid.geometry.coordinates[1];    
    }

    var distance_km = max_distance_point_to_geometry( centroid, turf_geometry );        
    var buffered = turf.buffer(centroid, distance_km, {units: 'kilometers'});
    var area_buffer = turf.area(buffered);
    var area_geometry = turf.area(turf_geometry);
    var pointRadiusSpatialFit = 'undefined';
    if(turf_geometry.geometry.type == 'Polygon' || turf_geometry.geometry.type == 'MultiPolygon'){
        pointRadiusSpatialFit = area_buffer / area_geometry;
    }
    
    display_data.inside = inside;
    display_data.geometry_type = turf_geometry.geometry.type;
    display_data.radius = distance_km;
    display_data.radius_m = distance_km * 1000;
    display_data.d_geojson = JSON.stringify(turf_geometry);
    display_data.pointRadiusSpatialFit = pointRadiusSpatialFit;

    ui.show_centroid_data(display_data);
    var buffered = turf.buffer(centroid, distance_km, {units: 'kilometers'});
    buffer_layer.addData(buffered);
    centroid_layer.addData(centroid);
}

module.exports = {
    compute_centroid_data: compute_centroid_data
}
