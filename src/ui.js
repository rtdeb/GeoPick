const  $ = require('jquery');
import * as Toastr from 'toastr';

Toastr.options = {
    "positionClass": "toast-top-center",
    "timeOut": "1500",
}

var controls = [
    'centroid_x',
    'centroid_y',
    /*'s_centroid_x',
    's_centroid_y',*/
    'radius',
    //'geometry_type',
    //'inside',
    //'radius',
    'radius_m',
    'd_geojson'
];

var show_centroid_data = function( data ){    
    controls.forEach(function (e) {
        if( e == 'centroid_x' || e == 'centroid_y' || e == 'radius_m' ){
            $('#' + e).val(data[e].toFixed(6));
        }else{
            $('#' + e).val(data[e]);
        }
    });
}

var clear_centroid_data = function(){
    controls.forEach(function (e) {
        $('#' + e).val("");
    });
}

$("#cpdata").on("click", function(){
    //console.log("click!");
    //Toastr.success('This works!');

    let centroid_x = $('#centroid_x').val();
    let centroid_y = $('#centroid_y').val();
    /*let corrected_centroid_x = $('#s_centroid_x').val();
    let corrected_centroid_y = $('#s_centroid_y').val();*/
    //let radius_km = $('#radius').val();
    let radius_m = $('#radius_m').val();
    //let geometry_class = $('#geometry_type').val();
    //let centroid_in_geometry = $('#inside').val();
    let geojson = $('#d_geojson').val();

    var string_template = 
`centroid_x: ${centroid_x},  centroid_y: ${centroid_y}
uncertainty_m: ${radius_m}
geojson: ${geojson}`;
/*`centroid_x: ${centroid_x},  centroid_y: ${centroid_y}
corrected_centroid_x: ${corrected_centroid_x}, corrected_centroid_y: ${corrected_centroid_y}
radius_km: ${radius_km}, radius_m: ${radius_m}
geometry_class: ${geometry_class}, centroid_in_geometry: ${centroid_in_geometry}
geojson: ${geojson}`;*/

    navigator.clipboard.writeText(string_template);    
    Toastr.success('Data copied to clipboard!');
});

clear_centroid_data();

export { show_centroid_data, clear_centroid_data };