import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { RefreshCcw, Bell, Search, Menu, Package, Activity, Settings, TrendingUp, TrendingDown, Clock } from 'lucide-react';

const API_KEY = "WiC5HbKag-DROSQ0Vxb_l01gFHqiYN6eOBdRTbmwKKc";
const api = axios.create({
  baseURL: '/api',
  headers: { 'X-API-Key': API_KEY }
});

const chartData = [
  { name: 'Mon', price: 2100 },
  { name: 'Tue', price: 2150 },
  { name: 'Wed', price: 2050 },
  { name: 'Thu', price: 2050 },
  { name: 'Fri', price: 1950 },
  { name: 'Sat', price: 2200 },
  { name: 'Sun', price: 2250 },
];

export default function Dashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({ total_products: 0, by_source: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resProducts, resAnalytics] = await Promise.all([
        api.get('/products?limit=6'),
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
      // In a real app we'd listen to SSE Events endpoint here.
      setTimeout(() => {
        fetchData();
        setRefreshing(false);
      }, 3000);
    } catch (e) {
      console.error(e);
      setRefreshing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
      {/* Sidebar */}
      <aside className="w-64 glass-panel flex-shrink-0 flex flex-col border-r border-outline-ghost/30 z-10 hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
            <Activity size={18} className="text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight text-white">Luminous</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-highest/50 text-white border-l-2 border-primary">
            <Activity size={18} className="text-primary" />
            <span className="font-medium">Overview</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-highest/30 hover:text-white transition-colors">
            <Package size={18} />
            <span className="font-medium">Products</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-highest/30 hover:text-white transition-colors">
            <TrendingUp size={18} />
            <span className="font-medium">Analytics</span>
          </a>
        </nav>
        
        <div className="p-4 mt-auto">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-highest/30 transition-colors">
            <Settings size={18} />
            <span className="font-medium">Settings</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        {/* Topbar */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-outline-ghost/30 bg-surface/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-on-surface-variant">
              <Menu size={24} />
            </button>
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search inventory..." 
                className="bg-surface-low border border-outline-ghost/50 rounded-full py-2 pl-10 pr-4 w-64 md:w-80 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                autoComplete="off"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-on-surface-variant hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-tertiary"></span>
            </button>
            <div className="w-px h-6 bg-outline-ghost"></div>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="glow-button flex items-center gap-2"
            >
              <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "SYNCING..." : "REFRESH DATA"}
            </button>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <div className="flex-1 overflow-auto p-8 space-y-8 z-0">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card flex flex-col gap-2 relative overflow-hidden group">
              <p className="text-on-surface-variant text-sm font-medium tracking-wide uppercase">Total Tracked</p>
              <div className="flex items-end gap-3">
                <h2 className="text-4xl font-display font-bold text-white tracking-widest leading-none">
                  {loading ? '...' : analytics.total_products}
                </h2>
                <span className="text-primary text-sm font-bold flex items-center mb-1">
                  <TrendingUp size={14} className="mr-1" /> +12%
                </span>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/5 rounded-tl-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
            </div>
            
            <div className="glass-card flex flex-col gap-2 relative overflow-hidden group">
              <p className="text-on-surface-variant text-sm font-medium tracking-wide uppercase">Active Alerts</p>
              <div className="flex items-end gap-3">
                <h2 className="text-4xl font-display font-bold text-white leading-none">
                  14
                </h2>
                <span className="text-tertiary text-sm font-bold flex items-center mb-1">
                  <TrendingDown size={14} className="mr-1" /> -2 Drops
                </span>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-tertiary/5 rounded-tl-full blur-2xl group-hover:bg-tertiary/10 transition-colors pointer-events-none" />
            </div>
            
             <div className="glass-card flex flex-col gap-2 relative overflow-hidden group">
              <p className="text-on-surface-variant text-sm font-medium tracking-wide uppercase">Market Volatility</p>
              <div className="flex items-end gap-3">
                <h2 className="text-4xl font-display font-bold text-white leading-none">
                  High
                </h2>
                <span className="text-on-surface-variant text-sm flex items-center mb-1">
                  <Clock size={14} className="mr-1" /> Last 24h
                </span>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="glass-card h-[380px] p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-semibold text-lg tracking-wide text-white">Global Price Trend Index</h3>
              <div className="flex gap-2">
                {['1W', '1M', '3M', '1Y', 'ALL'].map(t => (
                  <button key={t} className={`px-3 py-1 rounded text-xs font-semibold ${t === '1W' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-white'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#69f6b8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#69f6b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262627" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#adaaab', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#adaaab', fontSize: 12 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a191b', borderColor: '#484849', color: '#fff', borderRadius: '8px', padding: '12px' }}
                    itemStyle={{ color: '#69f6b8', fontWeight: 'bold' }}
                    formatter={(val) => [`$${val}`, 'Index']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#69f6b8" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="glass-card p-0 overflow-hidden">
            <div className="p-6 border-b border-outline-ghost/30">
              <h3 className="font-display font-semibold text-lg tracking-wide text-white">Recent Artifacts</h3>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-surface-low/50 text-xs font-semibold text-on-surface-variant tracking-wider uppercase">
                    <th className="px-6 py-4 font-body">Product</th>
                    <th className="px-6 py-4 font-body">Source</th>
                    <th className="px-6 py-4 font-body">Condition</th>
                    <th className="px-6 py-4 font-body text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-ghost/30 text-sm">
                  {loading && [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5"><div className="h-6 bg-surface-lowest rounded w-48"></div></td>
                      <td className="px-6 py-5"><div className="h-5 bg-surface-lowest rounded w-20"></div></td>
                      <td className="px-6 py-5"><div className="h-5 bg-surface-lowest rounded w-24"></div></td>
                      <td className="px-6 py-5"><div className="h-6 bg-surface-lowest rounded w-16 ml-auto"></div></td>
                    </tr>
                  ))}
                  
                  {!loading && products.map((p) => {
                    return (
                      <tr key={p.id} className="hover:bg-surface-lowest/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-lowest flex-shrink-0 border border-outline-ghost group-hover:border-primary/30 transition-colors">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">Img</div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white max-w-[200px] md:max-w-xs truncate">{p.title}</p>
                              <p className="text-xs text-on-surface-variant mt-1">{p.brand}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-md border border-outline-ghost/50 bg-surface-lowest text-on-surface-variant uppercase tracking-wider">
                            {p.source}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-on-surface-variant">{p.condition || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm font-bold text-white">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency || 'USD' }).format(p.current_price)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
