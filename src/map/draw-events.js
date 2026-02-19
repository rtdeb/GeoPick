"use strict";

const $ = require("jquery");

/**
 * Register Leaflet draw/edit/delete event handlers.
 * Returns utility actions shared by other UI modules.
 */
const setupDrawEvents = function (deps) {
  const {
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
  } = deps;

  const clearAllGeometries = function () {
    info.clear_centroid_data();
    centroid_layer.clearLayers();
    mbc_layer.clearLayers();
    nominatim_layer.clearLayers();
    site_layer.clearLayers();
    info.enable_copy_button(false);

    if (site_layer.toGeoJSON().features.length > 0) {
      api.load_api_data(site_layer, mbc_layer, centroid_layer, map);
      site_layer.bringToFront();
    } else {
      drawControls.reset();
      $("#importWKT").show();
      $("#keyboardEdit").show();
    }
  };

  map.on(L.Draw.Event.CREATED, function (e) {
    const type = e.layerType;
    info.clear_centroid_data();
    centroid_layer.clearLayers();
    mbc_layer.clearLayers();

    const layer = e.layer;
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
      for (const l in e.layers._layers) {
        const maybe_circle = e.layers._layers[l];
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
      info.enable_copy_button(false);
    } else {
      api.load_api_data(site_layer, mbc_layer, centroid_layer, map);
      info.enable_copy_button(false);
    }
  });

  map.on(L.Draw.Event.DELETED, function () {
    clearAllGeometries();
  });

  map.on(L.Draw.Event.DRAWSTART, function (e) {
    const type = e.layerType;
    if (site_layer.toGeoJSON().features.length != 0) {
      if (
        type == "polygon" &&
        site_layer.toGeoJSON().features[0].geometry.type == "Polygon"
      ) {
        drawControls.hideLine();
        drawControls.hideCircle();
      } else if (
        type == "polyline" &&
        site_layer.toGeoJSON().features[0].geometry.type == "LineString"
      ) {
        drawControls.hidePolygon();
        drawControls.hideCircle();
      } else if (
        type == "circle" &&
        site_layer.toGeoJSON().features[0].geometry.type == "LineString"
      ) {
        drawControls.hidePolygon();
        drawControls.hideLine();
        drawControls.hideCircle();
      } else {
        info.clear_centroid_data();
        centroid_layer.clearLayers();
        mbc_layer.clearLayers();
        nominatim_layer.clearLayers();
        site_layer.clearLayers();
      }
    } else {
      if (type == "polygon") {
        drawControls.hideLine();
        drawControls.hideCircle();
      } else if (type == "polyline") {
        drawControls.hidePolygon();
        drawControls.hideCircle();
      } else if (type == "circle") {
        drawControls.hidePolygon();
        drawControls.hideLine();
        drawControls.hideCircle();
      }
    }
    $("#keyboardEdit").hide();
    $("#importWKT").hide();
  });

  map.on(L.Draw.Event.DRAWSTOP, function (e) {
    const type = e.layerType;
    if (type == "circle") {
      $("#keyboardEdit").show();
      $("#locality_description").trigger("focus");
    }
    if (site_layer.toGeoJSON().features.length == 0) {
      drawControls.reset();
      $("#keyboardEdit").show();
      $("#importWKT").show();
    }
  });

  return {
    clearAllGeometries,
  };
};

module.exports = {
  setupDrawEvents,
};
