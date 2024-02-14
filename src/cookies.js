const info = require("./info");
const p = require("../package.json");

// Function to set a cookie
function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Function to get a cookie
function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

document.addEventListener("DOMContentLoaded", function () {
  // Check if the "hasVisited" cookie exists
  cookie_name = "GeoPick_v2.0.0_hasBeenVisited"
  if (getCookie(cookie_name) !== "true") {
    message = "<b>GeoPick</b> now allows you to <b>share georeferences</b> with another GeoPick user. You will find a new <i>shareLink</i> column in the data copied to the clipboard which contains a URL you can share with other users. Please see sections <i>Getting georeference results</i> and <i>Sharing georeferences</i> in the <i>Help</i> page.<br><br><b>New Darwin Core fields</b> <i>Location ID</i> and <i>Locality</i> have been added to the <i>Info box</i>.<br><br>Happy georeferencing!" 
    info.dialogWhatsNew("New Version 2!", message);    
    setCookie(cookie_name, "true", 10000); // Set the cookie for 365 days
  }
});
