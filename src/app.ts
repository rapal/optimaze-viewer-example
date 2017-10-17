import loadViewer from "./viewer";
import { getAccessToken, showLoginButton, showUserInfo } from "./authentication";

import "leaflet/dist/leaflet.css";
import "./app.css";

// Floor plan parameters
const companyId = 1361;
const floorId = "m2033670";

// Get authorization code from URL
const params = new URLSearchParams(document.location.search);
const authorizationCode = params.get("code");
if (authorizationCode) {
  window.history.replaceState(null, "", window.location.pathname);
}

getAccessToken(authorizationCode)
  .then(accessToken => {
    loadViewer(companyId, floorId, accessToken);
    showUserInfo(accessToken);
  })
  .catch(() => showLoginButton());
