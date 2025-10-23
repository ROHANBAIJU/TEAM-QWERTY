import importlib
packages = [
    'fastapi', 'uvicorn', 'pydantic', 'pydantic_settings', 'dotenv', 'httpx', 'google.cloud.firestore'
]
for pkg in packages:
    try:
        importlib.import_module(pkg)
        print(pkg + ': OK')
    except Exception as e:
        print(pkg + ': ERROR ->', e)
