"use strict";

const $ = require("jquery");

/** Hide the polyline draw control button. */
const hideLine = function () {
  $(".leaflet-draw-draw-polyline").hide();
};

/** Hide the circle draw control button. */
const hideCircle = function () {
  $(".leaflet-draw-draw-circle").hide();
};

/** Hide the polygon draw control button. */
const hidePolygon = function () {
  $(".leaflet-draw-draw-polygon").hide();
};

/** Show all draw control buttons. */
const reset = function () {
  $(".leaflet-draw-draw-polyline").show();
  $(".leaflet-draw-draw-polygon").show();
  $(".leaflet-draw-draw-circle").show();
};

module.exports = {
  hideLine,
  hideCircle,
  hidePolygon,
  reset,
};
