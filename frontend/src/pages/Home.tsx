import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Article } from '@/services/api';
import { ArticleList, ScrapeButton, ArticleForm } from '@/components/articles';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Newspaper, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SAMPLE_ARTICLES: Article[] = [
  {
    _id: 'sample-1',
    title: 'Introduction to Web Scraping with Python',
    url: 'https://example.com/web-scraping-python',
    content: 'Web scraping is a technique for extracting data from websites. Python offers powerful libraries like BeautifulSoup and Scrapy that make this process straightforward. In this article, we explore the fundamentals of web scraping, best practices, and ethical considerations when collecting data from the web.',
    published_date: '2025-01-02T10:00:00Z',
    source: 'TechBlog',
    status: 'Extracted',
    source_type: 'scraped',
  },
  {
    _id: 'sample-2',
    title: 'Building RESTful APIs with FastAPI',
    url: 'https://example.com/fastapi-tutorial',
    content: 'FastAPI is a modern, fast web framework for building APIs with Python. It provides automatic documentation, type hints support, and exceptional performance. Learn how to create robust backend services with minimal code.',
    published_date: '2025-01-01T14:30:00Z',
    source: 'DevNews',
    status: 'original',
    source_type: 'manual',
  },
];

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getArticles();
      // Use sample data if API returns empty or fails
      setArticles(data.length > 0 ? data : SAMPLE_ARTICLES);
    } catch (err) {
      console.error('Error fetching articles:', err);
      // Fallback to sample data for preview
      setArticles(SAMPLE_ARTICLES);
      setError('Using sample data - API unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleScrape = async () => {
    try {
      setScraping(true);
      const result = await api.triggerScrape();
      toast({
        title: 'Scraping Complete',
        description: result.message || 'Articles have been fetched successfully',
      });
      await fetchArticles();
    } catch (err) {
      toast({
        title: 'Scraping Failed',
        description: err instanceof Error ? err.message : 'Failed to fetch articles',
        variant: 'destructive',
      });
    } finally {
      setScraping(false);
    }
  };

  const handleView = (id: string) => {
    navigate(`/articles/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/articles/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await api.deleteArticle(deleteId);
      toast({
        title: 'Article Deleted',
        description: 'The article has been removed successfully',
      });
      setArticles((prev) => prev.filter((a) => a._id !== deleteId));
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Failed to delete article',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleCreateArticle = async (data: Parameters<typeof api.createArticle>[0]) => {
    try {
      setFormLoading(true);
      await api.createArticle(data);
      toast({
        title: 'Article Created',
        description: 'Your article has been added successfully',
      });
      setShowForm(false);
      await fetchArticles();
    } catch (err) {
      toast({
        title: 'Creation Failed',
        description: err instanceof Error ? err.message : 'Failed to create article',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const scrapedArticles = articles.filter(
    (a) =>  a.status === 'extracted'
  );
  const manualArticles = articles.filter(
    (a) => a.status === 'original'
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Articles Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Manage scraped and manual articles
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ScrapeButton onScrape={handleScrape} loading={scraping} />
              <Button onClick={() => setShowForm(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Article
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showForm && (
          <div className="mb-8">
            <ArticleForm
              onSubmit={handleCreateArticle}
              onCancel={() => setShowForm(false)}
              loading={formLoading}
            />
          </div>
        )}

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Articles ({articles.length})</TabsTrigger>
            <TabsTrigger value="scraped">Scraped ({scrapedArticles.length})</TabsTrigger>
            <TabsTrigger value="manual">Manual ({manualArticles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            <ArticleList
              articles={scrapedArticles}
              loading={loading}
              title="Scraped Articles"
              emptyMessage="No scraped articles yet. Click 'Fetch Latest Articles' to scrape."
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            <ArticleList
              articles={manualArticles}
              loading={loading}
              title="Manual Articles"
              emptyMessage="No manual articles yet. Click 'Add Article' to create one."
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="scraped">
            <ArticleList
              articles={scrapedArticles}
              loading={loading}
              title="Scraped Articles"
              emptyMessage="No scraped articles yet. Click 'Fetch Latest Articles' to scrape."
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="manual">
            <ArticleList
              articles={manualArticles}
              loading={loading}
              title="Manual Articles"
              emptyMessage="No manual articles yet. Click 'Add Article' to create one."
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
