import { isFuture, addSeconds } from "date-fns";
import { oauthUrl, clientId, clientSecret, scope } from "./config";

/**
 * Gets access token from local storage or by requesting new token.
 * Throws error if no valid token can be returned.
 */
export async function getAccessToken(
  authorizationCode: string | null
): Promise<string> {
  const redirectUrl = document.location.href.split("?")[0];
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
    return await refreshAccessToken(refreshToken, redirectUrl);
  }

  // 3. Authorization code is available, get refresh and access tokens
  if (authorizationCode) {
    return await getRefreshAndAccessTokens(authorizationCode, redirectUrl);
  }

  throw new Error(
    "Cannot get access code. Make sure 'authorization_code' is saved to session storage."
  );
}

/**
 * Gets a refresh token and access token using the authorization code.
 * Stores the refresh token, access token and it's update time in session storage.
 * Returns a promise that resolves with the access token.
 */
async function getRefreshAndAccessTokens(
  authorizationCode: string,
  redirectUrl: string
) {
  const tokenUrl = oauthUrl + "/token";
  const payload = new URLSearchParams();
  payload.set("grant_type", "authorization_code");
  payload.set("code", authorizationCode);
  payload.set("redirect_uri", redirectUrl);
  payload.set("client_id", clientId);
  payload.set("client_secret", clientSecret);

  const json = await fetchJson<TokenResponse>(tokenUrl, {
    method: "POST",
    body: payload,
    headers: {
      // TODO: Default is "application/x-www-form-urlencoded;charset=UTF-8" which doesn't work
      "content-type": "x-www-form-urlencoded"
    }
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
async function refreshAccessToken(refreshToken: string, redirectUrl: string) {
  const tokenUrl = oauthUrl + "/token";
  const payload = new URLSearchParams();
  payload.set("grant_type", "refresh_token");
  payload.set("refresh_token", refreshToken);
  payload.set("redirect_uri", redirectUrl);
  payload.set("client_id", clientId);
  payload.set("client_secret", clientSecret);

  const json = await fetchJson<TokenResponse>(tokenUrl, {
    method: "POST",
    body: payload,
    headers: {
      // TODO: Default is "application/x-www-form-urlencoded;charset=UTF-8" which doesn't work
      "content-type": "x-www-form-urlencoded"
    }
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
 * Fetches and returns parsed json.
 * Throws error if repsonse is not ok.
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

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
}

/**
 * Shows login button which takes the user to the authorize page.
 */
export function showLoginButton() {
  const redirectUrl = document.location.href.split("?")[0];
  const loginButton = document.getElementById("login");
  if (!loginButton) {
    throw Error("No element with id #login found.");
  }
  loginButton.removeAttribute("hidden");
  loginButton.onclick = ev => {
    document.location.href =
      `${oauthUrl}/authorize?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectUrl}` +
      `&scope=${scope}` +
      `&client_secret=${clientSecret}`;
  };
}
