"use strict";

const $ = require("jquery");

/**
 * Register import-related controls and expose import actions.
 * Includes Nominatim autocomplete/import and WKT/keyboard point parsing.
 */
const setupImportControls = function (deps) {
  const {
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
  } = deps;

  const importNominatim = function () {
    if (nominatim_layer.toGeoJSON().features.length == 0) {
      const message = "Nothing to import! Please select a location.";
      info.dialogError(message, 3000);
    } else {
      const type = nominatim_layer.toGeoJSON().features[0].geometry.type;
      if (type == "Point") {
        drawControls.hideLine();
        drawControls.hidePolygon();
        drawControls.hideCircle();
        const coordinates = nominatim_layer.toGeoJSON().features[0].geometry.coordinates;
        addPointCircleToMap(coordinates[1], coordinates[0], null);
      } else {
        if (type == "LineString" || type == "MultiLineString") {
          drawControls.hidePolygon();
          drawControls.hideCircle();
        } else if (type == "Polygon" || type == "MultiPolygon") {
          drawControls.hideLine();
          drawControls.hideCircle();
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
      info.enable_copy_button(false);
      $("#locality_description").val("Nominatim: " + $("#latest_search_hidden").val());
      $("#georeferencer_name").trigger("focus");
    }
  };

  const process_wkt_box = function () {
    const wkt = $("#textareaWKT").val();
    const geojson = parseFromWK(wkt);
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

  const process_point_kb_box = function () {
    const lat = parseFloat($("#keyboardLatitude").val());
    const lng = parseFloat($("#keyboardLongitude").val());
    let unc = $("#keyboardUncertainty").val();
    if (unc == "") {
      unc = null;
    } else {
      unc = parseFloat(unc);
    }

    addPointCircleToMap(lat, lng, unc);
    $("#controlKeyboard").hide();
  };

  const init_autocomplete = function () {
    $("#place_search").autocomplete({
      source: function (request, response) {
        $.ajax({
          url: "https://nominatim.openstreetmap.org/search",
          data: {
            q: request.term,
            format: "geojson",
            polygon_geojson: 1,
          },
          success: function (data) {
            const results = $.map(data.features, function (item) {
              return item;
            });
            response(results);
          },
        });
      },
      minLength: 2,
      select: function (event, ui) {
        const sw = [ui.item.bbox[1], ui.item.bbox[0]];
        const ne = [ui.item.bbox[3], ui.item.bbox[2]];
        map.fitBounds([ne, sw]);
        nominatim_layer.clearLayers();
        nominatim_layer.addData(ui.item.geometry);
        $("#latest_search_hidden").val(ui.item.properties.display_name);
        if (ui.item.properties.display_name.length > 32) {
          $("#latest_search").text(ui.item.properties.display_name.substr(0, 32) + " ...");
        } else {
          $("#latest_search").text(ui.item.properties.display_name);
        }
        info.clear_centroid_data();
      },
      create: function () {
        $(this).data("ui-autocomplete")._renderItem = function (ul, item) {
          return $("<li>")
            .append("<a>" + item.properties.display_name + "</a>")
            .appendTo(ul);
        };
      },
    });
  };

  init_autocomplete();

  $("#importNominatim").on("click", function () {
    importNominatim();
  });

  $("#latest_search_copy").on("click", function () {
    info.copy_latest_search($("#latest_search_hidden").val());
  });

  return {
    importNominatim,
    process_wkt_box,
    process_point_kb_box,
  };
};

module.exports = {
  setupImportControls,
};
