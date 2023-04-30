#!/usr/bin/env bash
TIME=$(date +%Y-%m-%d-%T)
FOLDER=local_reports/$TIME
mkdir -p $FOLDER
REPORT_NAME=$FOLDER/local_report.html
CSV_PREFIX=$FOLDER/local
ulimit -n 10000
locust --headless --users 20 --spawn-rate 10 --html $REPORT_NAME --only-summary --csv $CSV_PREFIX -t 10m -s 120 -H http://localhost:3000
