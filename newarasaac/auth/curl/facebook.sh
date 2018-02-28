#!/bin/sh

# Curl example of getting the resource owner credentials.
# Typically you will be setup to not have to use the --insecure flag  
# See Client Credentials Grant at: https://tools.ietf.org/html/rfc6749#section-4.3

# Start the server with 'npm start' before running this command

# You should get back something of the form:
# {
#   "access_token" : "(some long token)",
#   "expires_in" : 3600,
#   "token_type" : "Bearer"
# }

token=EAAXZCDefCLp4BAMBe5oS2otpqo6kSJXZAd8GAsGYaLpQgTQQMaC5x2rWBb5pKWs6j0dTGn7BDlgSIDO7swtN2zGmW5eKo6miDmL6Ty5ElIpMj96nIsHZA9NG5sNqU6UthL7NZBuJYTEOKggdt0ZB3SQ9Dl7oqhoGJvf9pMYW42NJTzmTjkkKJEXZCzZAXzZCw5pH4Y2eZByFQgAZDZD

curl --insecure --user '12345:12345' 'http://localhost:5000/oauth/token/' --data "grant_type=facebook&token=$token&scope=email,public_profile,public_friends"
