"""
MongoDB Connection Setup
Uses motor (async MongoDB driver) for FastAPI
Handles connection pooling, session management, and lifecycle events
"""

from motor.motor_asyncio import AsyncIOMotorClient
from typing import AsyncGenerator
from app.config import settings

# Global MongoDB client instance
client: AsyncIOMotorClient | None = None
database = None


async def connect_to_mongo():
    """
    Connect to MongoDB on application startup
    Creates a connection pool that handles multiple concurrent requests
    """
    global client, database
    
    print(f"Connecting to MongoDB at {settings.MONGODB_URI}")
    
    client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        # Connection pool settings for 5+ concurrent users
        maxPoolSize=10,              # Maximum connections in pool
        minPoolSize=2,               # Minimum connections to keep alive
        maxIdleTimeMS=60000,         # Close idle connections after 60s
        serverSelectionTimeoutMS=5000,  # Server selection timeout
        connectTimeoutMS=10000,      # Connection timeout
        retryWrites=True,            # Retry writes on network errors
        w="majority"                 # Write concern: majority acknowledgment
    )
    
    database = client[settings.DATABASE_NAME]
    
    # Verify connection
    try:
        await database.command("ping")
        print(f"✓ Connected to MongoDB database: {settings.DATABASE_NAME}")
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        raise
 
 
async def close_mongo_connection():
    """
    Close MongoDB connection on application shutdown
    Properly cleans up the connection pool
    """
    global client, database
    
    if client:
        client.close()
        print("✓ MongoDB connection closed")
    
    client = None
    database = None
 
 
async def get_database():
    """
    Dependency function to get database session
    Use this in your route handlers:
        @router.get("/some-endpoint")
        async def some_endpoint(db = Depends(get_database)):
            ...
    """
    if database is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    
    return database
 
 
async def get_collection(collection_name: str):
    """
    Dependency function to get a specific collection
    Use this in your route handlers:
        @router.get("/some-endpoint")
        async def some_endpoint(jobs = Depends(get_collection("jobs"))):
            ...
    """
    db = await get_database()
    return db[collection_name]
