from os import getenv
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class BaseConfig:
    APP_HOST = getenv("APP_HOST", "0.0.0.0")
    APP_PORT = int(getenv("APP_PORT", "4001"))
    SECRET_KEY = getenv("SECRET_KEY", "change-me")

    SQLALCHEMY_DATABASE_URI = getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'database.db'}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SUPABASE_URL = getenv("SUPABASE_URL")
    SUPABASE_KEY = getenv("SUPABASE_KEY")

    JWT_SECRET_KEY = getenv("JWT_SECRET_KEY", "change-me-jwt")
    JWT_EXPIRATION_HOURS = int(getenv("JWT_EXPIRATION_HOURS", "24"))

    AUTH_REQUIRED = getenv("AUTH_REQUIRED", "false").lower() == "true"
    # 4201 = public-frontend, 4200 = collector-frontend
    CORS_ORIGINS = getenv("CORS_ORIGINS", "http://localhost:4201,http://localhost:4200").split(",")

    JSON_SORT_KEYS = False


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    ENV = "development"


class TestingConfig(BaseConfig):
    TESTING = True
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = getenv("TEST_DATABASE_URL", "sqlite:///:memory:")


class ProductionConfig(BaseConfig):
    DEBUG = False
    ENV = "production"
    AUTH_REQUIRED = True


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
