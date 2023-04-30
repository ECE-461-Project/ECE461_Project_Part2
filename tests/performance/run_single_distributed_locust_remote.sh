#!/usr/bin/env bash
TIME=$(date +%Y-%m-%d-%T)
FOLDER=remote_reports/$TIME
mkdir -p $FOLDER
REPORT_NAME=$FOLDER/remote_report.html
CSV_PREFIX=$FOLDER/remote
ulimit -n 100000
python auth-reset-post-one.py
locust -f locustfile-single-distributed.py --headless --users 500 --spawn-rate 10 --html $REPORT_NAME --only-summary --csv $CSV_PREFIX -t 5m -s 10 -H https://main-zo6hfspdfa-uc.a.run.app --master --expect-workers=12 &
locust -f locustfile-single-distributed.py --worker &
locust -f locustfile-single-distributed.py --worker &
locust -f locustfile-single-distributed.py --worker &
locust -f locustfile-single-distributed.py --worker &
locust -f locustfile-single-distributed.py --worker &
locust -f locustfile-single-distributed.py --worker &
locust -f locustfile-single-distributed.py --worker &
locust -f locustfile-single-distributed.py --worker &
locust -f locustfile-single-distributed.py --worker &
locust -f locustfile-single-distributed.py --worker &
locust -f locustfile-single-distributed.py --worker &
locust -f locustfile-single-distributed.py --worker &
