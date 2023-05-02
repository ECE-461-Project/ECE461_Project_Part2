#!/usr/bin/env bash
TIME=$(date +%Y-%m-%d-%T)
FOLDER=remote_reports/$TIME
mkdir -p $FOLDER
REPORT_NAME=$FOLDER/remote_report.html
CSV_PREFIX=$FOLDER/remote
ulimit -n 10000
locust --headless --users 500 --spawn-rate 5 --html $REPORT_NAME --only-summary --csv $CSV_PREFIX -t 5m -s 15 -H https://main-zo6hfspdfa-uc.a.run.app
