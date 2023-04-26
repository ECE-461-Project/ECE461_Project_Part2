#!/usr/bin/env bash
TIME=$(date +%Y-%m-%d-%T)
FOLDER=local_reports/$TIME
mkdir -p $FOLDER
REPORT_NAME=$FOLDER/local_report.html
CSV_PREFIX=$FOLDER/local
locust --headless --users 100 --spawn-rate 10 --html $REPORT_NAME --only-summary --csv $CSV_PREFIX -H http://localhost:3000
