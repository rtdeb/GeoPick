// This script contains functionality related to the info side panel plus notification functions

const $ = require('jquery');
const ui = require('jquery-ui/ui/widgets/dialog');
const Toastr = require('toastr');
const p = require('../package.json');
const { convertToWK } = require('wkt-parser-helper');
// const map = require("./map");
Toastr.options = {
    "positionClass": "toast-top-center",
    "timeOut": "3000"    
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

const format_georef_data = function(georef_data){
    var template = `${georef_data.centroid_y}\t${georef_data.centroid_x}\tepsg:4326\t${georef_data.radius_m}\t0.0000001\t${georef_data.pointRadiusSpatialFit}\t${georef_data.wkt}\tepsg:4326\t${georef_data.footprintSpatialFit}\t${georef_data.georeferencer_name}\t${georef_data.date}\tGeoreferencing Quick Reference Guide (Zermoglio et al. 2020, https://doi.org/10.35035/e09p-h128)\t${georef_data.source_string}\t${georef_data.georeference_remarks}`;
    return template;
}

const get_ui_data = function(yes_wkt){
    let centroid_x = $('#centroid_x').val();
    let centroid_y = $('#centroid_y').val();
    let radius_m = $('#radius_m').val();
    let wkt = "";
    if(yes_wkt){
        if($('#d_geojson').val() == ""){
            wkt = "POINT (" + centroid_x + " " + centroid_y + ")";
        } else {
            wkt = $('#d_geojson').val();   
        }
    }
    let date = new Date().toISOString();
    let pointRadiusSpatialFit = $('#spatial_fit').val();
    let footprintSpatialFit = 1;
    if(wkt.includes("LINESTRING") || wkt.includes("POINT")){        
        footprintSpatialFit = "";
    }
    let source_string = p.name + ' v.' + p.version;

    let georeferencer_name = $('#georeferencer_name').val();
    let georeference_remarks = $('#georeference_remarks').val();
    return {
        'centroid_y': centroid_y,
        'centroid_x': centroid_x,
        'radius_m': radius_m,
        'pointRadiusSpatialFit': pointRadiusSpatialFit,
        'wkt': wkt,
        'footprintSpatialFit': footprintSpatialFit,
        'georeferencer_name': georeferencer_name,
        'date': date,
        'source_string': source_string,
        'georeference_remarks': georeference_remarks
    }
}

const do_copy_data = function( yes_headers, yes_wkt ){
    if( empty_controls() ){        
        toast_warning('Nothing to copy!');
        return;
    }        

    const georef_data = get_ui_data(yes_wkt);    
    var string_template = format_georef_data(georef_data);

    if( yes_headers ){
        navigator.clipboard.writeText(headers.join('\t') + '\n' + string_template);    
    }else{
        navigator.clipboard.writeText(string_template);    
    }
    toast_success('Data copied to clipboard!');
};

const copy_latest_search = function(latest_search){
    navigator.clipboard.writeText(latest_search);    
    toast_success('Latest search copied to clipboard!');
}
const show_api_centroid_data = function(parsed_json, geom){
    geometry = parsed_json.centroid.geometry.features[0].geometry;
    $('#centroid_x').val( geometry.coordinates[0].toFixed(7) );
    $('#centroid_y').val( geometry.coordinates[1].toFixed(7) );

    $('#radius_m').val( parsed_json.uncertainty );

    $('#spatial_fit').val( parsed_json.spatial_fit );   
    
    /* The following if code is cumbersome in order to deal with inconsistencies in the geom variable between lines and polygons. For lines we needed to build the MULTILINESTRING wkt ourselves beacause the convertToWK did not like. When lines, geom arrives as an array of LINESTRINGs instead of a MULTILINESTRING, while for polygons, geom already arrives as MULTIPOLYGON, and, in this latter case, convertToWK works.
    */
    if(geom.length == 1){
        wkt=convertToWK( geom[0])
    } else {        
        if( typeof geom.type == "undefined"){
            if( geom[0].geometry.type  == "LineString" ){   
                const coordinates = geom         
                    .map(geom => "(" + geom.geometry.coordinates.map(pair => pair.join(" ")).join(", ") + ")")
                    .join(", ");
              wkt = "MULTILINESTRING (" + coordinates + ")";              
            }               
        } else {
            if(geom.geometry.type == "MultiPolygon"){
                wkt=convertToWK( geom );        
            }            
        }
    }
    $('#d_geojson').val( wkt );        
}

const show_centroid_data = function(lat,lng,radius){
    $('#centroid_x').val( lng.toFixed(7) );
    $('#centroid_y').val( lat.toFixed(7) );
    if(radius === null){
        $('#radius_m').val = "";
    } else {
        $('#radius_m').val( radius.toFixed(0) );
    }
}

const showShareLink = function(shareLink){
    $('#showShareLink').show();
}

// Notification functions
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
    toast_error,
    toast_success,
    toast_warning,
    clear_centroid_data,
    show_api_centroid_data,
    show_centroid_data,
    do_copy_data,
    get_ui_data,
    copy_latest_search,
    showShareLink
}

