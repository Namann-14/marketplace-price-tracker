import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw, TrendingDown, Package, ExternalLink } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import api from '@/lib/api';

interface PriceEvent {
  product_id: number;
  old_price: number | null;
  new_price: number;
  source: string;
  detected_at: string;
}

export default function PriceChangesPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<PriceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/events');
      setEvents(res.data.events || []);
    } catch (err: any) {
      setError('Failed to load price changes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar activeTab="price-changes" onTabChange={(id) => {
        if (id !== 'price-changes') navigate(id === 'overview' ? '/overview' : '/');
      }} />

      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[500px] h-[300px] dark:bg-destructive/10 bg-transparent rounded-full blur-[120px] pointer-events-none -z-10" />

          <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border bg-background/80 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
              <div>
                <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <TrendingDown size={18} className="text-destructive" />
                  Price Changes
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Recent price drops and adjustments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AnimatedThemeToggler className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" />
              <button
                onClick={fetchEvents}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wider rounded-lg px-3 py-2 shadow-sm transition-all flex items-center gap-2 text-sm"
              >
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">RELOAD</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 sm:p-8">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
                {error}
              </div>
            )}

            <div className="bg-card text-card-foreground shadow-sm rounded-xl border border-border overflow-hidden">
              {loading && events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                  <RefreshCcw size={32} className="animate-spin opacity-30" />
                  <p className="text-sm">Fetching latest events...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                  <Package size={48} className="opacity-30" />
                  <p className="text-lg font-medium">No recent price changes</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Product ID</th>
                        <th className="px-6 py-4 font-semibold">Source</th>
                        <th className="px-6 py-4 font-semibold">Old Price</th>
                        <th className="px-6 py-4 font-semibold">New Price</th>
                        <th className="px-6 py-4 font-semibold">Detected At</th>
                        <th className="px-6 py-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {events.map((ev, i) => {
                        const isDrop = ev.old_price != null && ev.new_price < ev.old_price;
                        return (
                          <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 font-mono font-medium text-foreground">
                              #{ev.product_id}
                            </td>
                            <td className="px-6 py-4 capitalize text-muted-foreground">
                              {ev.source}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground line-through">
                              {ev.old_price ? `$${ev.old_price.toLocaleString()}` : 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-bold ${isDrop ? 'text-destructive' : 'text-foreground'}`}>
                                ${ev.new_price.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {new Date(ev.detected_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => navigate(`/products/${ev.product_id}`)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                              >
                                View <ExternalLink size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
