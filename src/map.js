// This script contains functionality related to the map
// There are three layers of geometries to be considered:
// - site_layer: the layer of the digitised site
// - mbc_layer: the calculated smallest enclosing circle containing the site_layer
// - centroid_layer: the layer containing the calculated centroid
// - nominatim_layer: the geometry from a Nominatim search

// Sites represented by lines or polygons rely on a call to the API while sites 
// represented by a point and a circle of uncertainty are solved at the client side.

const L = require("leaflet");
const $ = require("jquery");
require("leaflet-draw");
require("leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.min");
require("leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css");
require("leaflet-defaulticon-compatibility");
require("leaflet/dist/leaflet.css");
require("leaflet-draw/dist/leaflet.draw.css");
require("leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.css");
require('leaflet-bing-layer');
require("./index.css");
require("./mystyle.scss");
require('jquery-ui/ui/widgets/autocomplete');

const { parseFromWK } = require("wkt-parser-helper");
const info = require("./info");
const api = require("./api");
const bing_api_key = process.env.BING_API_KEY;

// TOGGLE INFO BOX ======================================================== //
document.addEventListener("DOMContentLoaded", function() {
  const info = document.getElementById("info");
  const toggleButton = document.getElementById("toggleButton");

  toggleButton.addEventListener("click", function() {
    info.classList.toggle("unfolded");
  });
});

var coll = document.getElementsByClassName("collapsible");
var i;
for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    } 
  });
}
// FUNCTIONS ===================================================================== //
const importNominatim = function () {
  if (nominatim_layer.toGeoJSON().features.length == 0) {
    info.toast_error("Nothing to import! Please select a location.");
  } else {
    type = nominatim_layer.toGeoJSON().features[0].geometry.type;
    if (type == "Point") {
      hideLineDrawControl();
      hidePolyDrawControl();
      hideCircleDrawControl();
      coordinates =
        nominatim_layer.toGeoJSON().features[0].geometry.coordinates;
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
      api.promote_reference_to_editable(
        site_layer,
        nominatim_layer,
        mbc_layer,
        centroid_layer,
        map
      );
    }
    $("#importWKT").hide();
  }
};

const addPointCircleToMap = function (lat, long, radius) {
  info.clear_centroid_data();
  centroid_layer.clearLayers();
  mbc_layer.clearLayers();
  nominatim_layer.clearLayers();
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
  site_layer.clearLayers();
  site_layer.addLayer(circle);
  centroid_layer.addData(site_layer.toGeoJSON());
  info.show_centroid_data(lat, long, radius);
  setVisibleAreaAroundCircle(circle);
};

setVisibleAreaAroundCircle = function (circle) {
  map.fitBounds(circle.getBounds());
};

const process_wkt_box = function(){
  wkt = $("#textareaWKT").val();
  geojson = parseFromWK(wkt);
  if (geojson === null) {
    $("#infoDivBox").show();
    $("#errorWKT").val("ERROR: Malformed WKT. Please check and try again.");
  } else if (geojson.type == "MultiPoint") {
    alert(
      "MULTIPOINT, MULTIPOLYGON with holes, and GEOMETRYCOLLECTION types are not supported."
    );
  } else {
    nominatim_layer.clearLayers();
    nominatim_layer.addData(geojson);

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
      api.promote_reference_to_editable(
        site_layer,
        nominatim_layer,
        mbc_layer,
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

const init_autocomplete = function(map, input_id, nominatim_layer){
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
        nominatim_layer.clearLayers();
        nominatim_layer.addData( ui.item.geometry );     
        $("#latest_search_hidden").val(ui.item.properties.display_name);   
        if(ui.item.properties.display_name.length > 32){
          $("#latest_search").text(ui.item.properties.display_name.substr(0,32) + " ..."); 
        } else {
          $("#latest_search").text(ui.item.properties.display_name); 
        }
        
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

var bing_aerial = L.tileLayer.bing(
  {
      'bingMapsKey':bing_api_key
  }
);

var bing_aerial_labels = L.tileLayer.bing(
  {
      'bingMapsKey':bing_api_key,
      'imagerySet':'AerialWithLabels'
  }
);

var bing_roads = L.tileLayer.bing(
  {
      'bingMapsKey':bing_api_key,
      'imagerySet':'Road'
  }
);

var bing_roads_dark = L.tileLayer.bing(
  {
      'bingMapsKey':bing_api_key,
      'imagerySet':'CanvasDark'
  }
);

var map = L.map("map", {
  center: [51.505, -0.09],
  zoom: 3,  
  layers: [bing_aerial_labels],
  zoomControl: false,
  dragging: !L.Browser.mobile, 
});
var site_layer = new L.FeatureGroup();
map.addLayer(site_layer);

var centroid_layer = new L.geoJSON();
map.addLayer(centroid_layer);

var mbc_layer = new L.geoJSON();
map.addLayer(mbc_layer);

var nominatim_layer = new L.geoJSON(null, {
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
map.addLayer(nominatim_layer);

var baseMaps = {
  OpenStreetMap: osm,
  "Bing Aerial": bing_aerial,
  "Bing Aerial+roads": bing_aerial_labels,
  "Bing Roads": bing_roads,
  "Bing Roads dark": bing_roads_dark,
};

L.control.layers(baseMaps, null, { position: "topleft" }).addTo(map);
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
    featureGroup: site_layer,
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

var div = L.DomUtil.get('place_search');
L.DomEvent.on(div, 'mousewheel', L.DomEvent.stopPropagation);
L.DomEvent.on(div, 'mousedown', L.DomEvent.stopPropagation);
L.DomEvent.on(div, 'click', L.DomEvent.stopPropagation);
L.DomEvent.on(div, 'dblclick', L.DomEvent.stopPropagation);

// Map events ···································································· //
map.on(L.Draw.Event.CREATED, function (e) {
  var type = e.layerType;
  info.clear_centroid_data();
  centroid_layer.clearLayers();
  mbc_layer.clearLayers();
  var layer = e.layer;
  site_layer.addLayer(layer);
  site_layer.bringToFront();
  if (type != "circle") {
    api.load_api_data(site_layer, mbc_layer, centroid_layer, map);
  } else {
    info.show_centroid_data(layer._latlng.lat, layer._latlng.lng, layer._mRadius);
    centroid_layer.addData(site_layer.toGeoJSON());
  }
});

map.on(L.Draw.Event.EDITED, function (e) {
  centroid_layer.clearLayers();
  mbc_layer.clearLayers();
  if (
    site_layer.toGeoJSON().features.length == 1 &&
    site_layer.toGeoJSON().features[0].geometry.type == "Point"
  ) {
    for (var l in e.layers._layers) {
      var maybe_circle = e.layers._layers[l];
      info.show_centroid_data(
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
    api.load_api_data(site_layer, mbc_layer, centroid_layer, map);
  }
});

map.on(L.Draw.Event.DELETED, function (e) {
  clearAllGeometries();
});
const clearAllGeometries = function () {
  info.clear_centroid_data();
  centroid_layer.clearLayers();
  mbc_layer.clearLayers();
  nominatim_layer.clearLayers();
  site_layer.clearLayers();

  if (site_layer.toGeoJSON().features.length > 0) {
    api.load_api_data(site_layer, mbc_layer, centroid_layer, map);
    site_layer.bringToFront();
  } else {
    resetDrawControls();
    $("#importWKT").show();
    $("#keyboardEdit").show();
  }
};

map.on(L.Draw.Event.DRAWSTART, function (e) {
  var type = e.layerType;
  if (site_layer.toGeoJSON().features.length != 0) {
    if (
      type == "polygon" &&
      site_layer.toGeoJSON().features[0].geometry.type == "Polygon"
    ) {
      hideLineDrawControl();
      hideCircleDrawControl();
    } else if (
      type == "polyline" &&
      site_layer.toGeoJSON().features[0].geometry.type == "LineString"
    ) {
      hidePolyDrawControl();
      hideCircleDrawControl();
    } else if (
      type == "circle" &&
      site_layer.toGeoJSON().features[0].geometry.type == "LineString"
    ) {
      hidePolyDrawControl();
      hideLineDrawControl();
      hideCircleDrawControl();
    } else {
      info.clear_centroid_data();
      centroid_layer.clearLayers();
      mbc_layer.clearLayers();
      nominatim_layer.clearLayers();
      site_layer.clearLayers();
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
  if (site_layer.toGeoJSON().features.length == 0) {
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
init_autocomplete(map, "place_search", nominatim_layer);
$("#importNominatim").on("click", function () {  importNominatim() });

//Copying latest search on Nominatim
$("#latest_search_copy").on("click", function() {
    info.copy_latest_search($("#latest_search_hidden").val());
 });

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
  if (site_layer.getLayers().length == 0) {
    resetDrawControls();
    $("#importWKT").show();
  }
  $("#controlKeyboard").hide();
};

$("#keyboardOK").on("click", function () { process_point_kb_box() });

// Delete geometries box
$("#cancelDeleteGeometries").on("click", function(){ 
  $("#deleteGeometries").hide();
  // deleteGeometries.style.display = 'none';
});
$("#yesDeleteGeometries").on("click", function(){ 
  clearAllGeometries();
  $("#deleteGeometries").hide();  
});


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
    handle_copy_data(true); 
  } else if (event.ctrlKey && event.key === 'f') {
    $("#toggleButton").trigger("click");
  } else if (event.ctrlKey && event.key === 'c') {
    handle_copy_data(false);
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
    } else if ($("#deleteGeometries").is(":visible")) {
      $("#deleteGeometries").hide();
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
    clearAllGeometries();
    new L.Draw.Circle(map).enable();
    hideLineDrawControl();
    hidePolyDrawControl();
  } else if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
    $("#place_search").focus();
  } else if (event.ctrlKey && (event.key === "i" || event.key === "I")) {
    importNominatim();
  } else if (event.ctrlKey && (event.key === "d" || event.key === "D")) {
    if (site_layer.toGeoJSON().features.length > 0) {
        $('#deleteGeometries').show();
        $('#yesDeleteGeometries').focus();
    }
  } else if (event.ctrlKey && (event.key === "b" || event.key === "B")){
    info.copy_latest_search($("#latest_search_hidden").val());
  }
});

// Checking WKT and handling data copying when WKT is too big
const wktSize = function(){
  wkt = $('#d_geojson').val();
  if(wkt.length >= 32767){
    return wkt.length;
  } else {
    return null;
  }
}

$("#cpdata").on("click", function(){
  handle_copy_data(true);
});

$("#cpdatanh").on("click", function(){
  handle_copy_data(false);
});

const handle_copy_data = function(withHeaders){
  wkt_length = wktSize();
  if(wkt_length != null){    
    showModal(withHeaders, wkt_length);
  } else {
    info.do_copy_data(withHeaders, true);
  }

}

// Return a number with space as thousands separator
const format = function(num){
  let nf = new Intl.NumberFormat('en-US');
  s = nf.format(num); 
  s = s.replace(/,/g, " ");
  return s;
  // This regular expression did the same but is unsupported by Safari
  // return String(num).replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1 ');
}

  // Get the modal element
  const modal = document.getElementById('wkt_limit_box_modal');

  // Function to display the modal
  function showModal(withHeaders, wkt_length) {
    modal.style.display = 'block';
    message = "WARNING!\nThe size of this WKT is " + format(wkt_length) + " characters long. Usually spreadsheet applications have a limit on the maximum number of characters that are allowed per cell (e.g., Microsoft Excel: 32 767, Google Sheets: 50 000).\nDo you still want to copy the data including the WKT?"
    document.getElementById('wkt_length_text').innerText = message;
    modal.setAttribute('withHeaders', withHeaders);
    document.getElementById('doNotCopyWKT').focus();
  }

  // Function to handle the "Yes" button click
  $("#doCopyWKT").on("click", function () {     
    const withHeaders = JSON.parse(modal.getAttribute('withHeaders'));
    info.do_copy_data(withHeaders, true)
    closeModal();

  });
  
  // Function to handle the "No" button click
  $("#doNotCopyWKT").on("click", function () {     
    const withHeaders = JSON.parse(modal.getAttribute('withHeaders'));
    info.do_copy_data(withHeaders, false)
    closeModal();
  });

  // Function to close the modal
  function closeModal() {
    modal.style.display = 'none';
  }

  // Close the modal if the user clicks outside of it
  // window.onclick = function(event) {
  //   if (event.target === modal) {
  //     closeModal();
  //   }
  // };
