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

not_uploaded_urls = set()
not_uploaded_urls.add('https://github.com/jashkenas/underscore')
uploaded_package_id = set()

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
    if not_uploaded_urls:
        url = random.choice(list(not_uploaded_urls))
        json_data = {'URL': url}
        response = requests.post(
            f'{environment.host}/package', headers=headers, json=json_data)
        package_post_url_response_handler(response, url)
    # r = requests.put('')


def package_post_url_response_handler(response, url):
    if response.status_code == 201:
        d = response.json()
        uploaded_package_id.add(d['metadata']['ID'])
        not_uploaded_urls.remove(url)
        print(f'{response.status_code}: {url}')
    elif response.status_code == 400:
        print(f'{response.status_code}: {url}')
    elif response.status_code == 409:
        print(f'{response.status_code}: {url}')
    elif response.status_code == 424:
        not_uploaded_urls.remove(url)
        print(f'{response.status_code}: {url}')
    elif response.status_code >= 500:
        print(f'{response.status_code}: {url}')


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
        if uploaded_package_id:
            package_id = random.choice(list(uploaded_package_id))
            response = self.client.get(
                f'/package/{package_id}', headers=self.headers)
