#!/usr/bin/env bash

# Runs a local production build, deletes the website static files on the GCP storage and uploads the local dist file to the GCP rtorage.

npm run build:prod
gsutil rm gs://parking.project-perform.com/**

# Disable caching during development
# gsutil -h "cache-control:no-cache" -m cp dist/** gs://parking.project-perform.com

# Production
gsutil -m cp dist/** gs://parking.project-perform.com
