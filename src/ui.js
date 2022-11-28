const  $ = require('jquery');

const Toastr = require('toastr');
const { stringify } = require('wkt');
const p = require('../package.json');

var local_centroid_data = {};

Toastr.options = {
    "positionClass": "toast-top-center",
    "timeOut": "1500",
}

const headers = [
    'decimalLatitude',
    'decimalLongitude',
    'geodeticDatum',
    'coordinateUncertaintyInMeters',
    'coordinatePrecision',
    'pointRadiusSpatialFit',
    'footprintWKT',
    'footprintSRS',
    'footprintSpatialFit',
    'georeferencedBy',
    'georeferencedDate',
    'georeferenceProtocol',
    'georeferenceSources',
    'georeferenceRemarks'
];



//var string_template = `centroid_x: ${centroid_x},  centroid_y: ${centroid_y} uncertainty_m: ${radius_m} geojson: ${geojson}`;

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
            $('#' + e).val(data[e].toFixed(7));
        }else{
            $('#' + e).val(data[e]);
        }
    });
    local_centroid_data = data;
}

var clear_centroid_data = function(){
    controls.forEach(function (e) {
        $('#' + e).val("");
    });
    local_centroid_data = {};    
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

    const geojson_obj = JSON.parse(geojson);
    let wkt = stringify(geojson_obj)

    let date = new Date().toISOString();

    let pointRadiusSpatialFit = local_centroid_data.pointRadiusSpatialFit;
    let source_string = p.name + ' v.' + p.version;

    var string_template = `${centroid_x}\t${centroid_y}\tepsg:4326\t${radius_m}\t0.0000001\t${pointRadiusSpatialFit}\t${wkt}\tepsg:4326\t1\tanonymous_georeferencer\t${date}\tGeoreferencing Quick Reference Guide (Zermoglio et al. 2020, https://doi.org/10.35035/e09p-h128)\t${source_string}\t`;
    navigator.clipboard.writeText(headers.join('\t') + '\n' + string_template);
    Toastr.success('Data copied to clipboard!');
});

const hideLineDrawControl = function(){
    $(".leaflet-draw-draw-polyline").hide();
}

const hidePolyDrawControl = function(){
    $(".leaflet-draw-draw-polygon").hide();
}

const resetDrawControls = function(){
    $(".leaflet-draw-draw-polyline").show();
    $(".leaflet-draw-draw-polygon").show();
}

clear_centroid_data();

module.exports = {
    show_centroid_data: show_centroid_data, 
    clear_centroid_data: clear_centroid_data,
    hideLineDrawControl: hideLineDrawControl,
    hidePolyDrawControl: hidePolyDrawControl,
    resetDrawControls: resetDrawControls
}