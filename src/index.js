const L = require("leaflet");
const draw = require("leaflet-draw");
const $ = require("jquery");
require("leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.min");
require("leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css");
require("leaflet-defaulticon-compatibility");
require("leaflet/dist/leaflet.css");
require("leaflet-draw/dist/leaflet.draw.css");
require("leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.css");
require("./index.css");
require("./mystyle.scss");
require('jquery-ui/ui/widgets/autocomplete');

const { parseFromWK } = require("wkt-parser-helper");
const ui = require("./ui");
const util = require("./util");

// FUNCTIONS ===================================================================== //
const importNominatim = function () {
  if (reference_layer.toGeoJSON().features.length == 0) {
    ui.toast_error("Nothing to import! Please select a location.");
  } else {
    type = reference_layer.toGeoJSON().features[0].geometry.type;
    if (type == "Point") {
      hideLineDrawControl();
      hidePolyDrawControl();
      hideCircleDrawControl();
      coordinates =
        reference_layer.toGeoJSON().features[0].geometry.coordinates;
      addPointCircleToMap(coordinates[1], coordinates[0], null);
      //   $("#uncertaintyBox").show();
    } else {
      if (type == "LineString" || type == "MultiLineString") {
        hidePolyDrawControl();
        hideCircleDrawControl();
      } else if (type == "Polygon" || type == "MultiPolygon") {
        hideLineDrawControl();
        hideCircleDrawControl();
      }
      util.promote_reference_to_editable(
        editableLayers,
        reference_layer,
        buffer_layer,
        centroid_layer,
        map
      );
    }
    $("#importWKT").hide();
  }
};

const addPointCircleToMap = function (lat, long, radius) {
  ui.clear_centroid_data();
  centroid_layer.clearLayers();
  buffer_layer.clearLayers();
  reference_layer.clearLayers();
  circle = L.circle([lat, long], radius, {
    color: "blue",
    fillColor: "blue",
  });

  if (radius === null) {
    circle.setStyle({
      fillColor: "#e7e7e7",
      fillOpacity: 0.5,
      color: "#e7e7e7",
      opacity: 0.5,
    });    
  }
  map.addLayer(circle);
  editableLayers.clearLayers();
  editableLayers.addLayer(circle);
  centroid_layer.addData(editableLayers.toGeoJSON());
  ui.show_centroid_data(lat, long, radius);
  setVisibleAreaAroundCircle(circle);
};

setVisibleAreaAroundCircle = function (circle) {
  map.fitBounds(circle.getBounds());
};

const process_wkt_box = function(){
  wkt = $("#textareaWKT").val();
  geojson = parseFromWK(wkt);
  if (geojson === null) {
    /* using === because checking for null 
                             in javascript is  a special case */
    $("#infoDivBox").show();
    $("#errorWKT").val("ERROR: Malformed WKT. Please check and try again.");
    // alert("ERROR: Malformed WKT. Please check and try again.");
  } else if (geojson.type == "MultiPoint") {
    alert(
      "MULTIPOINT, MULTIPOLYGON with holes, and GEOMETRYCOLLECTION types are not supported."
    );
  } else {
    reference_layer.clearLayers();
    reference_layer.addData(geojson);

    if (geojson.type == "Point") {
      //No need to go to the API, just show the point as editable so it can be cleared.
      addPointCircleToMap(geojson.coordinates[1], geojson.coordinates[0], null);

      $("#keyboardEdit").show();
    } else {
      if (geojson.type == "Polygon") {
        $(".leaflet-draw-draw-polygon").show();
      } else if (geojson.type == "LineString") {
        $(".leaflet-draw-draw-polyline").show();
      }
      util.promote_reference_to_editable(
        editableLayers,
        reference_layer,
        buffer_layer,
        centroid_layer,
        map
      );
    }
    $("#controlTextWKT").hide();
    $("#importWKT").hide();
  }
};

const process_point_kb_box = function(){
  lat = parseFloat($("#keyboardLatitude").val());
  lng = parseFloat($("#keyboardLongitude").val());
  unc = $("#keyboardUncertainty").val();
  if (unc == "") {
    unc = null;
  } else {
    unc = parseFloat(unc);
  }

  addPointCircleToMap(lat, lng, unc);
  $("#controlKeyboard").hide();
};

const init_autocomplete = function(map, input_id, reference_layer){
  $( "#" + input_id ).autocomplete({
      source: function(request, response) {
        $.ajax({
          url: 'https://nominatim.openstreetmap.org/search',
          data: {
              q: request.term,
              format: 'geojson',
              polygon_geojson: 1
          },
          success: function(data) {
              var results = $.map(data.features, function(item) {
                  return item;
              });
              response(results);
          }
        });
      },      
      minLength: 2,        
      select: function( event, ui ) {
        const sw = [ ui.item.bbox[1], ui.item.bbox[0]  ];
        const ne = [ ui.item.bbox[3], ui.item.bbox[2]  ];
        map.fitBounds( [ne,sw] );
        reference_layer.clearLayers();
        reference_layer.addData( ui.item.geometry );
      },
      create: function () {
        $(this).data('ui-autocomplete')._renderItem = function (ul, item) {
            return $('<li>')
                .append('<a>' + item.properties.display_name + '</a>')
                .appendTo(ul);
        };
      }
  });
}

// MAP =========================================================================== //
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", 
{
  minZoom: 2,
  maxZoom: 18,
  attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
});

var googleSat = L.tileLayer(
  "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    attribution: "Google Maps",
  }
);

var googleStreets = L.tileLayer(
  "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    attribution: "Google Maps",
  }
);

var googleHybrid = L.tileLayer(
  "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    attribution: "Google Maps",
  }
);

var googleTerrain = L.tileLayer(
  "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    attribution: "Google Maps",
  }
);

var map = L.map("map", {
  center: [51.505, -0.09],
  zoom: 3,
  layers: [osm, googleHybrid],
  zoomControl: false,
  dragging: !L.Browser.mobile, //, tap: L.Browser.mobile
});
var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);

var centroid_layer = new L.geoJSON();
map.addLayer(centroid_layer);

var buffer_layer = new L.geoJSON();
map.addLayer(buffer_layer);

var reference_layer = new L.geoJSON(null, {
  style: function (feature) {
    return {
      weight: 3,
      opacity: 1,
      color: "orange",
      stroke: true,
      fillOpacity: 0,
    };
  },
});
map.addLayer(reference_layer);

var baseMaps = {
  OpenStreetMap: osm,
  "Google default view": googleStreets,
  "Google terrain": googleTerrain,
  "Google satellite": googleSat,
  "Google hybrid": googleHybrid,
};

L.control.layers(baseMaps, null, { position: "topright" }).addTo(map);
L.control.scale({ position: "bottomleft" }).addTo(map);
L.control.zoom({ position: "topleft" }).addTo(map);

var options = {
  position: "topleft",
  draw: {
    polygon: {
      allowIntersection: false,
      shapeOptions: {
        color: "#eb4936",
      },
      icon: new L.DivIcon({
        iconSize: new L.Point(10, 10),
        className: "leaflet-div-icon leaflet-editing-icon",
      }),
      touchIcon: new L.DivIcon({
        iconSize: new L.Point(10, 10),
        className: "leaflet-div-icon leaflet-editing-icon leaflet-touch-icon",
      }),
    },
    polyline: {
      allowIntersection: false,
      shapeOptions: {
        color: "#f357a1",
      },
      icon: new L.DivIcon({
        iconSize: new L.Point(10, 10),
        className: "leaflet-div-icon leaflet-editing-icon",
      }),
      touchIcon: new L.DivIcon({
        iconSize: new L.Point(10, 10),
        className: "leaflet-div-icon leaflet-editing-icon leaflet-touch-icon",
      }),
    },
    circle: true,
    circlemarker: false,
    rectangle: false,
    marker: false,
  },
  edit: {
    featureGroup: editableLayers,
    poly: {
      icon: new L.DivIcon({
        iconSize: new L.Point(10, 10),
        className: "leaflet-div-icon leaflet-editing-icon",
      }),
      touchIcon: new L.DivIcon({
        iconSize: new L.Point(10, 10),
        className: "leaflet-div-icon leaflet-editing-icon leaflet-touch-icon",
      }),
    },
  },
};

var drawControl = new L.Control.Draw(options);
map.addControl(drawControl);

var coordControl = L.control.coordinates({
  position: "bottomleft",
  enableUserInput: false,
  useLatLngOrder: true,
  labelTemplateLat: "Lat: {y}",
  labelTemplateLng: "Long: {x}",
});
map.addControl(coordControl);

// Map events ···································································· //
map.on(L.Draw.Event.CREATED, function (e) {
  var type = e.layerType;
  ui.clear_centroid_data();
  centroid_layer.clearLayers();
  buffer_layer.clearLayers();
  var layer = e.layer;
  editableLayers.addLayer(layer);
  editableLayers.bringToFront();
  if (type != "circle") {
    util.load_api_data(editableLayers, buffer_layer, centroid_layer, map);
  } else {
    ui.show_centroid_data(layer._latlng.lat, layer._latlng.lng, layer._mRadius);
    centroid_layer.addData(editableLayers.toGeoJSON());
  }
});

map.on(L.Draw.Event.EDITED, function (e) {
  centroid_layer.clearLayers();
  buffer_layer.clearLayers();
  if (
    editableLayers.toGeoJSON().features.length == 1 &&
    editableLayers.toGeoJSON().features[0].geometry.type == "Point"
  ) {
    for (var l in e.layers._layers) {
      var maybe_circle = e.layers._layers[l];
      ui.show_centroid_data(
        maybe_circle._latlng.lat,
        maybe_circle._latlng.lng,
        maybe_circle._mRadius
      );
      addPointCircleToMap(
        maybe_circle._latlng.lat,
        maybe_circle._latlng.lng,
        maybe_circle._mRadius
      );
    }
  } else {
    util.load_api_data(editableLayers, buffer_layer, centroid_layer, map);
  }
});

map.on(L.Draw.Event.DELETED, function (e) {
  clearAllGeometries();
});
const clearAllGeometries = function () {
  ui.clear_centroid_data();
  centroid_layer.clearLayers();
  buffer_layer.clearLayers();
  reference_layer.clearLayers();
  editableLayers.clearLayers();

  if (editableLayers.toGeoJSON().features.length > 0) {
    util.load_api_data(editableLayers, buffer_layer, centroid_layer, map);
    editableLayers.bringToFront();
  } else {
    resetDrawControls();
    $("#importWKT").show();
    $("#keyboardEdit").show();
  }
};

map.on(L.Draw.Event.DRAWSTART, function (e) {
  var type = e.layerType;
  if (editableLayers.toGeoJSON().features.length != 0) {
    if (
      type == "polygon" &&
      editableLayers.toGeoJSON().features[0].geometry.type == "Polygon"
    ) {
      hideLineDrawControl();
      hideCircleDrawControl();
    } else if (
      type == "polyline" &&
      editableLayers.toGeoJSON().features[0].geometry.type == "LineString"
    ) {
      hidePolyDrawControl();
      hideCircleDrawControl();
    } else if (
      type == "circle" &&
      editableLayers.toGeoJSON().features[0].geometry.type == "LineString"
    ) {
      hidePolyDrawControl();
      hideLineDrawControl();
      hideCircleDrawControl();
    } else {
      ui.clear_centroid_data();
      centroid_layer.clearLayers();
      buffer_layer.clearLayers();
      reference_layer.clearLayers();
      editableLayers.clearLayers();
    }
  } else {
    if (type == "polygon") {
      hideLineDrawControl();
      hideCircleDrawControl();
    } else if (type == "polyline") {
      hidePolyDrawControl();
      hideCircleDrawControl();
    } else if (type == "circle") {
      hidePolyDrawControl();
      hideLineDrawControl();
      hideCircleDrawControl();
    }
  }
  $("#keyboardEdit").hide();
  $("#importWKT").hide();
});

map.on(L.Draw.Event.DRAWSTOP, function (e) {
  var type = e.layerType;
  if (type == "circle") {
    $("#keyboardEdit").show();
  }
  if (editableLayers.toGeoJSON().features.length == 0) {
    resetDrawControls();
    $("#keyboardEdit").show();
    $("#importWKT").show();
  }
});

// Draw controls visibility handling
const hideLineDrawControl = function(){
  $(".leaflet-draw-draw-polyline").hide();
}

const hideCircleDrawControl = function(){
  $(".leaflet-draw-draw-circle").hide();
}

const hidePolyDrawControl = function(){
  $(".leaflet-draw-draw-polygon").hide();
}

const resetDrawControls = function(){
  $(".leaflet-draw-draw-polyline").show();
  $(".leaflet-draw-draw-polygon").show();
  $(".leaflet-draw-draw-circle").show();
}

// Nominatim handling
init_autocomplete(map, "place_search", reference_layer);
$("#importNominatim").on("click", function () {  importNominatim() });

// Keyboard point editting handling
$("#keyboardEdit").on("click", function(){ show_point_kb_box() });
const show_point_kb_box = function(){
  hideLineDrawControl();
  hidePolyDrawControl();
  hideCircleDrawControl();
  $("#keyboardLatitude").val($("#centroid_y").val());
  $("#keyboardLongitude").val($("#centroid_x").val());
  $("#keyboardUncertainty").val($("#radius_m").val());
  $("#controlKeyboard").show();
  $("#importWKT").hide();
  $("#keyboardLatitude").trigger("focus");
};

$("#keyboardCancel").on("click", function () {  cancel_point_kb_box() });
const cancel_point_kb_box = function() {
  if (editableLayers.getLayers().length == 0) {
    resetDrawControls();
    $("#importWKT").show();
  }
  $("#controlKeyboard").hide();
};

$("#keyboardOK").on("click", function () { process_point_kb_box() });

// Well-Known Text event handling
$("#importWKT").on("click", function() { show_wkt_box() });
const show_wkt_box = function(){
  hideLineDrawControl();
  hidePolyDrawControl();
  hideCircleDrawControl();
  $("#keyboardEdit").hide();
  $("#controlTextWKT").show();
  $("#infoDivBox").hide();
  $("#importWKT").hide();
  $("#textareaWKT").focus();
};

$("#cancelWKT").on("click", function(){ cancel_wkt_box() });
const cancel_wkt_box = function(){
  resetDrawControls();
  $("#controlTextWKT").hide();
  $("#keyboardEdit").show();
  $("#importWKT").show();
};

$("#okWKT").on("click", function () { process_wkt_box() });

// Keyboard shortcuts handling
// Keyboard shortcuts
// CTRL-H: Copy data with headers
// CTRL-C: Copy data without headers
// CTRL-W: Import WKT data
// CTRL-K: Enter data via keyboard
// CTRL-G: Put focus on Georeferenced by input field
// CTRL-M: Put focus on Georeferenced remarks input field
// CTRL-p or CTRL-P: Start drawing a polygon
// CTRL-l or CTRL-L: Start drawing a polyline
// CTRL-t or CTRL-T: Start drawing a circle
// CTRL-s or CTRL-S: Search Nominatim
// CTRL-i or CTRL-I: Import from Nominatim
// CTRL-d or CTRL-D: Delete all
// ESC: Closes div dialogs
$(document).on("keydown", function (event) {
  if (event.ctrlKey && event.key === 'h') {
    ui.do_copy_data(true);
  } else if (event.ctrlKey && event.key === 'c') {
    ui.do_copy_data(false);
  } else if (event.ctrlKey && event.key === 'w') {    
      show_wkt_box(); 
  } else if (event.ctrlKey && event.key === 'k') {
    show_point_kb_box();
  } else if (event.ctrlKey && event.key === 'g') {
    $("#georeferencer_name").trigger("focus");
  
  } else if (event.ctrlKey && event.key === 'm') {
    $("#georeference_remarks").trigger("focus");
  } else if (event.key === "Escape") {
    if ($("#controlTextWKT").is(":visible")) {
      resetDrawControls();
      $("#controlTextWKT").hide();
      $("#keyboardEdit").show();
      $("#importWKT").show();
    } else if ($("#controlKeyboard").is(":visible")) {
      resetDrawControls();
      $("#importWKT").show();
      $("#controlKeyboard").hide();
    }
  } else if (event.ctrlKey && (event.key === "l" || event.key === "L")) {
    new L.Draw.Polyline(map).enable();
    hideCircleDrawControl();
    hidePolyDrawControl();
  } else if (event.ctrlKey && (event.key === "p" || event.key === "P")) {
    new L.Draw.Polygon(map).enable();
    hideLineDrawControl();
    hideCircleDrawControl();
  } else if (event.ctrlKey && (event.key === "t" || event.key === "T")) {
    new L.Draw.Circle(map).enable();
    hideLineDrawControl();
    hidePolyDrawControl();
  } else if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
    $("#place_search").focus();
  } else if (event.ctrlKey && (event.key === "i" || event.key === "I")) {
    importNominatim();
  } else if (event.ctrlKey && (event.key === "d" || event.key === "D")) {
    if (editableLayers.toGeoJSON().features.length > 0) {
      if (confirm("Are you sure you want to clear all geometries?")) {
        clearAllGeometries();
      }
    }
  }
});

