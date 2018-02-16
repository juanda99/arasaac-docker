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

curl --insecure --user '12345:12345' 'http://localhost:5000/oauth/token/' --data 'grant_type=facebook&token=EAAXZCDefCLp4BADRZBycr6ipM2kGFykfl4vdgZAAkUxIukvwWufvKPrhDaOesT9fnSkghGoTOF6IiSAUiZBSNJELs9Q6eVNWT2vvYvlRDvyATAbdXPELp24cyTRXGkhnK96frRKuvqxqQIT1os9QA341Qo0NTI7kpBWW9MmCZAVyAZB8T9ZAF5v1izwNWLGbro2ytJRyaNhwgZDZD&scope=email,user_profile,public_friends'
