#!/bin/sh

echo $BASE64_ENCODED_CERT | base64 -d > /etc/nginx/ssl/fullchain.pem
echo $BASE64_ENCODED_KEY | base64 -d > /etc/nginx/ssl/private/privkey.pem
