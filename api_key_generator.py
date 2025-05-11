import json
import uuid
import os
from datetime import datetime
from typing import List, Dict, Optional

API_KEYS_FILE = "api_keys.json"


def load_api_keys() -> List[Dict]:
    """Load API keys from the JSON file."""
    try:
        if os.path.exists(API_KEYS_FILE):
            with open(API_KEYS_FILE, "r") as file:
                return json.load(file)
    except Exception as e:
        print(f"Error loading API keys: {e}")
    return []


def save_api_keys(api_keys: List[Dict]) -> None:
    """Save API keys to the JSON file."""
    try:
        with open(API_KEYS_FILE, "w") as file:
            json.dump(api_keys, file, indent=2)
    except Exception as e:
        print(f"Error saving API keys: {e}")


def generate_api_key() -> Optional[str]:
    """Generate a new API key and save it to the JSON file."""
    try:
        api_keys = load_api_keys()
        new_key = str(uuid.uuid4())
        new_api_key = {"key": new_key, "createdAt": datetime.now().isoformat()}
        api_keys.append(new_api_key)
        save_api_keys(api_keys)
        return new_key
    except Exception as e:
        print(f"Error generating API key: {e}")
        return None


if __name__ == "__main__":
    new_api_key = generate_api_key()
    if new_api_key:
        print(f"Generated new API key: {new_api_key}")
    else:
        print("Failed to generate a new API key.")
