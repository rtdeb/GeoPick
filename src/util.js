const ui = require('./ui');
require('leaflet-spin');
const turf = require('@turf/turf');
const mbc = require("./mbc.js");
const proj4 = require("proj4").default;

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
    const center = JSON.parse(all_data.centre[0]);
    var spatial_fit;
    if( all_data.spatial_fit[0] == 'Inf' ){
        spatial_fit = 'N/A';
    }else{
        spatial_fit = JSON.parse(all_data.spatial_fit[0]);        
    }     
    return {
        center: { type: 'Feature', 'geometry': center },
        mbc: { type: 'Feature', 'geometry': mbc },
        site: site,
        spatial_fit: spatial_fit,
        uncertainty: all_data.uncertainty[0]
    };
}

const promote_reference_to_editable = function(editableLayers, reference_layer, buffer_layer, centroid_layer, map){
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
            'Authorization': 'Basic ' + btoa(api_username + ":" + api_pwd)
        })        
    }

    map.spin(true, spin_opts);    
    fetch( api_base_url + 'mbc',fetchdata)
    .then(function(response){
        return response.json();
    })
    .then(function(data){     
        editableLayers.clearLayers();
        buffer_layer.clearLayers();
        centroid_layer.clearLayers();
        reference_layer.clearLayers();

        const parsed_json = parse_api_data(data);        
        map.spin(false);
        buffer_layer.addData( parsed_json.mbc );
        centroid_layer.addData( parsed_json.center );
        map.fitBounds(buffer_layer.getBounds());
        ui.show_api_centroid_data( parsed_json, geom );        
        var layer = L.geoJSON(parsed_json.site);        
        layer.eachLayer(
        function(l){
            editableLayers.addLayer(l);
        });
        editableLayers.bringToFront();        
    })
    .catch(function(error){
        ui.toast_error(error);
        map.spin(false);
    });        
}

const load_api_data = function(editableLayers, buffer_layer, centroid_layer, map){
    var geom = editableLayers.toGeoJSON().features;
    
    var source = new proj4.Proj('EPSG:4326');
    var target = new proj4.Proj('EPSG:3857');
    
    var points = [];
    for(i = 0; i < geom.length; i++){        
        coordinates = geom[i].geometry.coordinates;               
        coordinates = coordinates.flat(1);
        for(j = 0; j < coordinates.length; j++){
            console.log(coordinates[j]);
            coord_3857 = proj4.transform(source, target, coordinates[j]);            
            points.push(new mbc.Point(coord_3857.x, coord_3857.y));            
        }        
    }    
    unc_circle = mbc.makeCircle(points);
    pol = circleToPolygon(unc_circle.x, unc_circle.y, unc_circle.r, 36);
    const geoJsonPolygon = {
        type: 'Polygon',
        coordinates: [pol]
      };
    
    buffer_layer.addData( geoJsonPolygon );
    // editableLayers.addLayer(geoJsonPolygon);
    // // centroid_layer.addData( parsed_json.center );
    map.fitBounds(buffer_layer.getBounds());

    // if(geom.length > 1){
    //     var geom_type = '';
    //     var coords = [];
    //     for(var i = 0; i < geom.length; i++){
    //         geom_type = geom[i].geometry.type;
    //         coords.push(geom[i].geometry.coordinates);
    //     }
    //     if( geom_type == 'Polygon'){
    //         geom = turf.multiPolygon(coords);
    //     }                
    // }
    
    // const fetchdata = {
    //     method: 'POST',
    //     body: JSON.stringify(geom),
    //     headers: new Headers({
    //         'Content-Type': 'application/json; charset=UTF-8',
    //         'Authorization': 'Basic ' + btoa(api_username + ":" + api_pwd)
    //     })        
    // }
    
    // map.spin(true, spin_opts);
    // fetch( api_base_url + 'mbc',fetchdata)
    // .then(function(response){        
    //     return response.json();
    // })
    // .then(function(data){ 
    //     const parsed_json = parse_api_data(data);                
    //     map.spin(false);        
    //     buffer_layer.addData( parsed_json.mbc );
    //     centroid_layer.addData( parsed_json.center );
    //     map.fitBounds(buffer_layer.getBounds());
       
    //     ui.show_api_centroid_data( parsed_json, geom );
    // })
    // .catch(function(error){
    //     ui.toast_error(error);
    //     map.spin(false);
    // });
}
function circleToPolygon(centerX, centerY, radius, sides) {
    var source = new proj4.Proj('EPSG:4326');
    var target = new proj4.Proj('EPSG:3857');

    const angle = (2 * Math.PI) / sides;
    const polygon3857 = [];
    const polygon4326 = [];
  
    for (let i = 0; i < sides; i++) {
      const x = centerX + radius * Math.cos(i * angle);
      const y = centerY + radius * Math.sin(i * angle);
      coord_3857 = proj4.transform(target, source, [x, y]);            
      x2 = coord_3857.x;
      y2 = coord_3857.y;
    //   console.log(x + " " + y + " --> " + coord_3857.x + " " + coord_3857.y);
      polygon4326.push([ x2, y2 ]);
    }
  
    return polygon4326;
  }
  
// function circleToPolygon(centerX, centerY, radius, sides) {
//     const angle = (2 * Math.PI) / sides;
//     const polygon = [];
  
//     for (let i = 0; i < sides; i++) {
//       const x = centerX + radius * Math.cos(i * angle);
//       const y = centerY + radius * Math.sin(i * angle);
//       polygon.push({ x, y });
//     }
  
//     return polygon;
//   }
  
  module.exports = {
    parse_api_data,
    load_api_data,
    promote_reference_to_editable
}

