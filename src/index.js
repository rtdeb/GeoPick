import L from "leaflet";
import draw from 'leaflet-draw';
import * as turf from '@turf/turf';
var $ = require('jquery');

import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./index.css";
require('./mystyle.scss');

import { clear_centroid_data } from './ui.js';
import { compute_centroid_data } from './util.js';

var map = L.map('map').setView([51.505, -0.09], 3);

var centroid_layer = new L.geoJSON();    
map.addLayer(centroid_layer);

var buffer_layer = new L.geoJSON();    
map.addLayer(buffer_layer);

var editableLayers = new L.FeatureGroup();
//var editableLayers = new L.geoJSON();
map.addLayer(editableLayers);

var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

L.tileLayer(
    osmUrl,
    {minZoom: 2, maxZoom: 18, attribution: osmAttrib}
).addTo(map);

L.control.scale().addTo(map);

var options = {
    position: 'topleft',
    draw: {
        polyline: {
            allowIntersection: false,
            shapeOptions: {
                color: '#f357a1'                
            }
        },
        polygon: {
            allowIntersection: false,            
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
        featureGroup: editableLayers,
        //remove: true
    }
};

var drawControl = new L.Control.Draw(options);
map.addControl(drawControl);


map.on(L.Draw.Event.CREATED, function (e) {
    clear_centroid_data();
    centroid_layer.clearLayers();
    buffer_layer.clearLayers();
    
    var type = e.layerType;
    var layer = e.layer;    
    editableLayers.addLayer(layer);
    compute_centroid_data(editableLayers.toGeoJSON(), buffer_layer, centroid_layer);
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
    clear_centroid_data();
    centroid_layer.clearLayers();
    buffer_layer.clearLayers();
    compute_centroid_data(editableLayers.toGeoJSON(), buffer_layer, centroid_layer);
    editableLayers.bringToFront();
    map.fitBounds(buffer_layer.getBounds());
});


map.on(L.Draw.Event.DELETED, function (e) {   
    clear_centroid_data();
    centroid_layer.clearLayers();
    buffer_layer.clearLayers();
    if(editableLayers.toGeoJSON().features.length > 0){
        compute_centroid_data(editableLayers.toGeoJSON(), buffer_layer, centroid_layer);
        editableLayers.bringToFront();
    }
});