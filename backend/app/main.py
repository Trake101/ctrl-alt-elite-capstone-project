from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from .db import Base, engine, get_db
from .models import Widget

app = FastAPI()

@app.on_event("startup")
def on_startup():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health(db: Session = Depends(get_db)):
    # DB round trip to ensure it's really up
    db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "up"}

@app.post("/api/widgets")
def create_widget(name: str, db: Session = Depends(get_db)):
    w = Widget(name=name)
    db.add(w)
    db.commit()
    db.refresh(w)
    return {"id": w.id, "name": w.name}

@app.get("/api/widgets")
def list_widgets(db: Session = Depends(get_db)):
    return [{"id": w.id, "name": w.name} for w in db.query(Widget).all()]
