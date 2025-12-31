import requests
from bs4 import BeautifulSoup

BLOGS_URL = "https://beyondchats.com/blogs/"

def test_fetch_blogs_page():
    response = requests.get(BLOGS_URL)
    response.raise_for_status()  # fails fast if request is bad

    soup = BeautifulSoup(response.text, "html.parser")

    print("Page title:", soup.title.string)

def get_last_page_number():
    response = requests.get(BLOGS_URL)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    page_links = soup.find_all("a", class_="page-numbers")

    page_numbers = []

    for link in page_links:
        text = link.get_text().strip()
        if text.isdigit():
            page_numbers.append(int(text))

    last_page = max(page_numbers)
    print("Last page number:", last_page)

