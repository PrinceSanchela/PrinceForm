import logging
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

logger = logging.getLogger("prince_form.database")

class DatabaseHelper:
    def __init__(self):
        self.client = None
        self.db = None

    async def connect_db(self):
        """Establish asynchronous connection to MongoDB and ensure indexes."""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.client[settings.DATABASE_NAME]
            
            # Ping database to verify connection
            await self.db.command("ping")
            logger.info("Successfully connected to MongoDB!")
            
            # Ensure indexes for fast queries
            await self.db["forms"].create_index("createdAt")
            await self.db["responses"].create_index("formId")
            await self.db["responses"].create_index("submittedAt")
            
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {str(e)}")
            self.client = None
            self.db = None
            raise e

    async def close_db(self):
        """Close MongoDB client connection."""
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection.")

db = DatabaseHelper()
