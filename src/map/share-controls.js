"use strict";

const $ = require("jquery");

/**
 * Register validate/copy/share flow and WKT-size modal behavior.
 */
const setupShareControls = function (deps) {
  const { info, do_share } = deps;

  const wktSize = function () {
    const wkt = $("#d_geojson").val();
    if (wkt.length >= 32767) {
      return wkt.length;
    }
    return null;
  };

  const validateInfoBox = function () {
    const empty_info = [];
    if (document.getElementById("centroid_y").value == "") {
      empty_info.push("Point-radius is not calculated.");
    }
    if (document.getElementById("locality_description").value == "") {
      empty_info.push("The 'Locality' field is empty.");
    }
    if (document.getElementById("georeferencer_name").value == "") {
      empty_info.push("The field 'Georeferenced by' is empty.");
    }
    if (empty_info.length != 0) {
      const message =
        "<b>The georeference is not complete:</b><br><br>" +
        empty_info.join("<br>") +
        "</ul>";
      info.dialogError(message, 10000);
    } else {
      return true;
    }
  };

  const format = function (num) {
    const nf = new Intl.NumberFormat("en-US");
    let s = nf.format(num);
    s = s.replace(/,/g, " ");
    return s;
  };

  const modal = document.getElementById("wkt_limit_box_modal");

  const closeModal = function () {
    modal.style.display = "none";
  };

  const showModal = function (withHeaders, wkt_length) {
    modal.style.display = "block";
    const message =
      "WARNING!\nThe size of this WKT is " +
      format(wkt_length) +
      " characters long. Usually spreadsheet applications have a limit on the maximum number of characters that are allowed per cell (e.g., Microsoft Excel: 32 767, Google Sheets: 50 000).\nDo you still want to copy the data including the WKT?";
    document.getElementById("wkt_length_text").innerText = message;
    modal.setAttribute("withHeaders", withHeaders);
    document.getElementById("doNotCopyWKT").focus();
  };

  const handle_copy_data = function (withHeaders) {
    const wkt_length = wktSize();
    if (wkt_length != null) {
      showModal(withHeaders, wkt_length);
    } else {
      do_share(withHeaders);
    }
  };

  $("#validate_georeference").on("click", function () {
    if (validateInfoBox()) {
      info.enable_copy_button(true);
    } else {
      console.log(info.generate_location_id());
    }
  });

  $("#cpdata").on("click", function () {
    handle_copy_data(true);
    info.enable_copy_button(false);
  });

  $("#cpdatanh").on("click", function () {
    handle_copy_data(false);
    info.enable_copy_button(false);
  });

  $("#share").on("click", function () {
    do_share();
  });

  $("#locality_description").on("keypress", function (event) {
    if (
      event.key !== "Tab" &&
      event.key !== "Control" &&
      event.key !== "Shift" &&
      event.key !== "Alt"
    ) {
      info.presentConfirmResetValidation(event);
    }
  });

  $("#georeferencer_name").on("keydown", function (event) {
    if (
      event.key !== "Tab" &&
      event.key !== "Control" &&
      event.key !== "Shift" &&
      event.key !== "Alt"
    ) {
      info.presentConfirmResetValidation(event);
    }
  });

  $("#georeference_remarks").on("keydown", function (event) {
    if (
      event.key !== "Tab" &&
      event.key !== "Control" &&
      event.key !== "Shift" &&
      event.key !== "Alt"
    ) {
      info.presentConfirmResetValidation(event);
    }
  });

  $("#doCopyWKT").on("click", function () {
    const withHeaders = JSON.parse(modal.getAttribute("withHeaders"));
    info.do_copy_data(withHeaders, true);
    closeModal();
  });

  $("#doNotCopyWKT").on("click", function () {
    const withHeaders = JSON.parse(modal.getAttribute("withHeaders"));
    info.do_copy_data(withHeaders, false);
    closeModal();
  });

  return {
    handle_copy_data,
  };
};

module.exports = {
  setupShareControls,
};
