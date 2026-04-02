import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { RefreshCcw, Package, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import api from '@/lib/api';

const COLORS = [
  'var(--primary)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

interface Analytics {
  total_products: number;
  total_price_changes: number;
  by_source: { source: string; count: number; avg_price: number | null }[];
  by_category: { category: string | null; count: number; avg_price: number | null }[];
  by_brand: { brand: string | null; count: number }[];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics>({
    total_products: 0,
    total_price_changes: 0,
    by_source: [],
    by_category: [],
    by_brand: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/analytics');
      setAnalytics(res.data);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? JSON.stringify(detail) : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await api.post('/refresh');
      setTimeout(() => {
        fetchAnalytics();
        setRefreshing(false);
      }, 3000);
    } catch (e) {
      console.error(e);
      setRefreshing(false);
    }
  };

  const categoryData = analytics.by_category
    .filter(c => c.category)
    .map(c => ({ category: c.category!, avg_price: c.avg_price ?? 0, count: c.count }));

  return (
    <SidebarProvider>
      <AppSidebar activeTab="overview" onTabChange={(id) => {
        if (id === 'products') navigate('/');
      }} />

      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[300px] dark:bg-primary/20 bg-transparent rounded-full blur-[120px] pointer-events-none -z-10" />

          {/* Header */}
          <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border bg-background/80 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
              <div>
                <h1 className="text-lg font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Marketplace Price Monitor</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <AnimatedThemeToggler className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" />
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-primary text-primary-foreground font-bold tracking-wider rounded-lg px-3 sm:px-6 py-2 shadow-sm transition-all hover:opacity-90 flex items-center gap-2 text-sm"
              >
                <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{refreshing ? 'SYNCING...' : 'REFRESH'}</span>
              </button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-6 sm:p-8 space-y-8">

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Products */}
              <div className="bg-card text-card-foreground shadow-sm rounded-xl border border-border p-6 flex flex-col gap-2 relative overflow-hidden group">
                <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Total Tracked</p>
                <div className="flex items-end gap-3">
                  <h2 className="text-4xl font-bold text-foreground tracking-widest leading-none">
                    {loading ? <span className="animate-pulse">···</span> : analytics.total_products}
                  </h2>
                  <span className="text-primary text-sm font-bold flex items-center mb-1">
                    <TrendingUp size={14} className="mr-1" /> Products
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {analytics.by_source.length} marketplaces
                </p>
                <div className="absolute right-4 top-4 text-primary/20"><Package size={40} /></div>
                <div className="absolute right-0 bottom-0 w-32 h-32 dark:bg-primary/5 bg-transparent rounded-tl-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
              </div>

              {/* Price Changes */}
              <div className="bg-card text-card-foreground shadow-sm rounded-xl border border-border p-6 flex flex-col gap-2 relative overflow-hidden group">
                <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Price Changes</p>
                <div className="flex items-end gap-3">
                  <h2 className="text-4xl font-bold text-foreground leading-none">
                    {loading ? <span className="animate-pulse">···</span> : analytics.total_price_changes}
                  </h2>
                  <span className="text-destructive text-sm font-bold flex items-center mb-1">
                    <TrendingDown size={14} className="mr-1" /> Total Events
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Detected via ingestion</p>
                <div className="absolute right-0 bottom-0 w-32 h-32 dark:bg-destructive/5 bg-transparent rounded-tl-full blur-2xl group-hover:bg-destructive/10 transition-colors pointer-events-none" />
              </div>

              {/* Products per source */}
              <div className="bg-card text-card-foreground shadow-sm rounded-xl border border-border p-6 flex flex-col gap-3 relative overflow-hidden group">
                <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">By Source</p>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-4 bg-muted rounded animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analytics.by_source.map((s) => (
                      <div key={s.source} className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize text-foreground">{s.source}</span>
                        <span className="text-muted-foreground font-mono">{s.count} items</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="absolute right-4 top-4 text-primary/20"><Zap size={40} /></div>
              </div>
            </div>

            {/* Avg Price by Category Bar Chart */}
            <div className="bg-card text-card-foreground shadow-sm rounded-xl border border-border p-6 flex flex-col">
              <div className="mb-6">
                <h3 className="font-semibold text-lg tracking-wide text-foreground">Avg Price by Category</h3>
                <p className="text-sm text-muted-foreground mt-1">Aggregated average listing price across all sources</p>
              </div>

              {loading ? (
                <div className="h-72 flex items-center justify-center text-muted-foreground animate-pulse">
                  Loading chart…
                </div>
              ) : categoryData.length === 0 ? (
                <div className="h-72 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Package size={32} className="opacity-40" />
                  <p className="text-sm">No category data yet. Run a refresh first.</p>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                        angle={-30}
                        textAnchor="end"
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        tickFormatter={(v) => `$${v.toLocaleString()}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          color: 'var(--card-foreground)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                        }}
                        formatter={(val: any) => [`$${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Avg Price']}
                      />
                      <Bar dataKey="avg_price" radius={[6, 6, 0, 0]}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Brands */}
            {!loading && analytics.by_brand.length > 0 && (
              <div className="bg-card text-card-foreground shadow-sm rounded-xl border border-border p-6">
                <h3 className="font-semibold text-lg tracking-wide text-foreground mb-4">Top Brands</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {analytics.by_brand.slice(0, 10).map((b, i) => (
                    <div
                      key={b.brand ?? i}
                      className="flex flex-col items-center justify-center gap-1 bg-muted/50 rounded-lg p-3 border border-border hover:border-primary/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/products?brand=${encodeURIComponent(b.brand ?? '')}`)}
                    >
                      <span className="text-xl font-bold text-primary">{b.count}</span>
                      <span className="text-xs text-muted-foreground text-center capitalize leading-tight">
                        {b.brand ?? 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
