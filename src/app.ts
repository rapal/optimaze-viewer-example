import { startOfToday } from "date-fns";
import { loadViewer } from "./viewer";
import { getAccessToken, showUserInfo, showLogin } from "./authentication";

import "leaflet/dist/leaflet.css";
import "./app.css";

// Floor plan parameters
const companyId = 1361;
const floorId = "m2033670";
const date = startOfToday();

getAccessToken().then(
  () => {
    // Access token available, load viewer
    loadViewer(companyId, floorId, date);
    showUserInfo();
  },
  () => {
    // Access token unavailable, user must log in
    showLogin();
  }
);
