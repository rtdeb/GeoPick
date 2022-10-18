var $ = require('jquery')
import * as turf from '@turf/turf';

var clear_centroid_data = function(){
    $('#centroid_x').val("");
    $('#centroid_y').val("");
    $('#s_centroid_x').val("");
    $('#s_centroid_y').val("");
    $('#radius').val("");
    $('#g_class').val("");
    $('#inside').val("");
    $('#radius').val("");
    $('#radius_m').val("");
}

var max_distance_point_to_polygon = function(centroid, containing_geometry){
    var from = turf.point(centroid.geometry.coordinates);
    var options = {units: 'kilometers'};
    var distances = [];
    if ( containing_geometry.geometry.type == 'Polygon' ){
        for( var i = 0; i < containing_geometry.geometry.coordinates[0].length; i++ ){
            var to = turf.point(containing_geometry.geometry.coordinates[0][i]);
            var distance = turf.distance(from, to, options);
            distances.push(distance);
        }    
    }else if( containing_geometry.geometry.type == 'LineString' ){
        for( var i = 0; i < containing_geometry.geometry.coordinates.length; i++ ){
            var to = turf.point(containing_geometry.geometry.coordinates[i]);
            var distance = turf.distance(from, to, options);
            distances.push(distance);
        }    
    }
    distances.sort(function(a, b){return b - a});    
    return distances[0];
}

var display_centroid_data = function(containing_geometry, buffer_layer, centroid_layer){
    var centroid = turf.centroid(containing_geometry);
    $('#centroid_x').val(centroid.geometry.coordinates[0]);    
    $('#centroid_y').val(centroid.geometry.coordinates[1]);    
    var inside = false;
    if ( containing_geometry.geometry.type == 'Polygon' ){
        var polygon = turf.polygon([containing_geometry.geometry.coordinates[0]]);
        inside = turf.booleanPointInPolygon(centroid, polygon);   
        if( !inside ){            
            var snapped = turf.nearestPointOnLine(turf.polygonToLineString(polygon), centroid, {units: 'kilometers'});
            $('#s_centroid_x').val(snapped.geometry.coordinates[0]);
            $('#s_centroid_y').val(snapped.geometry.coordinates[1]);    
            centroid = snapped;
        }else{
            $('#s_centroid_x').val('N/A');
            $('#s_centroid_y').val('N/A');
        }
    }else if( containing_geometry.geometry.type == 'LineString' ){
        var line = turf.lineString(containing_geometry.geometry.coordinates);
        inside = turf.booleanPointOnLine(centroid, line);
        if( !inside ){
            var snapped = turf.nearestPointOnLine(line, centroid, {units: 'kilometers'});
            $('#s_centroid_x').val(snapped.geometry.coordinates[0]);
            $('#s_centroid_y').val(snapped.geometry.coordinates[1]);    
            centroid = snapped;
        }else{
            $('#s_centroid_x').val('N/A');
            $('#s_centroid_y').val('N/A');    
        }
    }    
    $('#inside').val(inside);
    $('#g_class').val(containing_geometry.geometry.type);
    var distance_km = max_distance_point_to_polygon( centroid, containing_geometry );
    $('#radius').val( distance_km );
    $('#radius_m').val( distance_km * 1000 );    
    var buffered = turf.buffer(centroid, distance_km, {units: 'kilometers'});
    
    buffer_layer.addData(buffered);
    centroid_layer.addData(centroid);
}

export { clear_centroid_data, display_centroid_data };