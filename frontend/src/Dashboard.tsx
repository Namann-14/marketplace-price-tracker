import { useEffect, useState, useId, useRef } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import axios from 'axios';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { RefreshCcw, Search, Package, TrendingUp, TrendingDown, Clock, X, Settings } from 'lucide-react';
import { AnimatedThemeToggler } from "./components/ui/animated-theme-toggler";
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const API_KEY = "WiC5HbKag-DROSQ0Vxb_l01gFHqiYN6eOBdRTbmwKKc";
const api = axios.create({
  baseURL: '/api',
  headers: { 'X-API-Key': API_KEY }
});

// Mock Graph Data for Timeranges
const mockGraphData = {
  '1W': [
    { name: 'Mon', price: 2100 }, { name: 'Tue', price: 2150 }, { name: 'Wed', price: 2050 }, 
    { name: 'Thu', price: 2050 }, { name: 'Fri', price: 1950 }, { name: 'Sat', price: 2200 }, { name: 'Sun', price: 2250 },
  ],
  '1M': [
    { name: 'Week 1', price: 1800 }, { name: 'Week 2', price: 1950 }, { name: 'Week 3', price: 2100 }, { name: 'Week 4', price: 2250 }
  ],
  '3M': [
    { name: 'Month 1', price: 1500 }, { name: 'Month 2', price: 1850 }, { name: 'Month 3', price: 2250 }
  ],
  '1Y': [
    { name: 'Q1', price: 1200 }, { name: 'Q2', price: 1400 }, { name: 'Q3', price: 1800 }, { name: 'Q4', price: 2250 }
  ],
  'ALL': [
    { name: '2021', price: 800 }, { name: '2022', price: 1100 }, { name: '2023', price: 1600 }, { name: '2024', price: 2250 }
  ]
};

export default function Dashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({ total_products: 0, by_source: [], by_category: [], by_brand: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Expandable Card Modal State
  const [active, setActive] = useState<any | boolean | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref as any, () => setActive(null));
  
  // New States for Interactivity
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'analytics' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | '1Y' | 'ALL'>('1W');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resProducts, resAnalytics] = await Promise.all([
        api.get('/products?limit=50'),
        api.get('/analytics')
      ]);
      setProducts(resProducts.data.items);
      setAnalytics(resAnalytics.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await api.post('/refresh');
      setTimeout(() => {
        fetchData();
        setRefreshing(false);
      }, 3000);
    } catch (e) {
      console.error(e);
      setRefreshing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const COLORS = ['var(--primary)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

  return (
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} onTabChange={(id) => setActiveTab(id as any)} />
      
      <SidebarInset>
        <div className="flex flex-col overflow-hidden bg-background text-foreground relative">
          <div className="absolute top-0 left-1/4 w-[500px] h-[300px] dark:bg-primary/20 bg-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
          
          {/* Topbar */}
          <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border bg-background/80 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
              
              <div className="relative group hidden sm:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search inventory..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-muted border border-border rounded-full py-2 pl-10 pr-10 w-64 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6">
              <AnimatedThemeToggler className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" />
              {/* <button className="relative text-muted-foreground hover:text-foreground transition-colors">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-destructive"></span>
              </button>
              <div className="w-px h-6 bg-border hidden sm:block"></div> */}
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-primary text-primary-foreground font-bold tracking-wider rounded-lg px-3 sm:px-6 py-2 shadow-sm transition-all hover:opacity-90 flex items-center gap-2 text-sm sm:text-base"
              >
                <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{refreshing ? "SYNCING..." : "REFRESH"}</span>
              </button>
            </div>
          </header>

          {/* Mobile Search Bar */}
          <div className="py-2 px-4 border-b border-border bg-background sm:hidden">
            <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-muted border border-border rounded-full py-2 pl-10 pr-10 w-full text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={14} />
                  </button>
                )}
              </div>
          </div>

          {/* Dashboard Canvas */}
          <main className="flex-1 overflow-hidden p-12 sm:p-8 space-y-8 z-0 relative">
            
            <AnimatePresence>
              {active && typeof active === "object" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm h-full w-full z-[100]"
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {active && typeof active === "object" ? (
                <div className="fixed inset-0 grid place-items-center z-[110] p-4">
                  <motion.button
                    key={`button-${active.id}-${id}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.05 } }}
                    className="flex absolute top-4 right-4 items-center justify-center bg-background border border-border rounded-full h-8 w-8 hover:bg-muted transition"
                    onClick={() => setActive(null)}
                  >
                    <X size={16} />
                  </motion.button>
                  <motion.div
                    layoutId={`card-${active.id}-${id}`}
                    ref={ref}
                    className="w-full max-w-[600px] flex flex-col bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative"
                  >
                    <motion.div layoutId={`image-${active.id}-${id}`} className="w-full h-64 sm:h-80 bg-muted relative border-b border-border flex items-center justify-center">
                      {active.image_url ? (
                        <img
                          src={active.image_url}
                          alt={active.title}
                          className="w-full h-full object-contain p-4"
                        />
                      ) : (
                        <Package size={48} className="text-muted-foreground opacity-50" />
                      )}
                    </motion.div>

                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                          <motion.h3
                            layoutId={`title-${active.id}-${id}`}
                            className="font-bold text-xl sm:text-2xl text-foreground"
                          >
                            {active.title}
                          </motion.h3>
                          <motion.p
                            layoutId={`brand-${active.id}-${id}`}
                            className="text-muted-foreground text-sm mt-1"
                          >
                            {active.brand}
                          </motion.p>
                        </div>
                        
                        <motion.a
                          layoutId={`button-${active.id}-${id}`}
                          href={active.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-2.5 text-sm rounded-full font-bold bg-primary hover:opacity-90 transition-opacity text-primary-foreground shrink-0 w-full sm:w-auto text-center"
                        >
                          View Original Listing
                        </motion.a>
                      </div>
                      
                      <div className="pt-6 relative">
                        <motion.div
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-foreground text-sm flex flex-col gap-4 overflow-auto"
                        >
                          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                            <div>
                              <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Price</span>
                              <span className="font-bold text-lg text-primary">{new Intl.NumberFormat('en-US', { style: 'currency', currency: active.currency || 'USD' }).format(active.current_price)}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Source</span>
                              <span className="font-bold capitalize">{active.source}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Condition</span>
                              <span className="font-medium whitespace-pre-wrap">{active.condition || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</span>
                              <span className="font-medium">{active.is_sold ? 'Sold Out' : 'Available'}</span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>
            
            {activeTab === 'overview' && (
              <>
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-card text-card-foreground shadow-sm rounded-lg border border-border p-6 flex flex-col gap-2 relative overflow-hidden group">
                    <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Total Tracked</p>
                    <div className="flex items-end gap-3">
                      <h2 className="text-4xl font-bold text-foreground tracking-widest leading-none">
                        {loading ? '...' : analytics.total_products}
                      </h2>
                      <span className="text-primary text-sm font-bold flex items-center mb-1">
                        <TrendingUp size={14} className="mr-1" /> +12%
                      </span>
                    </div>
                    <div className="absolute right-0 bottom-0 w-32 h-32 dark:bg-primary/5 bg-transparent rounded-tl-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
                  </div>
                  
                  <div className="bg-card text-card-foreground shadow-sm rounded-lg border border-border p-6 flex flex-col gap-2 relative overflow-hidden group">
                    <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Active Alerts</p>
                    <div className="flex items-end gap-3">
                      <h2 className="text-4xl font-bold text-foreground leading-none">
                        14
                      </h2>
                      <span className="text-destructive text-sm font-bold flex items-center mb-1">
                        <TrendingDown size={14} className="mr-1" /> -2 Drops
                      </span>
                    </div>
                    <div className="absolute right-0 bottom-0 w-32 h-32 dark:bg-destructive/5 bg-transparent rounded-tl-full blur-2xl group-hover:bg-destructive/10 transition-colors pointer-events-none" />
                  </div>
                  
                  <div className="bg-card text-card-foreground shadow-sm rounded-lg border border-border p-6 flex flex-col gap-2 relative overflow-hidden group">
                    <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Market Volatility</p>
                    <div className="flex items-end gap-3">
                      <h2 className="text-4xl font-bold text-foreground leading-none">
                        High
                      </h2>
                      <span className="text-muted-foreground text-sm flex items-center mb-1">
                        <Clock size={14} className="mr-1" /> Last 24h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chart Section */}
                <div className="bg-card text-card-foreground shadow-sm rounded-lg border border-border h-[400px] p-4 sm:p-6 flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="font-semibold text-lg tracking-wide text-foreground">Global Price Trend Index</h3>
                    <div className="flex flex-wrap gap-2 bg-muted p-1 rounded-lg border border-border w-full sm:w-auto">
                      {(['1W', '1M', '3M', '1Y', 'ALL'] as const).map(t => (
                        <button 
                          key={t} 
                          onClick={() => setTimeRange(t)}
                          className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-xs font-bold transition-colors ${t === timeRange ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                      <AreaChart data={mockGraphData[timeRange]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)', borderRadius: '8px', padding: '12px' }}
                          itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                          formatter={(val) => [`$${val}`, 'Index']}
                        />
                        <Area type="monotone" dataKey="price" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card text-card-foreground shadow-sm rounded-lg border border-border h-[400px] flex flex-col p-6">
                  <h3 className="font-semibold text-lg tracking-wide text-foreground mb-6">Inventory by Source</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.by_source || []} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)'}} />
                      <YAxis dataKey="source" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--foreground)'}} width={100} />
                      <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                        {analytics.by_source?.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card text-card-foreground shadow-sm rounded-lg border border-border p-6 h-[400px] flex flex-col">
                  <h3 className="font-semibold text-lg tracking-wide text-foreground mb-6">Category Distribution</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={analytics.by_category || []} 
                        dataKey="count" 
                        nameKey="category" 
                        cx="50%" cy="50%" 
                        outerRadius={100} fill="var(--primary)"
                        label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {analytics.by_category?.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
               <div className="bg-card text-card-foreground shadow-sm rounded-lg border border-border p-10 flex flex-col items-center justify-center min-h-[400px] text-center">
                  <Settings size={48} className="text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">System Configuration</h2>
                  <p className="text-muted-foreground max-w-md">Global API settings, scraping schedules, and notification WebHooks configuration will be accessible here.</p>
               </div>
            )}

            {/* Table (Shown in Overview & Products tab) */}
            {(activeTab === 'overview' || activeTab === 'products') && (
              <div className="bg-card text-card-foreground shadow-sm rounded-lg border border-border p-0 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="font-semibold text-lg tracking-wide text-foreground">
                    {searchQuery ? `Search Results: "${searchQuery}"` : 'Recent Artifacts'}
                  </h3>
                  <span className="text-sm text-muted-foreground font-medium">
                    Showing {filteredProducts.length} items
                  </span>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Source</th>
                        <th className="px-6 py-4">Condition</th>
                        <th className="px-6 py-4 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {loading && [...Array(4)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-5"><div className="h-6 bg-muted rounded w-48"></div></td>
                          <td className="px-6 py-5"><div className="h-5 bg-muted rounded w-20"></div></td>
                          <td className="px-6 py-5"><div className="h-5 bg-muted rounded w-24"></div></td>
                          <td className="px-6 py-5"><div className="h-6 bg-muted rounded w-16 ml-auto"></div></td>
                        </tr>
                      ))}
                      
                      {!loading && filteredProducts.length === 0 && (
                        <tr className="bg-muted/20">
                          <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                            <Package size={24} className="mx-auto mb-2 opacity-50" />
                            No artifacts found matching your criteria.
                          </td>
                        </tr>
                      )}
                      
                      {!loading && paginatedProducts.map((p) => {
                        return (
                          <motion.tr layoutId={`card-${p.id}-${id}`} key={p.id} onClick={() => setActive(p)} className="hover:bg-muted/50 transition-colors group cursor-pointer relative z-0">
                            <td className="px-6 py-4 relative z-0">
                              <div className="flex items-center gap-4">
                                <motion.div layoutId={`image-${p.id}-${id}`} className="w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-card flex-shrink-0 border border-border group-hover:border-primary/50 transition-colors relative z-0">
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.title} className="w-full h-full object-contain" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package size={16} /></div>
                                  )}
                                </motion.div>
                                <div>
                                  <motion.p layoutId={`title-${p.id}-${id}`} className="font-bold text-foreground max-w-[200px] md:max-w-xs truncate">{p.title}</motion.p>
                                  <motion.p layoutId={`brand-${p.id}-${id}`} className="text-xs text-muted-foreground mt-1">{p.brand}</motion.p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border/50 bg-muted text-muted-foreground uppercase tracking-wider">
                                {p.source}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-muted-foreground">{p.condition || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 text-right">
                                <motion.span layoutId={`button-${p.id}-${id}`} className="text-sm font-bold text-foreground inline-block">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency || 'USD' }).format(p.current_price)}
                                </motion.span>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {!loading && filteredProducts.length > 0 && (
                  <div className="p-4 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} items
                    </span>
                    <div className="flex gap-2">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1 text-sm rounded border border-border bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
                      >
                        Previous
                      </button>
                      <button 
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="px-3 py-1 text-sm rounded border border-border bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
