var $ = require('jquery')

var controls = [
    'centroid_x',
    'centroid_y',
    's_centroid_x',
    's_centroid_y',
    'radius',
    'geometry_type',
    'inside',
    'radius',
    'radius_m'
];

var show_centroid_data = function( data ){    
    controls.forEach(function (e) {
        $('#' + e).val(data[e]);
    });
}

var clear_centroid_data = function(){
    controls.forEach(function (e) {
        $('#' + e).val("");
    });
}

export { show_centroid_data, clear_centroid_data };