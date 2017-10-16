import loadViewer from "./viewer";
import { getAccessToken, showLoginButton } from "./authentication";

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

// Get authorization code from URL
const params = new URLSearchParams(document.location.search);
const authorizationCode = params.get("code");
if (authorizationCode) {
  window.sessionStorage.setItem("authorization_code", authorizationCode);
  window.history.replaceState(null, "", window.location.pathname);
}

getAccessToken(oauthUrl, appUrl, clientId, clientSecret, authorizationCode)
  .then(token => loadViewer(apiUrl, companyId, floorId, token))
  .catch(() =>
    showLoginButton(oauthUrl, appUrl, clientId, clientSecret, scope)
  );
