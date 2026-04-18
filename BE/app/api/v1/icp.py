"""
ICP Configuration API Endpoints
GET /api/v1/icp/config - Fetch ICP configuration
"""
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_database
from app.schemas.icp_config import ICPConfigResponseSchema
from bson import ObjectId

router = APIRouter()


async def get_icp_collection():
    """Dependency to get icpConfig collection"""
    db = await get_database()
    return db["icpConfig"]


@router.get("/config", response_model=ICPConfigResponseSchema)
async def get_icp_config(icp_collection=Depends(get_icp_collection)):
    """
    Fetch ICP configuration from database
    Returns the active ICP config document (isActive: true)
    """
    try:
        # Query for active ICP config
        icp_doc = await icp_collection.find_one({"isActive": True})
        
        if not icp_doc:
            # If no active config, return the latest version
            icp_doc = await icp_collection.find_one(sort=[("version", -1)])
        
        if not icp_doc:
            raise HTTPException(status_code=404, detail="No ICP configuration found")
        
        # Convert ObjectId to string
        icp_doc["_id"] = str(icp_doc["_id"])
        
        return ICPConfigResponseSchema(**icp_doc)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ICP config: {str(e)}")
