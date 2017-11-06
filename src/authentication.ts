import { isFuture, addSeconds } from "date-fns";
import * as jwtDecode from "jwt-decode";
import { oauthUrl, clientId, clientSecret, scope } from "./config";

// http://localhost:8080/ is always allowed
// Other redirect URIs must be configured for the client
const redirectUri = document.location.href.split("?")[0];

/**
 * Gets access token from local storage, by requesting new token,
 * or by reading authorization code from URL parameter.
 * Returns null if no valid token can be returned.
 */
export async function getAccessToken(): Promise<string> {
  const accessToken = window.localStorage.getItem("access_token");
  const accessTokenExpires = window.localStorage.getItem(
    "access_token_expires"
  );
  const refreshToken = window.localStorage.getItem("refresh_token");

  // 1. Access token is available and not expired
  if (accessToken && accessTokenExpires && isFuture(accessTokenExpires)) {
    return accessToken;
  }

  // 2. Refresh token is available, get new access token
  if (refreshToken) {
    return await refreshAccessToken(refreshToken);
  }

  // 3. Authorization code is available, get refresh and access tokens
  const authorizationCode = getAuthorizationCode();
  if (authorizationCode) {
    return await getRefreshAndAccessTokens(authorizationCode);
  }

  // 4. Cannot get access token, user needs to log in
  throw new Error("Cannot get access token. User needs to log in.");
}

/**
 * Gets the authorization code from the `code` URL parameter and removes it from the URL.
 */
function getAuthorizationCode() {
  const params = new URLSearchParams(document.location.search);
  const authorizationCode = params.get("code");
  if (authorizationCode) {
    window.history.replaceState(null, "", window.location.pathname);
  }
  return authorizationCode;
}

/**
 * Gets a refresh token and access token using the authorization code.
 * Stores the refresh token, access token and it's update time in session storage.
 * Returns a promise that resolves with the access token.
 */
async function getRefreshAndAccessTokens(authorizationCode: string) {
  const tokenUrl = oauthUrl + "/token";
  const payload = new URLSearchParams();
  payload.set("grant_type", "authorization_code");
  payload.set("code", authorizationCode);
  payload.set("redirect_uri", redirectUri);
  payload.set("client_id", clientId);
  payload.set("client_secret", clientSecret);

  const json = await fetchJson<AuthorizationCodeResponse>(tokenUrl, {
    method: "POST",
    body: payload
  });

  window.localStorage.setItem("refresh_token", json.refresh_token);
  window.localStorage.setItem("access_token", json.access_token);
  window.localStorage.setItem(
    "access_token_expires",
    addSeconds(Date.now(), json.expires_in).toString()
  );

  return json.access_token;
}

/**
 * Gets a new access token using the refresh token.
 * Stores the refresh token, access token and it's update time in session storage.
 * Returns a promise that resolves with the access token.
 */
async function refreshAccessToken(refreshToken: string) {
  const tokenUrl = oauthUrl + "/token";
  const payload = new URLSearchParams();
  payload.set("grant_type", "refresh_token");
  payload.set("refresh_token", refreshToken);
  payload.set("redirect_uri", redirectUri);
  payload.set("client_id", clientId);
  payload.set("client_secret", clientSecret);

  const json = await fetchJson<RefreshTokenResponse>(tokenUrl, {
    method: "POST",
    body: payload
  });

  window.localStorage.setItem("access_token", json.access_token);
  window.localStorage.setItem(
    "access_token_expires",
    addSeconds(Date.now(), json.expires_in).toString()
  );

  return json.access_token;
}

/**
 * Fetches and returns parsed json.
 * Throws error if response is not ok.
 */
async function fetchJson<TData>(
  input: RequestInfo,
  init?: RequestInit | undefined
) {
  const response = await fetch(input, init);
  if (response.ok) {
    const json: TData = await response.json();
    return json;
  } else {
    throw new Error(response.statusText);
  }
}

interface AuthorizationCodeResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
}

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Redirects the user to the Portal authorize page,
 * or to the login page if the user is not logged in.
 */
function login() {
  const redirectUrl = document.location.href.split("?")[0];

  const params = new URLSearchParams();
  params.set("response_type", "code");
  params.set("client_id", clientId);
  params.set("redirect_uri", redirectUrl);
  params.set("scope", scope);
  params.set("client_secret", clientSecret);

  document.location.href = `${oauthUrl}/authorize?${params}`;
}

/**
 * Logs out the user by clearing all tokens from local storage and reloading the page.
 */
export function logout() {
  window.localStorage.removeItem("refresh_token");
  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("access_token_expires");
  window.location.reload();
}

/**
 * Shows login button which takes the user to the authorize page.
 */
export function showLoginButton() {
  const loginButton = document.createElement("button");
  loginButton.innerText = "Log in";
  loginButton.setAttribute("class", "login-button");
  loginButton.onclick = ev => login();

  document.body.appendChild(loginButton);
}

/**
 * Adds an element to the body that shows the currently logged in user and a logout link.
 */
export async function showUserInfo() {
  const accessToken = await getAccessToken();

  const jwt: User = jwtDecode(accessToken);

  const userInfo = document.createElement("div");
  userInfo.innerText = jwt.unique_name;
  userInfo.setAttribute("class", "user-info");

  const logoutButton = document.createElement("button");
  logoutButton.innerText = "Log out";
  logoutButton.setAttribute("class", "logout-button");
  logoutButton.onclick = () => logout();
  userInfo.appendChild(logoutButton);

  document.body.appendChild(userInfo);
}

interface User {
  unique_name: string;
}
