# Grant types

## Client credentials
- Used by Arasaac for example for creating user.
- Used by other apps????

```
https://auth.arasaac.org/oauth/token
grant_type=password
```

server.exchange(oauth2orize.exchange.password((client, username, password, scope, done) => {




## Implicit grants
- Used by Arasaac when user is implied
  - See profile
  - Add picto to favorites
  - ....
- Used by other apps on behalf of a user (maybe also instead of client credentials)

```
https://auth.arasaac.org/dialog/authorize?redirect_uri=https://localhost:3000&response_type=token&client_id=12345
```

## Resource owner password credentials
