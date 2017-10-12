import loadViewer from "./load-viewer";

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

// Get floor id from URL params or use default
const appUrl = document.location.href.split("?")[0];
const params = new URLSearchParams(document.location.search.substring(1));
const floorId = params.get("floorId") || "m2033670";
const code = params.get("code");

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

function getAccessToken(authorizationCode: string) {
  const tokenUrl = oauthUrl + "/token?";
  const body =
    "grant_type=authorization_code&code=" +
    authorizationCode +
    "&redirect_uri=" +
    appUrl +
    "&client_id=" +
    clientId +
    "&client_secret=" +
    clientSecret;

  return fetch(tokenUrl, {
    method: "POST",
    body
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Cannot get access token.");
    })
    .then(json => json.access_token);
}

if (code) {
  getAccessToken(code).then(token =>
    loadViewer(apiUrl, companyId, floorId, token)
  );
}
