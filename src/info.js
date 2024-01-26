// This script contains functionality related to the info side panel plus notification functions

const $ = require('jquery');
const ui = require('jquery-ui/ui/widgets/dialog');
const Toastr = require('toastr');
const p = require('../package.json');
const moment = require('moment');
const { convertToWK } = require('wkt-parser-helper');

// const map = require("./map");
Toastr.options = {
      closeButton: false,     // Show close button
      timeOut: 3000,            // Disable auto-hide
      extendedTimeOut: 0,    // Disable auto-hide after user interaction
      tapToDismiss: false, 
      positionClass: "toast-center-center",
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
    'locality',
    'georeferencedBy',
    'georeferencedDate',
    'georeferenceProtocol',
    'georeferenceSources',
    'georeferenceRemarks',
    'shareLink'
];

const controls = [
    'centroid_x',
    'centroid_y',
    'radius_m',
    'd_geojson',
    'spatial_fit'
];

const generate_location_id = function(){
    const version = 'v' + p.version;
    const date = moment().format('YYYYMMDD');
    const hour = moment().format('HHmmss');
    const salt = Math.floor(Math.random() * 1000);
    const location_template = `geopick-${version}-${date}${hour}-${salt}`;
    return location_template;
}

const set_location_id = function(locationid){
    $('#location_id').val(locationid);
}

const set_share_link = function(locationid){
    if(locationid != ''){
        $('#georeference_url').val(window.location.origin + "/?locationid=" + locationid);
    }else{
        $('#georeference_url').val('');
    }
}

const empty_controls = function() {
    for (c in controls){
        if ( $('#' + controls[c]).val().trim() != '' ){
            return false;
        }
    }
    return true;
}

const enable_validate_button = function(yesorno) {
    if(yesorno==true){
        $('#validate_button_container').removeClass('disabled-div');
    }else{
        $('#validate_button_container').addClass('disabled-div');        
    }
}

const enable_copy_button = function(yesorno){
    if(yesorno==true){
        $('#copy_buttons_container').removeClass('disabled-div');
    }else{
        $('#copy_buttons_container').addClass('disabled-div');        
    }
}

const clear_centroid_data = function(){
    controls.forEach(function (e) {
        $('#' + e).val("");
    });    
    $('#locality_description').val('');
    $('#georeferencer_name').val('');
    $('#georeference_remarks').val('');
    $('#location_id').val('');
    $('#georeference_url').val('');
}

const format_georef_data = function(georef_data){
    var template = `${georef_data.decimalLatitude}\t${georef_data.decimalLongitude}\tepsg:4326\t${georef_data.coordinateUncertaintyInMeters}\t0.0000001\t${georef_data.pointRadiusSpatialFit}\t${georef_data.wkt}\tepsg:4326\t${georef_data.footprintSpatialFit}\t${georef_data.locality}\t${georef_data.georeferencedBy}\t${georef_data.date}\tGeoreferencing Quick Reference Guide (Zermoglio et al. 2020, https://doi.org/10.35035/e09p-h128)\t${georef_data.source_string}\t${georef_data.georeferenceRemarks}\t${georef_data.link}`;
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
    let locality = $('#locality_description').val();
    let link = $('#georeference_url').val();
    let locationid = $('#location_id').val();
    return {
        'decimalLatitude': centroid_y,
        'decimalLongitude': centroid_x,
        'coordinateUncertaintyInMeters': radius_m,
        'pointRadiusSpatialFit': pointRadiusSpatialFit,
        'wkt': wkt,
        'footprintSpatialFit': footprintSpatialFit,
        'georeferencedBy': georeferencer_name,
        'date': date,
        'georeferenceSources': source_string,
        'georeferenceRemarks': georeference_remarks,
        'locality': locality,
        'link': link,
        'locationid': locationid
    }
}

const show_textual_data = function(parsed_json){
    $('#locality_description').val(parsed_json.locality);
    $('#georeferencer_name').val(parsed_json.georeferencer_name);
    $('#georeference_remarks').val(parsed_json.georeference_remarks);
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

const copy_share_link = function(share_link){
    navigator.clipboard.writeText(share_link);    
    toast_success('Share link copied to clipboard!');
}

const show_api_centroid_data_wkt = function(parsed_json, wkt){
    geometry = parsed_json.centroid.geometry.features[0].geometry;
    $('#centroid_x').val( geometry.coordinates[0].toFixed(7) );
    $('#centroid_y').val( geometry.coordinates[1].toFixed(7) );

    $('#radius_m').val( parsed_json.uncertainty );

    $('#spatial_fit').val( parsed_json.spatial_fit );   
        
    $('#d_geojson').val( wkt );        
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
    set_share_link('');
    set_location_id('');
}

const presentConfirmResetValidation = function(event){
    if($('#location_id').val()!= ''){
        //console.log('Warning, invalidating validation');
        if(confirm("Warning: you are about to change either the 'Locality', 'Georeferenced by' or 'Georeference remarks' on a georeference that has already been validated. If you continue, you will have to validate again the record and it will be considered a different georeference set. Do you want to continue?")){
            set_share_link('');
            set_location_id('');
            enable_copy_button(false);
            enable_validate_button(true);
        }else{
            event.preventDefault();
        }
    }  
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
    show_api_centroid_data_wkt,
    show_centroid_data,
    do_copy_data,
    get_ui_data,
    copy_latest_search,
    showShareLink,
    show_textual_data,
    set_share_link,
    copy_share_link,
    generate_location_id,
    set_location_id,
    enable_validate_button,
    enable_copy_button,
    presentConfirmResetValidation
}

