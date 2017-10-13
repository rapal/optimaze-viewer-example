import loadViewer from "./viewer";
import { getAccessToken } from "./authentication";

import "leaflet/dist/leaflet.css";
import "./app.css";

// Config
// TODO: Replace with production URL once API is published
const apiUrl = "https://space.spartan.rapalnet.fi/api/public/v1";
const oauthUrl = "https://portal.spartan.rapalnet.fi/oauth";
const clientId = "optimaze-viewer-example";
const scope = "Floorplan.Graphics.View";
const clientSecret = "vc2Eml0oxTc9rS6wcJbl";
const companyId = 1361;
const floorId = "m2033670";

// Get floor id from URL params or use default
const appUrl = document.location.href.split("?")[0];
const params = new URLSearchParams(document.location.search.substring(1));
const authorizationCode = params.get("code");

// Login button
const loginButton = document.getElementById("login");
if (!loginButton) {
  throw Error("No login button");
}
loginButton.onclick = ev => {
  document.location.href =
    `${oauthUrl}/authorize?response_type=code&client_id=${clientId}` +
    `&redirect_uri=${appUrl}` +
    `&scope=${scope}&client_secret=${clientSecret}`;
};

if (authorizationCode) {
  window.history.replaceState(null, "", window.location.pathname);
  getAccessToken(
    oauthUrl,
    authorizationCode,
    appUrl,
    clientId,
    clientSecret
  ).then(token => loadViewer(apiUrl, companyId, floorId, token));
}
