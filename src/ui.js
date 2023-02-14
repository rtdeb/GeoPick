require('jquery-ui/ui/widgets/autocomplete');
const  $ = require('jquery');

const Toastr = require('toastr');
const { stringify } = require('wkt');
const p = require('../package.json');

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
    'radius_m',
    'd_geojson',
    'spatial_fit'
];

const empty_controls = function() {
    for (c in controls){
        if ( $('#' + controls[c]).val().trim() != '' ){
            return false;
        }
    }
    return true;
}

const clear_centroid_data = function(){
    controls.forEach(function (e) {
        $('#' + e).val("");
    });    
}

const do_copy_data = function( yes_headers ){
    if( empty_controls() ){        
        toast_warning('Nothing to copy!');
        return;
    }
    let centroid_x = $('#centroid_x').val();
    let centroid_y = $('#centroid_y').val();
    let radius_m = $('#radius_m').val();
    let wkt = $('#d_geojson').val();
    let spatial_fit = $('#spatial_fit').val();    

    let date = new Date().toISOString();

    let pointRadiusSpatialFit = spatial_fit;
    let source_string = p.name + ' v.' + p.version;

    let georeferencer_name = $('#georeferencer_name').val();
    let georeference_remarks = $('#georeference_remarks').val();

    var string_template = `${centroid_x}\t${centroid_y}\tepsg:4326\t${radius_m}\t0.0000001\t${pointRadiusSpatialFit}\t${wkt}\tepsg:4326\t1\t${georeferencer_name}\t${date}\tGeoreferencing Quick Reference Guide (Zermoglio et al. 2020, https://doi.org/10.35035/e09p-h128)\t${source_string}\t${georeference_remarks}`;
    if( yes_headers ){
        navigator.clipboard.writeText(headers.join('\t') + '\n' + string_template);    
    }else{
        navigator.clipboard.writeText(string_template);    
    }
    toast_success('Data copied to clipboard!');
};

$("#cpdata").on("click", function(){
    do_copy_data(true);
});

$("#cpdatanh").on("click", function(){
    do_copy_data(false);
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

const init_autocomplete = function(map, input_id, reference_layer){
    $( "#" + input_id ).autocomplete({
        source: function(request, response) {
          $.ajax({
            url: 'https://nominatim.openstreetmap.org/search',
            data: {
                q: request.term,
                format: 'geojson',
                polygon_geojson: 1
            },
            success: function(data) {
                var results = $.map(data.features, function(item) {
                    return item;
                });
                response(results);
            }
          });
        },      
        minLength: 2,        
        select: function( event, ui ) {
          const sw = [ ui.item.bbox[1], ui.item.bbox[0]  ];
          const ne = [ ui.item.bbox[3], ui.item.bbox[2]  ];
          map.fitBounds( [ne,sw] );
          reference_layer.clearLayers();
          reference_layer.addData( ui.item.geometry );
        },
        create: function () {
          $(this).data('ui-autocomplete')._renderItem = function (ul, item) {
              return $('<li>')
                  .append('<a>' + item.properties.display_name + '</a>')
                  .appendTo(ul);
          };
        }
    });
}

const show_api_centroid_data = function(parsed_json){
    $('#centroid_x').val( parsed_json.center.geometry.coordinates[0].toFixed(7) );
    $('#centroid_y').val( parsed_json.center.geometry.coordinates[1].toFixed(7) );
    $('#radius_m').val( parsed_json.uncertainty.toFixed(0) );
    $('#spatial_fit').val( parsed_json.spatial_fit );
    $('#d_geojson').val( parsed_json.footprintwkt );
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