"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminLayout = createAdminLayout;
exports.createLoginPage = createLoginPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const NAV = [
    { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
    { href: '/orders', label: 'Orders', emoji: '📋' },
    { href: '/menu', label: 'Menu', emoji: '🍽️' },
    { href: '/tables', label: 'Tables', emoji: '🪑' },
    { href: '/qrcodes', label: 'QR Codes', emoji: '📱' },
    { href: '/staff', label: 'Staff', emoji: '👥' },
    { href: '/coupons', label: 'Coupons', emoji: '🎟️' },
    { href: '/reviews', label: 'Reviews', emoji: '⭐' },
    { href: '/reports', label: 'Reports', emoji: '📈' },
    { href: '/settings', label: 'Settings', emoji: '⚙️' },
];
function createAdminLayout(useAuthStore) {
    return function AdminLayout({ children }) {
        const router = (0, navigation_1.useRouter)();
        const pathname = (0, navigation_1.usePathname)();
        const { staff, logout, isAuthenticated } = useAuthStore();
        const [collapsed, setCollapsed] = (0, react_1.useState)(false);
        const [mounted, setMounted] = (0, react_1.useState)(false);
        (0, react_1.useEffect)(() => {
            setMounted(true);
            if (!isAuthenticated)
                router.replace('/');
        }, [isAuthenticated, router]);
        if (!mounted || !isAuthenticated) {
            return (<div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
        </div>);
        }
        return (<div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
        <aside className={`sidebar flex flex-col transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[220px]'} flex-shrink-0`}>
          <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-base flex-shrink-0">🍽️</div>
            {!collapsed && (<div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">ForkAdmin</p>
                <p className="text-white/30 text-xs capitalize truncate">{staff?.role}</p>
              </div>)}
          </div>

          <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
            {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (<link_1.default key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`} title={collapsed ? item.label : undefined}>
                  <span className="text-base flex-shrink-0">{item.emoji}</span>
                  {!collapsed && <span>{item.label}</span>}
                </link_1.default>);
            })}
          </nav>

          <div className="border-t border-white/5 p-3 space-y-2">
            {!collapsed && (<div className="flex items-center gap-2.5 px-2 py-1.5">
                <div className="w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 font-bold text-xs flex-shrink-0">
                  {staff?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-xs font-medium truncate">{staff?.name}</p>
                  <p className="text-white/25 text-xs truncate">{staff?.email}</p>
                </div>
              </div>)}
            <button onClick={() => { logout(); router.push('/'); }} className={`nav-item w-full text-red-400/60 hover:text-red-400 hover:bg-red-500/10 ${collapsed ? 'justify-center px-2' : ''}`} title={collapsed ? 'Sign out' : undefined}>
              <span className="text-base">🚪</span>
              {!collapsed && <span>Sign out</span>}
            </button>
            <button onClick={() => setCollapsed(!collapsed)} className="nav-item w-full justify-center text-white/20 hover:text-white/50">
              <span className="text-sm">{collapsed ? '→' : '←'}</span>
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
      </div>);
    };
}
function createLoginPage(useAuthStore) {
    return function LoginPage() {
        const router = (0, navigation_1.useRouter)();
        const { login, loading, error, isAuthenticated } = useAuthStore();
        const [email, setEmail] = (0, react_1.useState)('');
        const [password, setPassword] = (0, react_1.useState)('');
        const [showPass, setShowPass] = (0, react_1.useState)(false);
        const [mounted, setMounted] = (0, react_1.useState)(false);
        (0, react_1.useEffect)(() => {
            setMounted(true);
            if (isAuthenticated)
                router.replace('/dashboard');
        }, [isAuthenticated, router]);
        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                await login(email, password);
                router.push('/dashboard');
            }
            catch { }
        };
        if (!mounted || isAuthenticated) {
            return (<div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
        </div>);
        }
        return (<div className="min-h-screen bg-[#0f1117] flex">
        <div className="hidden lg:flex flex-col justify-between w-[480px] p-12 bg-gradient-to-br from-orange-500 to-amber-500 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}/>
          <div className="relative">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">🍽️</div>
              <span className="text-white font-bold text-lg">ForkAdmin</span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">Manage your restaurant smarter</h1>
            <p className="text-white/70 text-lg leading-relaxed">Real-time orders, menu management, table tracking and analytics - all in one place.</p>
          </div>
          <div className="relative space-y-4">
            {[{ icon: '⚡', text: 'Live order tracking & KDS' }, { icon: '📊', text: 'Revenue analytics & reports' }, { icon: '🪑', text: 'Table & QR code management' }].map((f) => (<div key={f.text} className="flex items-center gap-3 text-white/80">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm font-medium">{f.text}</span>
              </div>))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-2xl">🍽️</div>
              <span className="text-white font-bold text-lg">ForkAdmin</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Welcome back</h2>
            <p className="text-white/40 mb-8">Sign in to your restaurant dashboard</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@thefork.com" autoComplete="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/60 transition-all text-sm"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/60 transition-all text-sm pr-12"/>
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-sm">{showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm flex items-center gap-2"><span>⚠️</span> {error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-xl text-base transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-orange-500/20">
                {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Signing in...</span></> : 'Sign In →'}
              </button>
            </form>
            <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-2">Demo Credentials</p>
              <p className="text-white/50 text-sm">📧 admin@thefork.com</p>
              <p className="text-white/50 text-sm">🔑 admin123</p>
            </div>
          </div>
        </div>
      </div>);
    };
}
//# sourceMappingURL=adminComponents.js.map