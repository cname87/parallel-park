#!/usr/bin/env bash

# Runs a local production build, deletes the website static files on the GCP storage and uploads the local dist file to the GCP rtorage.

SCRIPT_DIR="${0%/*}"
cd "$SCRIPT_DIR"/.. || exit
npm run build:prod
gsutil rm gs://parking.project-perform.com/**
gsutil -h "cache-control:no-cache" -m cp dist/parallel-park/** gs://parking.project-perform.com
