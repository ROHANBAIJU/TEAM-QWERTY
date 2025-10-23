from .websocket_manager import ConnectionManager

# Single shared ConnectionManager for the application
frontend_manager = ConnectionManager()
