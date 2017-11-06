import { loadViewer } from "./viewer";
import {
  getAccessToken,
  showUserInfo,
  showLoginButton
} from "./authentication";

import "leaflet/dist/leaflet.css";
import "./app.css";

// Floor plan parameters
const companyId = 1361;
const floorId = "m2033670";

getAccessToken().then(
  () => {
    // Access token available, load viewer
    loadViewer(companyId, floorId);
    showUserInfo();
  },
  () => {
    // Access token unavailable, user must log in
    showLoginButton();
  }
);
