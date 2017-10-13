export function getAccessToken(
  oauthUrl: string,
  authorizationCode: string,
  redirectUrl: string,
  clientId: string,
  clientSecret: string
) {
  const tokenUrl = oauthUrl + "/token?";
  const body =
    "grant_type=authorization_code&code=" +
    authorizationCode +
    "&redirect_uri=" +
    redirectUrl +
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
