#!/usr/bin/env bash
# https://mariadb.com/kb/en/installing-and-using-mariadb-via-docker/
# Hopefully this is unnecessary and can just use localhost
sudo docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' mariadb_container
