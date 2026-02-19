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
require("leaflet-bing-layer");
require("./index.css");
require("./mystyle.scss");
require("jquery-ui/ui/widgets/autocomplete");
const { parseFromWK } = require("wkt-parser-helper");
const info = require("./info");
const api = require("./api");
const urlparams = require("./urlparams");
const cookies = require("./cookies");
const drawControls = require("./map/draw-controls");
const { setupDrawEvents } = require("./map/draw-events");
const { setupImportControls } = require("./map/import-controls");
const { setupShortcuts } = require("./map/shortcuts");
const { setupInteractionControls } = require("./map/interaction-controls");
const { setupShareControls } = require("./map/share-controls");
// const bing_api_key = process.env.BING_API_KEY;
const base_app_url = process.env.BASE_APP_URL;

// TOGGLE INFO BOX ======================================================== //
document.addEventListener("DOMContentLoaded", function () {
  const info = document.getElementById("info");
  const toggleButton = document.getElementById("toggleButton");

  toggleButton.addEventListener("click", function () {
    info.classList.toggle("unfolded");
  });

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const action = urlparams.urlParamsActions(urlParams);
  if (action.status != "KO") {
    if (action.opcode === urlparams.opcodes.OPCODE_LATLONUNC) {
      addPointCircleToMap(
        action.params.lat,
        action.params.lon,
        action.params.unc
      );
      window.history.pushState({}, document.title, "/" + base_app_url);
    } else if (action.opcode === urlparams.opcodes.OPCODE_SHARE) {
      api.load_share(
        action.params.locationid,
        site_layer,
        mbc_layer,
        centroid_layer,
        map
      );
      window.history.pushState({}, document.title, "/" + base_app_url);
    }
  }
});

var coll = document.getElementsByClassName("collapsible");
var i;
for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function () {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
}
// FUNCTIONS ===================================================================== //
const addPointCircleToMap = function (lat, long, radius) {
  info.clear_centroid_data();
  centroid_layer.clearLayers();
  mbc_layer.clearLayers();
  nominatim_layer.clearLayers();
  const circle = L.circle([lat, long], radius, {
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

const setVisibleAreaAroundCircle = function (circle) {
  map.fitBounds(circle.getBounds());
};

// MAP =========================================================================== //
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  minZoom: 2,
  maxZoom: 18,
  attribution:
    'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
});

// Bing layers intentionally disabled for local testing.
// var bing_aerial = L.tileLayer.bing({
//   bingMapsKey: bing_api_key,
// });
//
// var bing_aerial_labels = L.tileLayer.bing({
//   bingMapsKey: bing_api_key,
//   imagerySet: "AerialWithLabels",
// });
//
// var bing_roads = L.tileLayer.bing({
//   bingMapsKey: bing_api_key,
//   imagerySet: "Road",
// });
//
// var bing_roads_dark = L.tileLayer.bing({
//   bingMapsKey: bing_api_key,
//   imagerySet: "CanvasDark",
// });

var map = L.map("map", {
  center: [51.505, -0.09],
  zoom: 3,
  layers: [osm],
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
  // "Bing Aerial": bing_aerial,
  // "Bing Aerial+roads": bing_aerial_labels,
  // "Bing Roads": bing_roads,
  // "Bing Roads dark": bing_roads_dark,
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

var div = L.DomUtil.get("place_search");
L.DomEvent.on(div, "mousewheel", L.DomEvent.stopPropagation);
L.DomEvent.on(div, "mousedown", L.DomEvent.stopPropagation);
L.DomEvent.on(div, "click", L.DomEvent.stopPropagation);
L.DomEvent.on(div, "dblclick", L.DomEvent.stopPropagation);

const drawEvents = setupDrawEvents({
  L,
  map,
  info,
  api,
  drawControls,
  site_layer,
  centroid_layer,
  mbc_layer,
  nominatim_layer,
  addPointCircleToMap,
});

const importControls = setupImportControls({
  parseFromWK,
  map,
  drawControls,
  info,
  api,
  site_layer,
  nominatim_layer,
  mbc_layer,
  centroid_layer,
  addPointCircleToMap,
});

$("#copy_link").on("click", function () {
  info.copy_share_link($("#share_link").text());
});

const interactionControls = setupInteractionControls({
  drawControls,
  site_layer,
  clearAllGeometries: drawEvents.clearAllGeometries,
  process_point_kb_box: importControls.process_point_kb_box,
  process_wkt_box: importControls.process_wkt_box,
});

const do_share = function (withHeaders) {
  const geodata = $("#d_geojson").val();
  if (
    (geodata === null || geodata === "") &&
    centroid_layer.toGeoJSON().features.length == 0
  ) {
    info.dialogError("Nothing to share!", 3000);
    return;
  }
  if ($("#location_id").val() != "") {
    info.do_copy_data(withHeaders, true);
  } else {
    const locationid = info.generate_location_id();
    info.set_location_id(locationid);
    info.set_share_link(locationid);
    const ui_data = info.get_ui_data(true);
    ui_data.sec_representation = mbc_layer.toGeoJSON().features;
    api.write_share(ui_data, locationid, map, withHeaders);
  }
};

const shareControls = setupShareControls({
  info,
  do_share,
});

setupShortcuts({
  L,
  map,
  drawControls,
  info,
  site_layer,
  clearAllGeometries: drawEvents.clearAllGeometries,
  importNominatim: importControls.importNominatim,
  show_wkt_box: interactionControls.show_wkt_box,
  show_point_kb_box: interactionControls.show_point_kb_box,
  handle_copy_data: shareControls.handle_copy_data,
});
