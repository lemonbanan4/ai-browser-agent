from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.llm import generate_plan
from app.automation import execute_steps
from app.database import Base, engine, SessionLocal
from app import models

from fastapi.staticfiles import StaticFiles
import os


app = FastAPI()

# Serve screenshot files
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "screenshots")
app.mount("/screenshots", StaticFiles(directory=SCREENSHOT_DIR), name="screenshots")


# CORS for Next.js
origins = [
    "http://localhost:3000",
    # add your deployed frontend URL later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables at startup (simple, junior-friendly)
Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/run")
async def run_agent(payload: dict, db: Session = Depends(get_db)):
    command = payload["command"]

    # 1) LLM plan
    plan = generate_plan(command)

    # 2) Execute browser steps
    exec_results = await execute_steps(plan)

    # 3) Save to DB
    #   - Task row
    task = models.Task(command=command)
    db.add(task)
    db.commit()
    db.refresh(task)

    #   - Result row
    db_result = models.Result(
        task_id=task.id,
        steps=json.loads(plan),
        logs=exec_results["logs"],
        output=exec_results["results"],
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)

    # 5) Save screenshots
    for file in exec_results.get("screenshots", []):
        row = models.Screenshot(
            task_id=task.id,
            file_path=f"/screenshots/{file}"
        )
        db.add(row)
    db.commit()

    # 6) Return data to frontend
    return {
        "task_id": str(task.id),
        "plan": json.loads(plan),
        "results": exec_results,
    }


@app.get("/history")
def get_history(limit: int = 20, db: Session = Depends(get_db)):
    """
    Return the latest tasks with their most recent result.
    Simple, junior-friendly implementation: loop + pick last result.
    """
    tasks = (
        db.query(models.Task)
        .order_by(models.Task.created_at.desc())
        .limit(limit)
        .all()
    )

    items = []

    for t in tasks:
        last_result = None
        # Pick latest result if any
        if t.results:
            # last by created_at
            res = sorted(t.results, key=lambda r: r.created_at or datetime.min)[-1]
            last_result = {
                "id": str(res.id),
                "created_at": res.created_at.isoformat() if res.created_at else None,
                "steps": res.steps,
                "logs": res.logs,
                "output": res.output,
            }

        items.append(
            {
                "id": str(t.id),
                "command": t.command,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "last_result": last_result,
            }
        )

    return {"tasks": items}
