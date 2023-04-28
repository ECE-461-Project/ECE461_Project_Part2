You need python ^3.6
You need to run pip install locust

You need to check your ulimit: ulimit -n
If it is not at least 10000, locust displays a warning
Running ulimit -n 10000 increases the amount of open file descriptors available. The scripts run this command but if your system has a hard limit less than 10000, it will fail. Please run ulimit -n 10000 manually just to make sure

run_single_locust_* runs the locust test where only package is POSTed and everything GETs this one package.

run_locust_* runs the locust test that uploads 1000 packages, and GETs these packages randomly as they are uploaded. 


For baseline for performance test, please run run_single_locust_remote.sh
This will create a remote_reports folder that contains a report at start time of performance test.

