// This script contains functionality related to interaction with the API.
// It preserves the legacy wire format while making request/geometry handling
// easier to maintain and test.

const $ = require("jquery");
const ui = require("jquery-ui/ui/widgets/dialog");
const L = require("leaflet");
const info = require("./info");
require("leaflet-spin");

const { parseFromWK } = require("wkt-parser-helper");
const turf = require("@turf/turf");

const api_base_url = process.env.API_URL + "v1/";

const parse_api_data = function (data) {
  const mbc = data.mbc;
  const site = data.site;
  const centroid = data.centroid;
  const spatial_fit = data.spatial_fit == "Inf" ? "" : data.spatial_fit;

  return {
    centroid: { type: "Feature", geometry: centroid },
    mbc: { type: "Feature", geometry: mbc },
    site: site,
    spatial_fit: spatial_fit,
    uncertainty: data.uncertainty,
  };
};

const parse_share_api_data = function (data) {
  const parsed_json = JSON.parse(data.data);
  const path = data.path;
  const site = parseFromWK(parsed_json.footprintWKT);
  const centroid = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          coordinates: [
            parseFloat(parsed_json.decimalLongitude),
            parseFloat(parsed_json.decimalLatitude),
          ],
          type: "Point",
        },
      },
    ],
  };

  let mbc = null;
  if (parsed_json.sec_representation.length != 0) {
    mbc = {
      type: "Feature",
      geometry: parsed_json.sec_representation[0].geometry,
    };
  }

  return {
    centroid: { type: "Feature", geometry: centroid },
    mbc: mbc,
    site: site,
    spatial_fit: parsed_json.pointRadiusSpatialFit,
    uncertainty: parsed_json.coordinateUncertaintyInMeters,
    wkt: parsed_json.footprintWKT,
    locality: parsed_json.locality,
    georeferencer_name: parsed_json.georeferencedBy,
    georeference_remarks: parsed_json.georeferenceRemarks,
    path: path,
  };
};

const normalize_geometry_payload = function (features) {
  if (features.length <= 1) {
    return features;
  }

  let geom_type = "";
  const coords = [];

  for (let i = 0; i < features.length; i++) {
    geom_type = features[i].geometry.type;
    coords.push(features[i].geometry.coordinates);
  }

  if (geom_type == "Polygon") {
    return turf.multiPolygon(coords);
  }

  if (geom_type == "LineString") {
    return turf.multiLineString(coords);
  }

  return features;
};

const json_request = function (method, payload) {
  return {
    method: method,
    body: payload == null ? undefined : JSON.stringify(payload),
    headers: new Headers({
      "Content-Type": "application/json; charset=UTF-8",
    }),
  };
};

const apply_api_result_to_layers = function (
  parsed_json,
  geom,
  site_layer,
  mbc_layer,
  centroid_layer,
  map,
  clear_nominatim_layer
) {
  site_layer.clearLayers();
  mbc_layer.clearLayers();
  centroid_layer.clearLayers();

  if (clear_nominatim_layer) {
    clear_nominatim_layer.clearLayers();
  }

  mbc_layer.addData(parsed_json.mbc);
  centroid_layer.addData(parsed_json.centroid);
  map.fitBounds(mbc_layer.getBounds());
  info.show_api_centroid_data(parsed_json, geom);

  const layer = L.geoJSON(parsed_json.site);
  layer.eachLayer(function (leafletLayer) {
    site_layer.addLayer(leafletLayer);
  });
  site_layer.bringToFront();
};

const fetch_sec_and_apply = function (
  geom,
  site_layer,
  mbc_layer,
  centroid_layer,
  map,
  clear_nominatim_layer,
  on_success
) {
  map.spin(true);

  fetch(api_base_url + "sec", json_request("POST", geom))
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      const parsed_json = parse_api_data(data);
      map.spin(false);
      apply_api_result_to_layers(
        parsed_json,
        geom,
        site_layer,
        mbc_layer,
        centroid_layer,
        map,
        clear_nominatim_layer
      );
      if (typeof on_success === "function") {
        on_success(parsed_json);
      }
    })
    .catch(function (error) {
      info.dialogError(error, 5000);
      map.spin(false);
    });
};

const promote_reference_to_editable = function (
  site_layer,
  nominatim_layer,
  mbc_layer,
  centroid_layer,
  map
) {
  const geom = normalize_geometry_payload(nominatim_layer.toGeoJSON().features);

  fetch_sec_and_apply(
    geom,
    site_layer,
    mbc_layer,
    centroid_layer,
    map,
    nominatim_layer,
    null
  );
};

const load_share = function (locationid, site_layer, mbc_layer, centroid_layer, map) {
  map.spin(true);

  fetch(api_base_url + "georeferences/" + locationid, json_request("GET", null))
    .then(function (response) {
      if (response.status == 404) {
        throw new Error("Resource with id " + locationid + " does not exist!", {
          cause: response,
        });
      }
      return response.json();
    })
    .then(function (data) {
      const parsed_json = parse_share_api_data(data);
      site_layer.clearLayers();
      mbc_layer.clearLayers();
      centroid_layer.clearLayers();

      map.spin(false);

      // There is actually a SEC geometry.
      if (parsed_json.mbc) {
        mbc_layer.addData(parsed_json.mbc);
        centroid_layer.addData(parsed_json.centroid);
        map.fitBounds(mbc_layer.getBounds());
        info.show_api_centroid_data_wkt(parsed_json, parsed_json.wkt);
        const layer = L.geoJSON(parsed_json.site);
        layer.eachLayer(function (leafletLayer) {
          site_layer.addLayer(leafletLayer);
        });
        site_layer.bringToFront();
      } else {
        // If there is no SEC geometry it is a point-radius feature and must be rebuilt.
        centroid_layer.addData(parsed_json.centroid);
        const longitude = parseFloat(
          parsed_json.centroid.geometry.features[0].geometry.coordinates[1]
        );
        const latitude = parseFloat(
          parsed_json.centroid.geometry.features[0].geometry.coordinates[0]
        );
        const radius = parseFloat(parsed_json.uncertainty);

        const circle = L.circle([longitude, latitude], radius, {
          color: "blue",
          fillColor: "blue",
        });

        map.addLayer(circle);
        site_layer.addLayer(circle);
        centroid_layer.addData(site_layer.toGeoJSON());
        info.show_centroid_data(latitude, longitude, radius);
        map.fitBounds(circle.getBounds());
      }

      info.show_textual_data(parsed_json);
      info.set_share_link(locationid);
      info.set_location_id(locationid);
      info.enable_copy_button(true);
      // info.enable_validate_button(false);
    })
    .catch(function (error) {
      info.dialogError(error, 5000);
      map.spin(false);
    });
};

const write_share = function (share_data, locationid, map, withHeaders) {
  const payload = { georef_data: share_data, locationid: locationid };

  map.spin(true);
  fetch(api_base_url + "georeference", json_request("POST", payload))
    .then(function (response) {
      return response.json();
    })
    .then(function () {
      map.spin(false);
      info.do_copy_data(withHeaders, true);
    })
    .catch(function (error) {
      map.spin(false);
      info.set_location_id("");
      info.set_share_link("");
      info.dialogError(error, 5000);
    });
};

const load_api_data = function (site_layer, mbc_layer, centroid_layer, map) {
  const geom = normalize_geometry_payload(site_layer.toGeoJSON().features);

  fetch_sec_and_apply(
    geom,
    site_layer,
    mbc_layer,
    centroid_layer,
    map,
    null,
    function () {
      // Keep existing focus/button behavior.
      $("#locality_description").trigger("focus");
      info.enable_copy_button(false);
    }
  );
};

module.exports = {
  parse_api_data,
  load_api_data,
  promote_reference_to_editable,
  write_share,
  load_share,
};
