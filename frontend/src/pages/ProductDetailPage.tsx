import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, Package, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';

interface PriceHistoryPoint {
  price: number;
  recorded_at: string;
}

interface ProductDetail {
  id: number;
  source: string;
  external_id: string;
  brand: string | null;
  title: string;
  category: string | null;
  size: string | null;
  condition: string | null;
  color: string | null;
  is_sold: boolean;
  image_url: string | null;
  images: string[] | null;
  product_url: string;
  currency: string;
  current_price: number | null;
  last_seen: string | null;
  created_at: string;
  price_history: PriceHistoryPoint[];
}

const SOURCE_COLORS: Record<string, string> = {
  grailed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  fashionphile: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  '1stdibs': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.get(`/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(err => {
        if (err?.response?.status === 404) {
          setError('Product not found.');
        } else {
          const detail = err?.response?.data?.detail;
          setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? JSON.stringify(detail) : 'Failed to load product.');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const chartData = product?.price_history.map(h => ({
    date: format(new Date(h.recorded_at), 'MMM d'),
    price: h.price,
    full_date: h.recorded_at,
  })) ?? [];

  const priceChange = chartData.length >= 2
    ? chartData[chartData.length - 1].price - chartData[0].price
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading product…</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 text-muted-foreground">
          <Package size={48} className="mx-auto opacity-30" />
          <p className="text-lg font-medium text-foreground">{error ?? 'Product not found'}</p>
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 mx-auto text-sm text-primary hover:underline"
          >
            <ArrowLeft size={14} /> Back to Products
          </button>
        </div>
      </div>
    );
  }

  const images = (product.images && product.images.length > 0)
    ? product.images
    : product.image_url ? [product.image_url] : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/3 w-[500px] h-[300px] dark:bg-primary/15 bg-transparent rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-20 h-14 flex items-center gap-4 px-4 sm:px-8 border-b border-border bg-background/90 backdrop-blur-md">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Products
        </button>
        <span className="text-border">|</span>
        <h1 className="text-sm font-semibold text-foreground truncate max-w-xs">{product.title}</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Top section: image + meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image carousel */}
          <div className="relative rounded-2xl border border-border bg-muted overflow-hidden">
            <div className="aspect-square flex items-center justify-center p-6">
              {images.length > 0 ? (
                <img
                  src={images[imgIndex]}
                  alt={product.title}
                  className="w-full h-full object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <Package size={64} className="text-muted-foreground opacity-30" />
              )}
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIndex(i => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background text-foreground p-1.5 rounded-full backdrop-blur transition-all"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  onClick={() => setImgIndex(i => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background text-foreground p-1.5 rounded-full backdrop-blur transition-all"
                >
                  <ArrowLeft size={16} className="rotate-180" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? 'bg-primary' : 'bg-primary/30'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Source badge */}
            <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full border ${SOURCE_COLORS[product.source] ?? 'bg-muted text-muted-foreground border-border'}`}>
              {product.source}
            </span>
          </div>

          {/* Product meta */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm text-muted-foreground capitalize mb-1">{product.brand ?? 'Unknown Brand'}</p>
              <h2 className="text-2xl font-bold text-foreground leading-snug">{product.title}</h2>
            </div>

            <div className="text-3xl font-black text-foreground">
              {product.current_price != null
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency ?? 'USD' }).format(product.current_price)
                : 'Price unavailable'}
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Condition', value: product.condition ?? 'N/A' },
                { label: 'Category', value: product.category ?? 'N/A' },
                { label: 'Size', value: product.size ?? 'N/A' },
                { label: 'Color', value: product.color ?? 'N/A' },
                { label: 'Status', value: product.is_sold ? '🔴 Sold' : '🟢 Available' },
                { label: 'Currency', value: product.currency },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/50 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <a
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-xl px-6 py-3 hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={16} /> View Original Listing
            </a>
          </div>
        </div>

        {/* Price History Chart */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Price History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {chartData.length} data point{chartData.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
            {priceChange !== null && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${priceChange >= 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {priceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {priceChange >= 0 ? '+' : ''}
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(priceChange)}
              </div>
            )}
          </div>

          {chartData.length <= 1 ? (
            <div className="h-52 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <TrendingUp size={32} className="opacity-30" />
              <p className="text-sm">No price history yet — check back after the next refresh.</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    tickFormatter={v => `$${v.toLocaleString()}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      color: 'var(--card-foreground)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                    }}
                    formatter={(val: any) => [
                      new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(val),
                      'Price',
                    ]}
                    labelFormatter={label => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ fill: 'var(--primary)', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'var(--background)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Additional info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="bg-muted/30 rounded-xl px-4 py-3 border border-border">
            <p className="text-xs uppercase tracking-widest mb-1">External ID</p>
            <p className="font-mono text-foreground">{product.external_id}</p>
          </div>
          <div className="bg-muted/30 rounded-xl px-4 py-3 border border-border">
            <p className="text-xs uppercase tracking-widest mb-1">Last Seen</p>
            <p className="text-foreground">
              {product.last_seen ? format(new Date(product.last_seen), 'MMM d, yyyy HH:mm') : 'N/A'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
