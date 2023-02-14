const L = require('leaflet');
const draw = require('leaflet-draw');
require('leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.min')

require('leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css');
require('leaflet-defaulticon-compatibility');
require('leaflet/dist/leaflet.css');
require('leaflet-draw/dist/leaflet.draw.css');
require('leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.css')
require('./index.css');
require('./mystyle.scss');

const ui = require('./ui');
const util = require('./util');

const  $ = require('jquery');

var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';

var osm = L.tileLayer(
    osmUrl,
    {minZoom: 2, maxZoom: 18, attribution: osmAttrib}
);

var googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

var googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

var googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

var googleTerrain = L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});


var map = L.map('map', {
    center: [51.505, -0.09],
    zoom: 3,
    layers: [osm, googleHybrid],
    zoomControl: false
});

var centroid_layer = new L.geoJSON();    
map.addLayer(centroid_layer);

var buffer_layer = new L.geoJSON();    
map.addLayer(buffer_layer);

var reference_layer = new L.geoJSON(null, {style: function(feature) {
    return {        
        weight: 3,
        opacity: 1,
        color: 'orange',
        stroke: true,
        fillOpacity: 0
    };
}});
map.addLayer(reference_layer);

var editableLayers = new L.FeatureGroup();
//var editableLayers = new L.geoJSON();
map.addLayer(editableLayers);

L.control.scale().addTo(map);

var baseMaps = {
    "OpenStreetMap": osm,    
    "Google default view": googleStreets,    
    "Google terrain": googleTerrain,
    "Google satellite": googleSat,
    "Google hybrid": googleHybrid,
};

L.control.layers(baseMaps,null,{position: 'topleft'}).addTo(map);

L.control.zoom({ position: 'topleft' }).addTo(map);

var options = {
    position: 'topleft',
    draw: {
        polyline: {
            allowIntersection: false,
            shapeOptions: {
                color: '#f357a1'                
            },            
		    icon: new L.DivIcon({
                iconSize: new L.Point(10, 10),
                className: 'leaflet-div-icon leaflet-editing-icon'
            }),
            touchIcon: new L.DivIcon({
                iconSize: new L.Point(10, 10),
                className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
            }),
        },
        polygon: {
            allowIntersection: false,            
            shapeOptions: {
                color: '#eb4936'
            },
            icon: new L.DivIcon({
                iconSize: new L.Point(10, 10),
                className: 'leaflet-div-icon leaflet-editing-icon'
            }),
            touchIcon: new L.DivIcon({
                iconSize: new L.Point(10, 10),
                className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
            }),
        },
        circle: false,
        circlemarker: false,
        rectangle: false,
        marker: false        
    },
    edit: {
        featureGroup: editableLayers,
        poly: {
            icon: new L.DivIcon({
                iconSize: new L.Point(10, 10),
                className: 'leaflet-div-icon leaflet-editing-icon'
            }),
            touchIcon: new L.DivIcon({
                iconSize: new L.Point(10, 10),
                className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
            })
        }
        //remove: true
    }
};

var drawControl = new L.Control.Draw(options);
map.addControl(drawControl);

var coordControl = L.control.coordinates({ 
    position:"bottomleft", 
    enableUserInput:false, 
    useLatLngOrder: true, 
    labelTemplateLat:"Lat: {y}", 
    labelTemplateLng:"Long: {x}" 
});
map.addControl(coordControl);


map.on(L.Draw.Event.CREATED, function (e) {    
    var type = e.layerType;    

    ui.clear_centroid_data();
    centroid_layer.clearLayers();
    buffer_layer.clearLayers();
        
    if(type=='polygon'){
        ui.hideLineDrawControl();
    }else{
        ui.hidePolyDrawControl();        
    }
    var layer = e.layer;    
    editableLayers.addLayer(layer);    
    editableLayers.bringToFront();
    util.load_api_data(editableLayers,buffer_layer,centroid_layer,map);
});

map.on(L.Draw.Event.EDITED, function (e) {
    ui.clear_centroid_data();
    centroid_layer.clearLayers();
    buffer_layer.clearLayers();
    util.load_api_data(editableLayers,buffer_layer,centroid_layer,map);
});


map.on(L.Draw.Event.DELETED, function (e) {   
    ui.clear_centroid_data();
    centroid_layer.clearLayers();
    buffer_layer.clearLayers();
    reference_layer.clearLayers();
    if(editableLayers.toGeoJSON().features.length > 0){
        util.load_api_data(editableLayers,buffer_layer,centroid_layer,map);        
        editableLayers.bringToFront();
    }else{
        ui.resetDrawControls();
    }    
});

ui.init_autocomplete(map,"place_search", reference_layer);

$('#capture').click(function(){
    if( reference_layer.toGeoJSON().features.length == 0 ){
        ui.toast_error('Nothing to capture! Please select a location.');
    }else{        
        util.promote_reference_to_editable(editableLayers, reference_layer, buffer_layer, centroid_layer, map);
    }
});