import sys
import pathlib
p=pathlib.Path(r'C:/Users/UDITH/Documents/GitHub/TEAM-QWERTY/BACKEND/core_api_service')
sys.path.insert(0,str(p))
from app.main import app
print('Registered routes:')
for r in app.routes:
    try:
        print(type(r).__name__, getattr(r,'path',''), getattr(r,'methods',None))
    except Exception:
        pass
