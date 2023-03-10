#!/usr/bin/env bash
sudo docker images -a | grep "mariadb" | awk '{print $3}' | xargs sudo docker rmi
sudo docker images -a | grep "adminer" | awk '{print $3}' | xargs sudo docker rmi
sudo docker images -a | grep "express-api" | awk '{print $3}' | xargs sudo docker rmi
