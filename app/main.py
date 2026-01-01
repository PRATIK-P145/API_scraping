from fastapi import FastAPI
from app.database import db
from app.models import ArticleCreate
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.scraper import extract_and_store_oldest_articles

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/articles")
def get_articles():
    articles = []
    for article in db.articles.find():
        article["_id"] = str(article["_id"]) 
        articles.append(article)
    return articles

@app.get("/articles/{article_id}")
def get_article_by_id(article_id: str):
    try:
        object_id = ObjectId(article_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid article ID format")

    article = db.articles.find_one({"_id": object_id})

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    article["_id"] = str(article["_id"])
    return article


@app.post("/articles")
def create_article(article: ArticleCreate):
    article_dict = article.dict()
    result = db.articles.insert_one(article_dict)

    return {
        "message": "Article created successfully",
        "id": str(result.inserted_id)
    }


@app.post("/scrape/oldest")
def scrape_oldest_articles():
    inserted = extract_and_store_oldest_articles()
    return {
        "message": "Scraping completed",
        "inserted_articles": inserted
    }

@app.put("/articles/{article_id}")
def update_article(article_id: str, article: ArticleCreate):
    try:
        object_id = ObjectId(article_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid article ID format")

    result = db.articles.update_one(
        {"_id": object_id},
        {"$set": article.dict()}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")

    return {
        "message": "Article updated successfully"
    }

@app.delete("/articles/{article_id}")
def delete_article(article_id: str):
    try:
        object_id = ObjectId(article_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid article ID format")

    result = db.articles.delete_one({"_id": object_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")

    return {
        "message": "Article deleted successfully"
    }




