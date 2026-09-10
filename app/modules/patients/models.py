from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.modules.visits.models import Visit
    from app.modules.referrals.models import Referral


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    abha_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    village: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Modular relationships
    visits: Mapped[List["Visit"]] = relationship(
        "Visit",
        back_populates="patient",
        cascade="all, delete-orphan"
    )
    referrals: Mapped[List["Referral"]] = relationship(
        "Referral",
        back_populates="patient",
        cascade="all, delete-orphan"
    )
