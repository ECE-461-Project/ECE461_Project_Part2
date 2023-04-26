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
with open('github_urls.txt') as f:
    lines = f.readlines()

not_uploaded_urls = set([line.strip() for line in lines])
uploaded_urls = set()

run = []


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("A new test is starting")
    r = requests.put(f'{environment.host}/authenticate', json=auth_body)
    headers = {'Content-Type': 'application/json'}
    headers['X-Authorization'] = f'{r.text}'
    r = requests.delete(f'{environment.host}/reset', headers=headers)
    if r.status_code == 200:
        print('reset success')
    else:
        print('reset fail')
    #r = requests.put('')


def run_once(self):
    if not run:
        self.client.delete(f'/reset', headers=self.headers)
        print('run reset')
        run.append(1)


class DefaultUser(FastHttpUser):
    wait_time = between(0.1, 1)
    connection_timeout = 120
    network_timeout = 120

    def on_start(self):
        self.headers = {'Content-Type': 'application/json'}
        response = self.client.put('/authenticate', json=auth_body)
        self.headers['X-Authorization'] = f'{response.text}'
        # run_once(self)

    @task(10)
    def package_get(self):
        if uploaded_urls:
            url = random.choice(uploaded_urls)
            package_id = url  # it is package id now
            response = self.client.get(
                f'/package/{package_id}', headers=self.headers)

    @task(1)
    def package_post_url(self):
        try:
            if not_uploaded_urls:
                url = random.choice(list(not_uploaded_urls))
                json_data = {'URL': url}
                response = self.client.post(
                    f'/package', headers=self.headers, json=json_data)
                if response.status_code == 201:
                    d = response.json()
                    uploaded_urls.add(d['metadata']['ID'])
                    not_uploaded_urls.remove(url)
                elif response.status_code == 503:
                    print(f'{url}: {response.status_code}')
                elif response.status_code == 400:
                    print(f'{url}: {response.status_code}')
                elif response.status_code == 424:
                    not_uploaded_urls.remove(url)
                    print(f'Rating too low: {url}')
        except Exception as e:
            print(e)
