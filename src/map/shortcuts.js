"use strict";

const $ = require("jquery");

/**
 * Register global keyboard shortcuts.
 * Keeps legacy key mappings and side effects unchanged.
 */
const setupShortcuts = function (deps) {
  const {
    L,
    map,
    drawControls,
    info,
    site_layer,
    clearAllGeometries,
    importNominatim,
    show_wkt_box,
    show_point_kb_box,
    handle_copy_data,
  } = deps;

  $(document).on("keydown", function (event) {
    if (event.ctrlKey && event.key === "h") {
      handle_copy_data(true);
    } else if (event.ctrlKey && event.key === "f") {
      $("#toggleButton").trigger("click");
    } else if (event.ctrlKey && event.key === "c") {
      handle_copy_data(false);
    } else if (event.ctrlKey && event.key === "w") {
      show_wkt_box();
    } else if (event.ctrlKey && event.key === "k") {
      show_point_kb_box();
    } else if (event.ctrlKey && event.key === "g") {
      $("#georeferencer_name").trigger("focus");
    } else if (event.ctrlKey && event.key === "m") {
      $("#georeference_remarks").trigger("focus");
    } else if (event.key === "Escape") {
      if ($("#controlTextWKT").is(":visible")) {
        drawControls.reset();
        $("#controlTextWKT").hide();
        $("#keyboardEdit").show();
        $("#importWKT").show();
      } else if ($("#controlKeyboard").is(":visible")) {
        drawControls.reset();
        $("#importWKT").show();
        $("#controlKeyboard").hide();
      } else if ($("#deleteGeometries").is(":visible")) {
        $("#deleteGeometries").hide();
      }
    } else if (event.ctrlKey && (event.key === "l" || event.key === "L")) {
      new L.Draw.Polyline(map).enable();
      drawControls.hideCircle();
      drawControls.hidePolygon();
    } else if (event.ctrlKey && (event.key === "p" || event.key === "P")) {
      new L.Draw.Polygon(map).enable();
      drawControls.hideLine();
      drawControls.hideCircle();
    } else if (event.ctrlKey && (event.key === "t" || event.key === "T")) {
      clearAllGeometries();
      new L.Draw.Circle(map).enable();
      drawControls.hideLine();
      drawControls.hidePolygon();
    } else if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
      $("#place_search").focus();
    } else if (event.ctrlKey && (event.key === "i" || event.key === "I")) {
      importNominatim();
    } else if (event.ctrlKey && (event.key === "d" || event.key === "D")) {
      if (site_layer.toGeoJSON().features.length > 0) {
        $("#deleteGeometries").show();
        $("#yesDeleteGeometries").trigger("focus");
      }
    } else if (event.ctrlKey && (event.key === "b" || event.key === "B")) {
      info.copy_latest_search($("#latest_search_hidden").val());
    }
  });
};

module.exports = {
  setupShortcuts,
};
