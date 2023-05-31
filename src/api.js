// This script contains functionality related to interaction with the API

const info = require('./info');
require('leaflet-spin');
const turf = require('@turf/turf');

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
    const centroid = JSON.parse(all_data.centroid[0]);
    var spatial_fit;
    if( all_data.spatial_fit[0] == 'Inf' ){
        spatial_fit = 'N/A';
    }else{
        spatial_fit = JSON.parse(all_data.spatial_fit[0]);        
    }     
    return {
        centroid: { type: 'Feature', 'geometry': centroid },
        mbc: { type: 'Feature', 'geometry': mbc },
        site: site,
        spatial_fit: spatial_fit,
        uncertainty: all_data.uncertainty[0]
    };
}

const promote_reference_to_editable = function(editableLayers, reference_layer, mbc_layer, centroid_layer, map){
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
            'Authorization': 'Basic ' + window.btoa(api_username + ":" + api_pwd)            
        })        
    }

    map.spin(true, spin_opts);    
    fetch( api_base_url + 'mbc',fetchdata)
    .then(function(response){
        return response.json();
    })
    .then(function(data){     
        editableLayers.clearLayers();
        mbc_layer.clearLayers();
        centroid_layer.clearLayers();
        reference_layer.clearLayers();

        const parsed_json = parse_api_data(data);        
        map.spin(false);
        mbc_layer.addData( parsed_json.mbc );
        centroid_layer.addData( parsed_json.centroid );
        map.fitBounds(mbc_layer.getBounds());
        info.show_api_centroid_data( parsed_json, geom );        
        var layer = L.geoJSON(parsed_json.site);        
        layer.eachLayer(
        function(l){
            editableLayers.addLayer(l);
        });
        editableLayers.bringToFront();        
    })
    .catch(function(error){
        info.toast_error(error);
        map.spin(false);
    });        
}

const load_api_data = function(editableLayers, mbc_layer, centroid_layer, map){
    var geom = editableLayers.toGeoJSON().features;
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
            'Authorization': 'Basic ' + window.btoa(api_username + ":" + api_pwd)            
        })        
    }
    
    map.spin(true, spin_opts);
    fetch( api_base_url + 'mbc',fetchdata)
    .then(function(response){        
        return response.json();
    })
    .then(function(data){              
        const parsed_json = parse_api_data(data);                
        map.spin(false);        
        mbc_layer.addData( parsed_json.mbc );
        centroid_layer.addData( parsed_json.centroid );
        map.fitBounds(mbc_layer.getBounds());
       
        info.show_api_centroid_data( parsed_json, geom );
    })
    .catch(function(error){
        info.toast_error(error);
        map.spin(false);
    });
}

module.exports = {
    parse_api_data,
    load_api_data,
    promote_reference_to_editable
}

