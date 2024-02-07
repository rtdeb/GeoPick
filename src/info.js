// This script contains functionality related to the info side panel plus notification functions

const $ = require("jquery");
const ui = require("jquery-ui/ui/widgets/dialog");
const jq_confirm = require("jquery-confirm");
const p = require("../package.json");
const moment = require("moment");
const { convertToWK } = require("wkt-parser-helper");
const base_app_url = process.env.BASE_APP_URL;

// const map = require("./map");

const headers = [
  "locationID",
  "locality",
  "decimalLatitude",
  "decimalLongitude",
  "geodeticDatum",
  "coordinateUncertaintyInMeters",
  "coordinatePrecision",
  "pointRadiusSpatialFit",
  "footprintWKT",
  "footprintSRS",
  "footprintSpatialFit",
  "georeferencedBy",
  "georeferencedDate",
  "georeferenceProtocol",
  "georeferenceSources",
  "georeferenceRemarks",
  "shareLink",
];

const controls = [
  "centroid_x",
  "centroid_y",
  "radius_m",
  "d_geojson",
  "spatial_fit",
];

const generate_location_id = function () {
  const version = "v" + p.version;
  const time_utc = moment().utc().format('YYYY-MM-DDTHH-mm-ss.SSS') + 'Z';
  const salt = Math.floor(Math.random() * 1000);
  const location_template = `geopick-${version}-${time_utc}-${salt}`;
  return location_template;
};

const set_location_id = function (locationid) {
  $("#location_id").val(locationid);
};

const set_share_link = function (locationid) {
  if (locationid != "") {
    const base_url = base_app_url === '' || base_app_url === null ? "/" : "/" + base_app_url;
    $("#georeference_url").val(      
      window.location.origin + base_url + "?locationid=" + locationid
    );
  } else {
    $("#georeference_url").val("");
  }
};

const empty_controls = function () {
  for (c in controls) {
    if (
      $("#" + controls[c])
        .val()
        .trim() != ""
    ) {
      return false;
    }
  }
  return true;
};

const enable_validate_button = function (yesorno) {
  if (yesorno == true) {
    $("#validate_button_container").removeClass("disabled-div");
  } else {
    $("#validate_button_container").addClass("disabled-div");
  }
};

const enable_copy_button = function (yesorno) {
  if (yesorno == true) {
    $("#copy_buttons_container").removeClass("disabled-div");
    $("#cpdata").trigger("focus");
  } else {
    $("#copy_buttons_container").addClass("disabled-div");
  }
};

const clear_centroid_data = function () {
  controls.forEach(function (e) {
    $("#" + e).val("");
  });
  $("#locality_description").val("");
  // $('#georefeerncer_name').val('');
  $("#georeference_remarks").val("");
  $("#location_id").val("");
  $("#georeference_url").val("");
};

const format_georef_data = function (georef_data) {
  var template = `${georef_data.locationID}\t${georef_data.locality}\t${georef_data.decimalLatitude}\t${georef_data.decimalLongitude}\tepsg:4326\t${georef_data.coordinateUncertaintyInMeters}\t0.0000001\t${georef_data.pointRadiusSpatialFit}\t${georef_data.footprintWKT}\tepsg:4326\t${georef_data.footprintSpatialFit}\t${georef_data.georeferencedBy}\t${georef_data.georeferencedDate}\tGeoreferencing Quick Reference Guide (Zermoglio et al. 2020, https://doi.org/10.35035/e09p-h128)\t${georef_data.georeferenceSources}\t${georef_data.georeferenceRemarks}\t${georef_data.shareLink}`;
  return template;
};

const get_ui_data = function (yes_wkt) {
  let centroid_x = $("#centroid_x").val();
  let centroid_y = $("#centroid_y").val();
  let radius_m = $("#radius_m").val();
  let wkt = "";
  if (yes_wkt) {
    if ($("#d_geojson").val() == "") {
      wkt = "POINT (" + centroid_x + " " + centroid_y + ")";
    } else {
      wkt = $("#d_geojson").val();
    }
  }
  let date = new Date().toISOString();
  let pointRadiusSpatialFit = $("#spatial_fit").val();
  let footprintSpatialFit = 1;
  if (wkt.includes("LINESTRING") || wkt.includes("POINT")) {
    footprintSpatialFit = "";
  }
  let source_string = p.name + " v." + p.version;

  let georeferencer_name = $("#georeferencer_name").val();
  let georeference_remarks = $("#georeference_remarks").val();
  let locality = $("#locality_description").val();
  let link = $("#georeference_url").val();
  let locationid = $("#location_id").val();
  return {
    locationID: locationid,
    locality: locality,
    decimalLatitude: centroid_y,
    decimalLongitude: centroid_x,
    geodeticDatum: "EPSG:4326",
    coordinateUncertaintyInMeters: radius_m,
    coordinatePrecision: 0.0000001,
    pointRadiusSpatialFit: pointRadiusSpatialFit,
    footprintWKT: wkt,
    footprintSRS: "EPSG:4326",
    footprintSpatialFit: footprintSpatialFit,
    georeferencedBy: georeferencer_name,
    georeferencedDate: date,
    georeferenceProtocol:
      "Georeferencing Quick Reference Guide (Zermoglio et al. 2020, https://doi.org/10.35035/e09p-h128)",
    georeferenceSources: source_string,
    georeferenceRemarks: georeference_remarks,
    shareLink: link,
  };
};

const show_textual_data = function (parsed_json) {
  $("#locality_description").val(parsed_json.locality);
  $("#georeferencer_name").val(parsed_json.georeferencer_name);
  $("#georeference_remarks").val(parsed_json.georeference_remarks);
};

const do_copy_data = function (yes_headers, yes_wkt) {
  if (empty_controls()) {
    dialogWarning("Nothing to copy!");
    return;
  }

  const georef_data = get_ui_data(yes_wkt);
  var string_template = format_georef_data(georef_data);

  if (yes_headers) {
    navigator.clipboard.writeText(headers.join("\t") + "\n" + string_template);
  } else {
    navigator.clipboard.writeText(string_template);
  }
  dialogSuccess("Data copied to clipboard!");
};

const copy_latest_search = function (latest_search) {
  navigator.clipboard.writeText(latest_search);
  dialogSuccess("Latest search copied to clipboard!");
};

const copy_share_link = function (share_link) {
  navigator.clipboard.writeText(share_link);
  dialogSuccess("Share link copied to clipboard!");
};

const show_api_centroid_data_wkt = function (parsed_json, wkt) {
  geometry = parsed_json.centroid.geometry.features[0].geometry;
  $("#centroid_x").val(geometry.coordinates[0].toFixed(7));
  $("#centroid_y").val(geometry.coordinates[1].toFixed(7));

  $("#radius_m").val(parsed_json.uncertainty);

  $("#spatial_fit").val(parsed_json.spatial_fit);

  $("#d_geojson").val(wkt);
};

const show_api_centroid_data = function (parsed_json, geom) {
  geometry = parsed_json.centroid.geometry.features[0].geometry;
  $("#centroid_x").val(geometry.coordinates[0].toFixed(7));
  $("#centroid_y").val(geometry.coordinates[1].toFixed(7));

  $("#radius_m").val(parsed_json.uncertainty);

  $("#spatial_fit").val(parsed_json.spatial_fit);

  /* The following if code is cumbersome in order to deal with inconsistencies in the geom variable between lines and polygons. For lines we needed to build the MULTILINESTRING wkt ourselves beacause the convertToWK did not like. When lines, geom arrives as an array of LINESTRINGs instead of a MULTILINESTRING, while for polygons, geom already arrives as MULTIPOLYGON, and, in this latter case, convertToWK works.
   */
  if (geom.length == 1) {
    wkt = convertToWK(geom[0]);
  } else {
    if (typeof geom.type == "undefined") {
      if (geom[0].geometry.type == "LineString") {
        const coordinates = geom
          .map(
            (geom) =>
              "(" +
              geom.geometry.coordinates
                .map((pair) => pair.join(" "))
                .join(", ") +
              ")"
          )
          .join(", ");
        wkt = "MULTILINESTRING (" + coordinates + ")";
      }
    } else {
      if (geom.geometry.type == "MultiPolygon") {
        wkt = convertToWK(geom);
      }
    }
  }
  $("#d_geojson").val(wkt);
  set_share_link("");
  set_location_id("");
};

const presentConfirmResetValidation = function (event) {
  if ($("#location_id").val() != "") {
    event.preventDefault();
    message =
      "You are about to change either the 'Locality', 'Georeferenced by' or 'Georeference remarks' on a georeference that has already been validated. If you continue, you will have to validate again the record and it will be considered a different georeference. Do you want to continue?";
    dialogConfirm(message);
  }
};

const show_centroid_data = function (lat, lng, radius) {
  $("#centroid_x").val(lng.toFixed(7));
  $("#centroid_y").val(lat.toFixed(7));
  if (radius === null) {
    $("#radius_m").val = "";
  } else {
    $("#radius_m").val(radius.toFixed(0));
  }
};

const showShareLink = function (shareLink) {
  $("#showShareLink").show();
};

// Notification
const dialogConfirm = function (message) {
  $.confirm({
    title: "Warning!",
    content: message,
    confirmButtonClass: "btn-warning",
    boxWidth: "30%",
    icon: "fa fa-warning",
    useBootstrap: false,
    keyboardEnabled: true,
    type: "orange",
    escapeKey: "cancel",
    buttons: {
      ok: {
        keys: ["enter"],
        action: function () {
          set_share_link("");
          set_location_id("");
          enable_copy_button(false);
          // enable_validate_button(true);
        },
      },
      cancel: function () {},
    },
  });
};
const dialogError = function (message, cancel_time) {
  $.confirm({
    title: "Error!",
    useBootstrap: false,
    type: "red",
    icon: "fa-solid fa-circle-exclamation",
    boxWidth: "30%",
    content: message,
    buttons: {
      ok: {
        keys: ["enter"],
        action: function () {
          //   $.alert("action is canceled");
        },
      }
    },
  });
};
const dialogWhatsNew = function (title, message) {
  $.confirm({
    title: title,
    useBootstrap: false,
    type: "blue",
    icon: "fa-solid fa-globe",
    boxWidth: "30%",
    content: message,
    animation: "scale",
    animationSpeed: 1000,
    buttons: {
        ok: {
          keys: ["enter"],
        }
      },
    });
};

const dialogSuccess = function (message) {
  $.confirm({
    title: "Success!",
    useBootstrap: false,
    type: "green",
    icon: "fa-solid fa-circle-check",
    boxWidth: "30%",
    content: message,
    okButton: false,
    autoClose: "ok|2000",    
    buttons: {
        ok: {
          // isHidden: true,
          keys: ["enter"],
          action: function () {
            //   $.alert("action is canceled");
          },
        }
      },
    });
};
const dialogWarning = function (message) {
  $.confirm({
    title: "Warning!",
    useBootstrap: false,
    type: "orange",
    icon: "fa fa-warning",
    boxWidth: "30%",
    content: message,
    buttons: {
        ok: {
          keys: ["enter"],
          action: function () {
            //   $.alert("action is canceled");
          },
        }
      },
  });
};

clear_centroid_data();

module.exports = {
  dialogError,
  dialogSuccess,
  dialogWarning,
  dialogWhatsNew,
  clear_centroid_data,
  show_api_centroid_data,
  show_api_centroid_data_wkt,
  show_centroid_data,
  do_copy_data,
  get_ui_data,
  copy_latest_search,
  showShareLink,
  show_textual_data,
  set_share_link,
  copy_share_link,
  generate_location_id,
  set_location_id,
  // enable_validate_button,
  enable_copy_button,
  presentConfirmResetValidation,
};
