from locust import FastHttpUser, task, between, HttpUser
import requests
import random
import re
from locust import events

auth_body = {
    "User": {
        "name": "ece30861defaultadminuser",
        "isAdmin": True
    },
    "Secret": {
        "password": "correcthorsebatterystaple123(!__+@**(A'\"`;DROP TABLE packages;"
    }
}


class DefaultUser(FastHttpUser):
    wait_time = between(0.1, 1)
    connection_timeout = 120
    network_timeout = 120

    def on_start(self):
        self.headers = {'Content-Type': 'application/json'}
        for i in range(10):
            response = self.client.put('/authenticate', json=auth_body)
            if response.status_code == 200:
                break
        self.headers['X-Authorization'] = f'{response.text}'

    @task(10)
    def package_get(self):
        package_id = 'underscore'
        response = self.client.get(f'/package/{package_id}', headers=self.headers)
