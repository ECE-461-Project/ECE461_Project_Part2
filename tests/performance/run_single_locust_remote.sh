#!/usr/bin/env bash
TIME=$(date +%Y-%m-%d-%T)
FOLDER=remote_reports/$TIME
mkdir -p $FOLDER
REPORT_NAME=$FOLDER/remote_report.html
CSV_PREFIX=$FOLDER/remote
ulimit -n 100000
locust -f locustfile-single.py --headless --users 1000 --spawn-rate 10 --html $REPORT_NAME --only-summary --csv $CSV_PREFIX -t 10m -s 120 -H https://main-zo6hfspdfa-uc.a.run.app
