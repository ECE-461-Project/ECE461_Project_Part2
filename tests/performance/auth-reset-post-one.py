import requests
import random
import re

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


def on_test_start():
    print("A new test is starting")
    r = requests.put(f'https://main-zo6hfspdfa-uc.a.run.app/authenticate', json=auth_body)
    headers = {'Content-Type': 'application/json'}
    headers['X-Authorization'] = f'{r.text}'
    r = requests.delete(f'https://main-zo6hfspdfa-uc.a.run.app/reset', headers=headers)
    if r.status_code == 200:
        print('reset success')
    else:
        print('reset fail')
    if not_uploaded_urls:
        url = random.choice(list(not_uploaded_urls))
        json_data = {'URL': url}
        headers['debloat'] = '1'
        response = requests.post(
            f'https://main-zo6hfspdfa-uc.a.run.app/package', headers=headers, json=json_data)
    # r = requests.put('')
        print(response)


on_test_start()
