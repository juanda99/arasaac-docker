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

token=EAAXZCDefCLp4BAImTCp9JzBGgGZB9IxdDTVYDNpDwFtLDWuzFBbO84cUnGznpfFcaorLyqytREbw7RZABTRerGytikNckJLPqM0rNXqJz8kZABhWZBOWkoyYTIpjZC33jqdkOjYhZAfvAPd0jXHUj7wADATtkC65mQf27D1qT7MTWflsN9bZAK6aTfAvpeOnNkerAaUJiL4ZA2QZDZD

curl --insecure --user '12345:12345' 'http://localhost:5000/oauth/token/' --data "grant_type=facebook&token=$token&scope=email,public_profile,public_friends"
#curl --insecure --user '12345:12345' 'http://localhost:5000/oauth/token/' --data "grant_type=facebook&token=$token&scope=offline_access"
