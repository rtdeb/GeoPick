require('jquery-ui/ui/widgets/autocomplete');
const  $ = require('jquery');

const Toastr = require('toastr');
const { stringify } = require('wkt');
const p = require('../package.json');

var local_centroid_data = {};

Toastr.options = {
    "positionClass": "toast-top-center",
    "timeOut": "3000",
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

const controls = [
    'centroid_x',
    'centroid_y',
    /*'s_centroid_x',
    's_centroid_y',
    'radius',*/
    //'geometry_type',
    //'inside',
    //'radius',
    'radius_m',
    'd_geojson'
];

const empty_controls = function() {
    for (c in controls){
        if ( $('#' + controls[c]).val().trim() != '' ){
            return false;
        }
    }
    return true;
}

/*
const show_centroid_data = function( data ){    
    controls.forEach(function (e) {
        if( e == 'centroid_x' || e == 'centroid_y' || e == 'radius_m' ){
            $('#' + e).val(data[e].toFixed(7));
        }else{
            $('#' + e).val(data[e]);
        }
    });
    local_centroid_data = data;
}
*/

const clear_centroid_data = function(){
    controls.forEach(function (e) {
        $('#' + e).val("");
    });
    local_centroid_data = {};    
}    

$("#cpdata").on("click", function(){
    if( empty_controls() ){        
        toast_warning('Nothing to copy!');
        return;
    }
    let centroid_x = $('#centroid_x').val();
    let centroid_y = $('#centroid_y').val();
    let radius_m = $('#radius_m').val();
    let geojson = $('#d_geojson').val();

    let wkt = '';

    try{
        const geojson_obj = JSON.parse(geojson);
        wkt = stringify(geojson_obj);
    }catch(error){
        console.log("Error parsing geomettry or empty geometry");
    }

    let date = new Date().toISOString();

    let pointRadiusSpatialFit = local_centroid_data.pointRadiusSpatialFit;
    let source_string = p.name + ' v.' + p.version;

    let georeferencer_name = $('#georeferencer_name').val();
    let georeference_remarks = $('#georeference_remarks').val();

    var string_template = `${centroid_x}\t${centroid_y}\tepsg:4326\t${radius_m}\t0.0000001\t${pointRadiusSpatialFit}\t${wkt}\tepsg:4326\t1\t${georeferencer_name}\t${date}\tGeoreferencing Quick Reference Guide (Zermoglio et al. 2020, https://doi.org/10.35035/e09p-h128)\t${source_string}\t${georeference_remarks}`;
    navigator.clipboard.writeText(headers.join('\t') + '\n' + string_template);    
    toast_success('Data copied to clipboard!');
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

const init_autocomplete = function(map, input_id){
    $( "#" + input_id ).autocomplete({
        source: function(request, response) {
          $.getJSON('https://nominatim.openstreetmap.org/search', { q: request.term, format: 'json' }, response)
        },      
        minLength: 2,
        select: function( event, ui ) {
          const sw = [ ui.item.boundingbox[0], ui.item.boundingbox[2]  ];
          const ne = [ ui.item.boundingbox[1], ui.item.boundingbox[3]  ];
          map.fitBounds( [ne,sw] );
        },
        create: function () {
          $(this).data('ui-autocomplete')._renderItem = function (ul, item) {
              return $('<li>')
                  .append('<a>' + item.display_name + '</a>')
                  .appendTo(ul);
          };
        }
    });
}

const show_api_centroid_data = function(parsed_json){
    $('#centroid_x').val( parsed_json.center.geometry.coordinates[0].toFixed(6) );
    $('#centroid_y').val( parsed_json.center.geometry.coordinates[1].toFixed(6) );
    $('#radius_m').val( parsed_json.uncertainty.toFixed(0) );
}

const toast_error = function(message){
    Toastr.error(message);
}

const toast_success = function(message){
    Toastr.success(message);
}

const toast_warning = function(message){
    Toastr.warning(message);
}

clear_centroid_data();

module.exports = {
    toast_error: toast_error,
    toast_success: toast_success,
    toast_warning: toast_warning,
    clear_centroid_data: clear_centroid_data,
    init_autocomplete: init_autocomplete,
    hideLineDrawControl: hideLineDrawControl,
    hidePolyDrawControl: hidePolyDrawControl,
    resetDrawControls: resetDrawControls,
    show_api_centroid_data: show_api_centroid_data 
}