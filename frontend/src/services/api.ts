const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Article {
  _id: string;
  title: string;
  url: string;
  content: string;
  published_date: string | null;
  source: string;
  status: string;
  source_type?: 'scraped' | 'manual';
}

export interface ArticleInput {
  title: string;
  url: string;
  content: string;
  published_date?: string | null;
  source?: string;
  status?: string;
  source_type?: 'scraped' | 'manual';
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Fetch all articles
  async getArticles(): Promise<Article[]> {
    const response = await fetch(`${API_BASE_URL}/articles`);
    return handleResponse<Article[]>(response);
  },

  // Fetch single article by ID
  async getArticle(id: string): Promise<Article> {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`);
    return handleResponse<Article>(response);
  },

  // Create new article
  async createArticle(article: ArticleInput): Promise<Article> {
    const response = await fetch(`${API_BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...article,
        source_type: 'manual',
        status: article.status || 'original',
      }),
    });
    return handleResponse<Article>(response);
  },

  // Update article
  async updateArticle(id: string, article: Partial<ArticleInput>): Promise<Article> {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(article),
    });
    return handleResponse<Article>(response);
  },

  // Delete article
  async deleteArticle(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }
  },

  // Trigger scraping
  async triggerScrape(): Promise<{ message: string; articles_count?: number }> {
    const response = await fetch(`${API_BASE_URL}/scrape/oldest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'extracted',
      }),
    });
  
    return handleResponse<{ message: string; articles_count?: number }>(response);
  }
}
