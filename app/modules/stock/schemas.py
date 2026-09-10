from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class StockBase(BaseModel):
    medicine_name: str
    quantity: int = Field(default=0, ge=0)


class StockCreate(StockBase):
    pass


class StockUpdate(BaseModel):
    medicine_name: Optional[str] = None
    quantity: Optional[int] = Field(default=None, ge=0)


class StockAdjust(BaseModel):
    delta: int = Field(..., description="Positive to add, negative to dispense/deduct")


class StockResponse(StockBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
