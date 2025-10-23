# File: BACKEND/core_api_service/app/config.py

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

class Settings(BaseSettings):
    """
    Manages application settings using environment variables.
    """
    # --- Global Configs ---
    # These MUST be provided by the environment
    APP_ID: str = os.getenv("__app_id", "default-app-id")
    FIREBASE_CONFIG: str = os.getenv("__firebase_config", "{}")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "") # Get your API key from Google AI Studio

    class Config:
        # This allows loading from a .env file (if you use one)
        env_file = ".env"
        case_sensitive = True

# Create a single settings instance to be imported by other modules
settings = Settings()

