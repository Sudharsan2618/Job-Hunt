"""
MongoDB Connection Setup for HR Assistant
Uses motor (async MongoDB driver) for FastAPI
Ported from Job-Hunt/BE/app/database.py
"""

from motor.motor_asyncio import AsyncIOMotorClient
from .config import hr_settings
import logging

logger = logging.getLogger(__name__)

# Global MongoDB client instance
client: AsyncIOMotorClient | None = None
database = None


async def connect_to_mongo():
    """
    Connect to MongoDB on application startup.
    Creates a connection pool that handles multiple concurrent requests.
    """
    global client, database

    logger.info("HR Assistant: Connecting to MongoDB at %s", hr_settings.MONGODB_URI)

    client = AsyncIOMotorClient(
        hr_settings.MONGODB_URI,
        maxPoolSize=10,
        minPoolSize=2,
        maxIdleTimeMS=60000,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
        retryWrites=True,
        w="majority",
    )

    database = client[hr_settings.DATABASE_NAME]

    # Verify connection
    try:
        await database.command("ping")
        logger.info("HR Assistant: Connected to MongoDB database: %s", hr_settings.DATABASE_NAME)
    except Exception as e:
        logger.error("HR Assistant: MongoDB connection failed: %s", e)
        raise


async def close_mongo_connection():
    """Close MongoDB connection on application shutdown."""
    global client, database

    if client:
        client.close()
        logger.info("HR Assistant: MongoDB connection closed")

    client = None
    database = None


async def get_database():
    """
    Dependency function to get database session.
    Use this in route handlers: db = Depends(get_database)
    """
    if database is None:
        raise RuntimeError("HR Assistant MongoDB not connected. Call connect_to_mongo() first.")
    return database


async def get_collection(collection_name: str):
    """Get a specific MongoDB collection."""
    db = await get_database()
    return db[collection_name]


async def get_destinationone_database():
    """
    Get the DestinationOne database (for outreachTemplates collection).
    Uses the same MongoDB client connection.
    """
    global client
    if client is None:
        raise RuntimeError("MongoDB client not connected. Call connect_to_mongo() first.")
    return client["DestinationOne"]


async def get_destinationone_collection(collection_name: str):
    """Get a specific collection from DestinationOne database."""
    db = await get_destinationone_database()
    return db[collection_name]
