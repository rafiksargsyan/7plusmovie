#!/bin/bash

if [ $# -eq 0 ]
then
  echo "Usage: $(basename $0) <CLIENT_ID> <USERNAME> <PASSWORD>"
  echo "Prod cli client id: 2so94a4hnjq3hb38a3km1huf9d"
  exit 0
fi


aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id $1 --auth-parameters "USERNAME=${2},PASSWORD=${3}" | jq ".AuthenticationResult.IdToken" | tr -d '"'

