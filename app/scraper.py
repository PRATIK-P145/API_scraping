import requests
from bs4 import BeautifulSoup
from datetime import datetime
from app.database import db


BLOGS_URL = "https://beyondchats.com/blogs/"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

REQUEST_TIMEOUT = 15

def get_last_page_number():
    response = requests.get(BLOGS_URL, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    page_links = soup.find_all("a", class_="page-numbers")

    numbers = [int(link.text) for link in page_links if link.text.isdigit()]
    return max(numbers)


def collect_5_oldest_article_urls():
    last_page = get_last_page_number()
    collected_urls = []

    current_page = last_page

    while len(collected_urls) < 5 and current_page > 0:
        page_url = f"{BLOGS_URL}page/{current_page}/"
        print(f"Scanning page {current_page}")

        response = requests.get(page_url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        articles = soup.find_all("article", class_="entry-card")

        # Reverse → oldest first
        articles.reverse()

        for article in articles:
            title_tag = article.find("h2", class_="entry-title")
            if not title_tag:
                continue

            link = title_tag.find("a")
            url = link["href"]

            if url not in collected_urls:
                collected_urls.append(url)

            if len(collected_urls) == 5:
                break

        current_page -= 1

    return collected_urls

def extract_article_data(article_url):
    response = requests.get(article_url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    title = soup.find("h1").get_text(strip=True)

    author, published_date = extract_author_and_date(soup)

    content_div = soup.select_one(".elementor-widget-theme-post-content")
    paragraphs = content_div.find_all("p") if content_div else []
    content = "\n\n".join(p.get_text(strip=True) for p in paragraphs)

    return {
        "title": title,
        "url": article_url,
        "author": author,
        "content": content,
        "published_date": published_date,
        "source": "beyondchats",
        "status": "Extracted",
        "created_at": datetime.utcnow()
    }

def extract_author_and_date(soup):
    author = None
    published_date = None

    author_tag = soup.find(
        "span",
        class_="elementor-post-info__item--type-author"
    )
    if author_tag:
        author = author_tag.get_text(strip=True)

    time_tag = soup.find("time")
    if time_tag:
        published_date = time_tag.get_text(strip=True)

    return author, published_date



def store_article_if_not_exists(article_data):
    if db.articles.find_one({"url": article_data["url"]}):
        print("Skipping duplicate:", article_data["title"])
        return False

    db.articles.insert_one(article_data)
    print("Inserted:", article_data["title"])
    return True


def extract_and_store_oldest_articles():
    urls = collect_5_oldest_article_urls()
    inserted = 0

    for url in urls:
        try:
            article_data = extract_article_data(url)
            if store_article_if_not_exists(article_data):
                inserted += 1
        except Exception as e:
            print("Failed for:", url)
            print(e)

    print(f"Total articles inserted: {inserted}")
    return inserted

