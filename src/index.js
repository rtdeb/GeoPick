import L from "leaflet";
import draw from 'leaflet-draw';

import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./index.css";
require('./mystyle.scss');

import { clear_centroid_data, display_centroid_data } from './util.js';

var map = L.map('map').setView([51.505, -0.09], 3);

var centroid_layer = new L.geoJSON();    
map.addLayer(centroid_layer);

var buffer_layer = new L.geoJSON();    
map.addLayer(buffer_layer);

var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);

var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

L.tileLayer(
    osmUrl,
    {minZoom: 2, maxZoom: 18, attribution: osmAttrib}
).addTo(map);

var options = {
    position: 'topleft',
    draw: {
        polyline: {
            shapeOptions: {
                color: '#f357a1',
                weight: 10
            }
        },
        polygon: {
            allowIntersection: false, // Restricts shapes to simple polygons
            drawError: {
                color: '#e1e100', // Color the shape will turn when intersects
                message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
            },
            shapeOptions: {
                color: '#eb4936'
            }
        },
        circle: false,
        circlemarker: false,
        rectangle: false,
        marker: false        
    },
    edit: {
        featureGroup: editableLayers, //REQUIRED!!
        remove: true
    }
};

var drawControl = new L.Control.Draw(options);
map.addControl(drawControl);


map.on(L.Draw.Event.CREATED, function (e) {
    var type = e.layerType,
        layer = e.layer;

    if( type === 'polyline' || type === 'polygon' || type === 'rectangle' ){
        var geometry = layer.toGeoJSON();        
        display_centroid_data(geometry, buffer_layer, centroid_layer);
    }
    editableLayers.addLayer(layer);    
});

map.on(L.Draw.Event.EDITED, function (e) {
    clear_centroid_data();
    centroid_layer.clearLayers();
    buffer_layer.clearLayers();
    var layers = e.layers;
    var geometry = layers.toGeoJSON().features[0];    
    display_centroid_data(geometry, buffer_layer, centroid_layer);
});

map.on(L.Draw.Event.DELETED, function (e) {   
    clear_centroid_data();
    centroid_layer.clearLayers();
    buffer_layer.clearLayers();    
});