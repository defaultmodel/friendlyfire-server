import json
import uuid
import os
from datetime import datetime

API_KEYS_FILE = 'api_keys.json'

def load_api_keys():
    if os.path.exists(API_KEYS_FILE):
        with open(API_KEYS_FILE, 'r') as file:
            return json.load(file)
    return []

def save_api_keys(api_keys):
    with open(API_KEYS_FILE, 'w') as file:
        json.dump(api_keys, file, indent=2)

def generate_api_key():
    api_keys = load_api_keys()
    new_key = str(uuid.uuid4())
    new_api_key = {
        'key': new_key,
        'createdAt': datetime.now().isoformat()
    }
    api_keys.append(new_api_key)
    save_api_keys(api_keys)
    return new_key

if __name__ == '__main__':
    new_api_key = generate_api_key()
    print(f'Generated new API key: {new_api_key}')
