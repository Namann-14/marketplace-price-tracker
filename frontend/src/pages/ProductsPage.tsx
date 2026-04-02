import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, ChevronLeft, ChevronRight, SlidersHorizontal, X, Search } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import api from '@/lib/api';

interface Product {
  id: number;
  source: string;
  external_id: string;
  brand: string | null;
  title: string;
  category: string | null;
  condition: string | null;
  color: string | null;
  is_sold: boolean;
  image_url: string | null;
  images: string[] | null;
  product_url: string;
  currency: string;
  current_price: number | null;
  last_seen: string | null;
}

const SOURCE_OPTIONS = ['grailed', 'fashionphile', '1stdibs'];

const SOURCE_COLORS: Record<string, string> = {
  grailed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  fashionphile: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  '1stdibs': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state — initialise from URL params
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [source, setSource] = useState(searchParams.get('source') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [brand, setBrand] = useState(searchParams.get('brand') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') ?? '');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1));
  const LIMIT = 20;

  const fetchProducts = useCallback(async (pg: number) => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page: pg, limit: LIMIT };
      if (q) params.q = q;
      if (source) params.source = source;
      if (category) params.category = category;
      if (brand) params.brand = brand;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;

      const res = await api.get('/products', { params });
      setProducts(res.data.items);
      setTotal(res.data.total);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? JSON.stringify(detail) : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [q, source, category, brand, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts(page);
  }, [fetchProducts, page]);

  const applyFilters = () => {
    setPage(1);
    fetchProducts(1);
  };

  const clearFilters = () => {
    setQ(''); setSource(''); setCategory(''); setBrand('');
    setMinPrice(''); setMaxPrice(''); setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT);
  const hasFilters = q || source || category || brand || minPrice || maxPrice;

  return (
    <SidebarProvider>
      <AppSidebar activeTab="products" onTabChange={(id) => {
        if (id === 'overview') navigate('/dashboard');
      }} />

      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-background text-foreground">
          {/* Ambient glow */}
          <div className="absolute top-0 right-1/4 w-[400px] h-[250px] dark:bg-primary/15 bg-transparent rounded-full blur-[100px] pointer-events-none -z-10" />

          {/* Header */}
          <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border bg-background/80 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
              <div>
                <h1 className="text-lg font-bold tracking-tight text-foreground">Products</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {loading ? 'Loading…' : `${total.toLocaleString()} listings`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-1 justify-end">
              <form
                onSubmit={(e) => { e.preventDefault(); applyFilters(); }}
                className="relative hidden sm:block"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search title..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  className="pl-9 pr-4 py-1.5 rounded-full border border-border bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64 transition-all text-foreground"
                />
              </form>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  showFilters || hasFilters
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Filters</span>
                {hasFilters && <span className="bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
              </button>
              <AnimatedThemeToggler className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" />
            </div>
          </header>

          {/* Filter Bar */}
          {showFilters && (
            <div className="border-b border-border bg-muted/30 px-4 sm:px-8 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Source dropdown */}
                <select
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  className="rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:border-primary/50 transition-colors"
                >
                  <option value="">All Sources</option>
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Category */}
                <input
                  type="text"
                  placeholder="Category…"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:border-primary/50 transition-colors"
                />

                {/* Brand */}
                <input
                  type="text"
                  placeholder="Brand…"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:border-primary/50 transition-colors"
                />

                {/* Min Price */}
                <input
                  type="number"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:border-primary/50 transition-colors"
                />

                {/* Max Price */}
                <input
                  type="number"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:border-primary/50 transition-colors"
                />

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={applyFilters}
                    className="flex-1 bg-primary text-primary-foreground text-sm font-semibold rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
                  >
                    Apply
                  </button>
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="p-2 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Clear filters"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <main className="flex-1 p-6 sm:p-8">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
                {error}
              </div>
            )}

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
                    <div className="h-48 bg-muted" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-5 bg-muted rounded w-1/3 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                <Package size={48} className="opacity-30" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">
                  {hasFilters ? 'Try adjusting your filters.' : 'Run a refresh to ingest data.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map(product => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer group hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                  >
                    {/* Image */}
                    <div className="h-48 bg-muted overflow-hidden relative flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Package size={40} className="text-muted-foreground opacity-30" />
                      )}
                      {/* Source badge */}
                      <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${SOURCE_COLORS[product.source] ?? 'bg-muted text-muted-foreground border-border'}`}>
                        {product.source}
                      </span>
                      {product.is_sold && (
                        <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/30">
                          Sold
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground capitalize mb-0.5">{product.brand ?? 'Unknown brand'}</p>
                      <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-foreground">
                          {product.current_price != null
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency ?? 'USD' }).format(product.current_price)
                            : 'N/A'}
                        </span>
                        {product.condition && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            {product.condition}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && total > LIMIT && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()} products
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-sm font-medium text-foreground px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
