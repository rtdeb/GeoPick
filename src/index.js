const L = require('leaflet');
const draw = require('leaflet-draw');

require('leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css');
require('leaflet-defaulticon-compatibility');
require('leaflet/dist/leaflet.css');
require('leaflet-draw/dist/leaflet.draw.css');
require('./index.css');
require('./mystyle.scss');

/*require('jquery-ui/themes/base/core.css');
require('jquery-ui/themes/base/autocomplete.css');*/

const ui = require('./ui');
const util = require('./util');

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

var editableLayers = new L.FeatureGroup();
//var editableLayers = new L.geoJSON();
map.addLayer(editableLayers);

L.control.scale().addTo(map);

var baseMaps = {
    "OpenStreetMap": osm,    
    "Google streets": googleStreets,    
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


map.on(L.Draw.Event.CREATED, function (e) {    
    ui.clear_centroid_data();
    centroid_layer.clearLayers();
    buffer_layer.clearLayers();
    
    var type = e.layerType;
    if(type=='polygon'){
        ui.hideLineDrawControl();
    }else{
        ui.hidePolyDrawControl();
    }
    var layer = e.layer;    
    editableLayers.addLayer(layer);
    util.compute_centroid_data(editableLayers.toGeoJSON(), buffer_layer, centroid_layer);
    editableLayers.bringToFront();
    map.fitBounds(buffer_layer.getBounds());
    /*
    var geojson;
    var geom;
    var newGeom;
    var newLayer;

    var newLayer = e.layer;
    var newGeom = turf.getGeom(newLayer.toGeoJSON());

    editableLayers.eachLayer(function (layer) {
        geojson = layer.toGeoJSON();
        if (geojson.type == 'FeatureCollection') {
        geojson = geojson.features[0];
        }
        geom = turf.getGeom(geojson);
        if (turf.booleanContains(geom, newGeom)) {
        newGeom = turf.difference(geom, newGeom);
        newLayer = L.geoJSON(newGeom);
        editableLayers.removeLayer(layer);
        }
    });
    editableLayers.addLayer(newLayer);
    */
});

map.on(L.Draw.Event.EDITED, function (e) {
    ui.clear_centroid_data();
    centroid_layer.clearLayers();
    buffer_layer.clearLayers();
    util.compute_centroid_data(editableLayers.toGeoJSON(), buffer_layer, centroid_layer);
    editableLayers.bringToFront();
    map.fitBounds(buffer_layer.getBounds());
});


map.on(L.Draw.Event.DELETED, function (e) {   
    ui.clear_centroid_data();
    centroid_layer.clearLayers();
    buffer_layer.clearLayers();
    if(editableLayers.toGeoJSON().features.length > 0){
        util.compute_centroid_data(editableLayers.toGeoJSON(), buffer_layer, centroid_layer);
        editableLayers.bringToFront();
    }else{
        ui.resetDrawControls();
    }    
});

ui.init_autocomplete(map,"place_search");