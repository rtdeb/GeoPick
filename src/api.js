// This script contains functionality related to interaction with the API

const info = require('./info');
require('leaflet-spin');
const { parseFromWK } = require("wkt-parser-helper");
const turf = require('@turf/turf');

const api_base_url = process.env.API_URL + 'v1/';

const spin_opts = {
    lines: 13, 
    length: 38, 
    width: 17, 
    radius: 54, 
    color: '#ffffff'
}

const parse_api_data = function(data){    
    const mbc = data.mbc;
    const site = data.site;
    const centroid = data.centroid;
    var spatial_fit;
    if( data.spatial_fit == 'Inf' ){
        spatial_fit = '';
    }else{
        spatial_fit = data.spatial_fit;        
    }     
    return {
        centroid: { type: 'Feature', 'geometry': centroid },
        mbc: { type: 'Feature', 'geometry': mbc },
        site: site,
        spatial_fit: spatial_fit,
        uncertainty: data.uncertainty
    };
}

const parse_share_api_data = function(data){
    const parsed_json = JSON.parse(data.data);
    const path = data.path;
    const site = parseFromWK(parsed_json.wkt);    
    const centroid = {
        "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "coordinates": [
                            parseFloat(parsed_json.centroid_x),
                            parseFloat(parsed_json.centroid_y)
                        ],
                        "type": "Point"
                    }
                }
            ]
    }    
    var mbc = null;
    if( parsed_json.geojson_mbc.length != 0 ){            
        mbc = { type: 'Feature', 'geometry': parsed_json.geojson_mbc[0].geometry };
    }
    return {
        centroid: { type: 'Feature', 'geometry': centroid },
        mbc: mbc,
        site: site,
        spatial_fit: parsed_json.pointRadiusSpatialFit,
        uncertainty: parsed_json.radius_m,
        wkt: parsed_json.wkt,
        locality: parsed_json.locality,
        georeferencer_name: parsed_json.georeferencer_name,
        georeference_remarks: parsed_json.georeference_remarks,
        path: path
    };
}

const promote_reference_to_editable = function(site_layer, nominatim_layer, mbc_layer, centroid_layer, map){
    var geom = nominatim_layer.toGeoJSON().features;
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
            //'Authorization': 'Bearer ' + token            
        })        
    }
    map.spin(true);
    fetch( api_base_url + 'sec',fetchdata)
    .then(function(response){
        return response.json();
    })
    .then(function(data){     
        site_layer.clearLayers();
        mbc_layer.clearLayers();
        centroid_layer.clearLayers();
        nominatim_layer.clearLayers();

        const parsed_json = parse_api_data(data);        
        map.spin(false);
        mbc_layer.addData( parsed_json.mbc );
        centroid_layer.addData( parsed_json.centroid );
        map.fitBounds(mbc_layer.getBounds());
        info.show_api_centroid_data( parsed_json, geom );
        var layer = L.geoJSON(parsed_json.site);        
        layer.eachLayer(
        function(l){
            site_layer.addLayer(l);
        });
        site_layer.bringToFront();

    })
    .catch(function(error){
        info.toast_error(error);
        map.spin(false);
    });
}

const load_share = function(share_code, site_layer, mbc_layer, centroid_layer, map){    
    const fetchdata = {
        method: 'GET',        
        headers: new Headers({
            'Content-Type': 'application/json; charset=UTF-8',            
        })        
    }
    map.spin(true);
    fetch( api_base_url + 'georeference/' + share_code, fetchdata)
    .then(function(response){         
        return response.json();
    })
    .then(function(data){        
        const parsed_json = parse_share_api_data(data);
        site_layer.clearLayers();
        mbc_layer.clearLayers();
        centroid_layer.clearLayers();        

        map.spin(false);

        // There is actually a sec geometry
        if( parsed_json.mbc ){
            mbc_layer.addData( parsed_json.mbc );
            centroid_layer.addData( parsed_json.centroid );
            map.fitBounds(mbc_layer.getBounds());
            info.show_api_centroid_data_wkt( parsed_json, parsed_json.wkt );
            var layer = L.geoJSON(parsed_json.site);        
            layer.eachLayer(
            function(l){
                site_layer.addLayer(l);
            });
            site_layer.bringToFront();        
        }else{ // If there is no sec geometry it's a point radius feature, must rebuild
            centroid_layer.addData( parsed_json.centroid );
            const long = parseFloat(parsed_json.centroid.geometry.features[0].geometry.coordinates[1]);
            const lat = parseFloat(parsed_json.centroid.geometry.features[0].geometry.coordinates[0]);
            const radius = parseFloat(parsed_json.uncertainty);
            circle = L.circle([long, lat], radius, {
                color: "blue",
                fillColor: "blue",
            });
            map.addLayer(circle);
            site_layer.addLayer(circle);
            centroid_layer.addData(site_layer.toGeoJSON());
            info.show_centroid_data(lat, long, radius);
            map.fitBounds(circle.getBounds());
        }
        info.show_textual_data(parsed_json);
        info.set_share_link(parsed_json.path);
    }).catch(function(error){
        info.toast_error(error);        
        map.spin(false);
    });
}

const write_share = function(share_data, map){
    const fetchdata = {
        method: 'POST',
        body: JSON.stringify({'georef_data': share_data}),
        headers: new Headers({
            'Content-Type': 'application/json; charset=UTF-8',            
        })        
    }
    map.spin(true);
    fetch( api_base_url + 'georeference', fetchdata)
    .then(function(response){         
        return response.json();
    })
    .then(function(data){        
        map.spin(false);
        console.log(data.shortcode);
        info.set_share_link(data.path);
    })
    .catch(function(error){
        map.spin(false);
        info.toast_error(error);        
    });        
}

const load_api_data = function(site_layer, mbc_layer, centroid_layer, map){
    var geom = site_layer.toGeoJSON().features;
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
        })        
    }
    map.spin(true);
    fetch( api_base_url + 'sec', fetchdata)
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
    promote_reference_to_editable,
    write_share,
    load_share
}

