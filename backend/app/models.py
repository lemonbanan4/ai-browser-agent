import uuid
from sqlalchemy import (
    Column,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    command = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    results = relationship(
        "Result",
        back_populates="task",
        cascade="all, delete-orphan",
    )
    screenshots = relationship(
        "Screenshot",
        back_populates="task",
        cascade="all, delete-orphan",
    )


class Result(Base):
    __tablename__ = "results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )
    steps = Column(JSONB)   # the plan from the LLM
    logs = Column(JSONB)    # logs from Playwright
    output = Column(JSONB)  # results list
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    task = relationship("Task", back_populates="results")


class Screenshot(Base):
    __tablename__ = "screenshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )
    file_path = Column(Text)  # local path or URL (later, if you upload to cloud)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    task = relationship("Task", back_populates="screenshots")
