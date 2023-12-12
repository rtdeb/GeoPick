// This script contains functionality related to interaction with the API

const info = require('./info');
require('leaflet-spin');
const turf = require('@turf/turf');

const api_base_url = process.env.API_URL + 'v1/';
//const api_username = process.env.USERNAME;
//const api_pwd = process.env.PASSWORD;

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

/*
const auth = function() {
    if(sessionStorage.getItem('token') != null){
        return new Promise((resolve, reject) => {
            resolve(sessionStorage.getItem('token'));
        });
    }else{
        // Create a new promise
        return new Promise((resolve, reject) => {
        // Define the API endpoint for authentication
        const apiUrl = api_base_url + 'auth';
    
        // Make a POST request to the authentication endpoint
        fetch(apiUrl, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            username: api_username,
            password: api_pwd,
            }),
        })
            .then(response => {
            // Check if the response status is OK (status code 200-299)
            if (response.ok) {
                // Parse the JSON response
                return response.json();
            } else {
                // If the response status is not OK, reject the promise with an error
                sessionStorage.setItem('token', null);
                reject(new Error('Authentication failed'));
            }
            })
            .then(data => {
                // Resolve the promise with the authentication result
                sessionStorage.setItem('token', data.token);
                resolve(data.token);
            })
            .catch(error => {
                // Reject the promise with the error
                sessionStorage.setItem('token', null);
                reject(error);
            });
        });
    }
}
*/

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
        

    /*
    map.spin(true, spin_opts);
    auth()
    .then(function(token){
        const fetchdata = {
            method: 'POST',
            body: JSON.stringify(geom),
            headers: new Headers({
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + token            
            })        
        }
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
    })
    */
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
            //'Authorization': 'Bearer ' + token
        })        
    }
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
    
    /*
    map.spin(true, spin_opts);
    auth()
    .then( function(token){
        const fetchdata = {
            method: 'POST',
            body: JSON.stringify(geom),
            headers: new Headers({
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + token
            })        
        }
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
    })
    */    
}

module.exports = {
    parse_api_data,
    load_api_data,
    promote_reference_to_editable
}

