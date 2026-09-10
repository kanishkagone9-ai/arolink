from typing import Optional
from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AbhaVerificationLog(Base):
    """Optional audit log for ABHA OTP requests and verifications."""
    __tablename__ = "abha_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    txn_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    abha_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
