#!/usr/bin/env bash
sudo docker volume ls | grep "mariadb_volume1" | awk '{print $2}' | xargs sudo docker volume rm
