import { isAfter, subMinutes } from "date-fns";
import { oauthUrl, clientId, clientSecret, scope } from "./config";

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

/**
 * Gets access token from session storage or by requesting new token.
 * Rejects if no valid token can be requested.
 */
export function getAccessToken(
  authorizationCode: string | null
): Promise<string> {
  const redirectUrl = document.location.href.split("?")[0];
  const accessToken = window.sessionStorage.getItem("access_token");
  const accessTokenTime = window.sessionStorage.getItem("access_token_time");
  const refreshToken = window.sessionStorage.getItem("refresh_token");

  if (
    accessToken &&
    accessTokenTime &&
    isAfter(parseInt(accessTokenTime, 10), subMinutes(Date.now(), 15))
  ) {
    // Access token is available and less than 15 minutes old
    return Promise.resolve(accessToken);
  } else if (refreshToken) {
    // Refresh token is available, get a new access token
    // TODO: Check refresh token validity?
    return refreshAccessToken(refreshToken, redirectUrl);
  } else if (authorizationCode) {
    // Authorization code is available, get refresh and access tokens
    return getRefreshAndAccessTokens(authorizationCode, redirectUrl);
  } else {
    return Promise.reject(
      "Cannot get access code. Make sure 'authorization_code' is saved to session storage."
    );
  }
}

/**
 * Gets a refresh token and access token using the authorization code.
 * Stores the refresh token, access token and it's update time in session storage.
 * Returns a promise that resolves with the access token.
 */
function getRefreshAndAccessTokens(
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

  return fetch(tokenUrl, {
    method: "POST",
    body: payload,
    headers: {
      // TODO: Default is "application/x-www-form-urlencoded;charset=UTF-8" which doesn't work
      "content-type": "x-www-form-urlencoded"
    }
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Cannot get access token.");
    })
    .then(json => {
      window.sessionStorage.setItem("refresh_token", json.refresh_token);
      window.sessionStorage.setItem("access_token", json.access_token);
      window.sessionStorage.setItem("access_token_time", Date.now().toString());
      return json.access_token;
    });
}

/**
 * Gets a new access token using the refresh token.
 * Stores the new access token and it's update time in session storage.
 * Returns a promise that resolves with the access token.
 */
function refreshAccessToken(refreshToken: string, redirectUrl: string) {
  const tokenUrl = oauthUrl + "/token";
  const payload = new URLSearchParams();
  payload.set("grant_type", "refresh_token");
  payload.set("refresh_token", refreshToken);
  payload.set("redirect_uri", redirectUrl);
  payload.set("client_id", clientId);
  payload.set("client_secret", clientSecret);

  return fetch(tokenUrl, {
    method: "POST",
    body: payload,
    headers: {
      // TODO: Default is "application/x-www-form-urlencoded;charset=UTF-8" which doesn't work
      "content-type": "x-www-form-urlencoded"
    }
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Cannot refresh access token.");
    })
    .then(json => {
      window.sessionStorage.setItem("access_token", json.access_token);
      window.sessionStorage.setItem("access_token_time", Date.now().toString());
      return json.access_token;
    });
}
