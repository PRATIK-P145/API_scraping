from fastapi import FastAPI
from app.database import db
from app.models import ArticleCreate
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

app = FastAPI()

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