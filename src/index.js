import L from "leaflet";
import draw from 'leaflet-draw';
//import * as turf from '@turf/turf';
//var $ = require('jquery');

import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./index.css";
require('./mystyle.scss');

import { clear_centroid_data } from './ui.js';
import { compute_centroid_data } from './util.js';

var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';

var osm = L.tileLayer(
    osmUrl,
    {minZoom: 2, maxZoom: 18, attribution: osmAttrib}
);

/*var googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

var googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});*/

var googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

/*var googleTerrain = L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});*/


var map = L.map('map', {
    center: [51.505, -0.09],
    zoom: 3,
    layers: [osm, googleHybrid]
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
    //"Google streets": googleStreets,
    "Google hybrid": googleHybrid,
    //"Google terrain": googleTerrain,
    //"Google satellite": googleSat,
};

var layerControl = L.control.layers(baseMaps,null,{position: 'topleft'}).addTo(map);

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