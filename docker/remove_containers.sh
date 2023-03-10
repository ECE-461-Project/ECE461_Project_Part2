#!/usr/bin/env bash
sudo docker ps -a | grep "mariadb_container" | awk '{print $1}' | xargs sudo docker rm
sudo docker ps -a | grep "adminer_container" | awk '{print $1}' | xargs sudo docker rm
sudo docker ps -a | grep "express-api" | awk '{print $1}' | xargs sudo docker rm
