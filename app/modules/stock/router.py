from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.modules.stock.models import Stock
from app.modules.stock.schemas import StockCreate, StockResponse, StockUpdate, StockAdjust

router = APIRouter()


@router.post("/", response_model=StockResponse, status_code=status.HTTP_201_CREATED)
def create_stock_item(stock_in: StockCreate, db: Session = Depends(get_db)):
    """Add a new medicine / supply item to inventory."""
    existing = db.execute(
        select(Stock).where(Stock.medicine_name.ilike(stock_in.medicine_name.strip()))
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Medicine '{stock_in.medicine_name}' already exists in inventory with ID {existing.id}."
        )

    item = Stock(medicine_name=stock_in.medicine_name.strip(), quantity=stock_in.quantity)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/", response_model=List[StockResponse])
def list_stock(
    search: Optional[str] = Query(None, description="Search by medicine name"),
    low_stock_threshold: Optional[int] = Query(None, description="Filter items at or below quantity"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List stock items with optional search and low-stock filter."""
    query = select(Stock)
    if search:
        query = query.where(Stock.medicine_name.ilike(f"%{search}%"))
    if low_stock_threshold is not None:
        query = query.where(Stock.quantity <= low_stock_threshold)
    query = query.order_by(Stock.medicine_name.asc()).offset(skip).limit(limit)
    return db.execute(query).scalars().all()


@router.get("/{stock_id}", response_model=StockResponse)
def get_stock_item(stock_id: int, db: Session = Depends(get_db)):
    """Get stock item by ID."""
    item = db.get(Stock, stock_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock item with ID {stock_id} not found."
        )
    return item


@router.patch("/{stock_id}", response_model=StockResponse)
def update_stock_item(
    stock_id: int,
    stock_update: StockUpdate,
    db: Session = Depends(get_db)
):
    """Update stock details or replace quantity directly."""
    item = db.get(Stock, stock_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock item with ID {stock_id} not found."
        )

    update_data = stock_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.post("/{stock_id}/adjust", response_model=StockResponse)
def adjust_stock(
    stock_id: int,
    adjust_in: StockAdjust,
    db: Session = Depends(get_db)
):
    """Adjust stock quantity (dispense or receive medicines)."""
    item = db.get(Stock, stock_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock item with ID {stock_id} not found."
        )

    new_quantity = item.quantity + adjust_in.delta
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Current quantity is {item.quantity}, attempted to deduct {abs(adjust_in.delta)}."
        )

    item.quantity = new_quantity
    db.commit()
    db.refresh(item)
    return item
