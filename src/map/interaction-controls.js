"use strict";

const $ = require("jquery");

/**
 * Register click handlers for keyboard/WKT/delete UI controls.
 */
const setupInteractionControls = function (deps) {
  const {
    drawControls,
    site_layer,
    clearAllGeometries,
    process_point_kb_box,
    process_wkt_box,
  } = deps;

  const show_point_kb_box = function () {
    drawControls.hideLine();
    drawControls.hidePolygon();
    drawControls.hideCircle();
    $("#keyboardLatitude").val($("#centroid_y").val());
    $("#keyboardLongitude").val($("#centroid_x").val());
    $("#keyboardUncertainty").val($("#radius_m").val());
    $("#controlKeyboard").show();
    $("#importWKT").hide();
    $("#keyboardLatitude").trigger("focus");
  };

  const cancel_point_kb_box = function () {
    if (site_layer.getLayers().length == 0) {
      drawControls.reset();
      $("#importWKT").show();
    }
    $("#controlKeyboard").hide();
  };

  const show_wkt_box = function () {
    drawControls.hideLine();
    drawControls.hidePolygon();
    drawControls.hideCircle();
    $("#keyboardEdit").hide();
    $("#controlTextWKT").show();
    $("#infoDivBox").hide();
    $("#importWKT").hide();
    $("#textareaWKT").focus();
  };

  const cancel_wkt_box = function () {
    drawControls.reset();
    $("#controlTextWKT").hide();
    $("#keyboardEdit").show();
    $("#importWKT").show();
  };

  $("#keyboardEdit").on("click", function () {
    show_point_kb_box();
  });
  $("#keyboardCancel").on("click", function () {
    cancel_point_kb_box();
  });
  $("#keyboardOK").on("click", function () {
    process_point_kb_box();
  });

  $("#cancelDeleteGeometries").on("click", function () {
    $("#deleteGeometries").hide();
  });
  $("#yesDeleteGeometries").on("click", function () {
    clearAllGeometries();
    $("#deleteGeometries").hide();
  });

  $("#importWKT").on("click", function () {
    show_wkt_box();
  });
  $("#cancelWKT").on("click", function () {
    cancel_wkt_box();
  });
  $("#okWKT").on("click", function () {
    process_wkt_box();
  });

  return {
    show_point_kb_box,
    show_wkt_box,
  };
};

module.exports = {
  setupInteractionControls,
};
