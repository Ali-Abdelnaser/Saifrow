import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, ShoppingCart, Layers, Tags, CreditCard, 
  Settings, Users, ShieldAlert, LogOut, CheckCircle, Percent, MessageSquare, HelpCircle, Menu
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function AdminLayout() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    window.location.reload();
  };

  const menuItems = [
    { label: 'الرئيسية', path: '/admin', icon: LayoutDashboard, roles: ['super_admin', 'orders_manager', 'finance_member', 'content_manager', 'support_member'] },
    { label: 'الطلبات', path: '/admin/orders', icon: ShoppingCart, roles: ['super_admin', 'orders_manager', 'finance_member', 'support_member'] },
    { label: 'مراجعة الدفع', path: '/admin/payments', icon: CheckCircle, roles: ['super_admin', 'finance_member'] },
    { label: 'الخدمات', path: '/admin/services', icon: Layers, roles: ['super_admin', 'content_manager'] },
    { label: 'الباقات', path: '/admin/plans', icon: Layers, roles: ['super_admin', 'content_manager'] },
    { label: 'التصنيفات', path: '/admin/categories', icon: Tags, roles: ['super_admin', 'content_manager'] },
    { label: 'طرق الدفع', path: '/admin/payment-methods', icon: CreditCard, roles: ['super_admin', 'content_manager'] },
    { label: 'الكوبونات', path: '/admin/coupons', icon: Percent, roles: ['super_admin', 'content_manager'] },
    { label: 'التقييمات', path: '/admin/reviews', icon: MessageSquare, roles: ['super_admin', 'content_manager'] },
    { label: 'الأسئلة الشائعة', path: '/admin/faqs', icon: HelpCircle, roles: ['super_admin', 'content_manager'] },
    { label: 'الإعدادات', path: '/admin/settings', icon: Settings, roles: ['super_admin', 'content_manager'] },
    { label: 'الفريق', path: '/admin/team', icon: Users, roles: ['super_admin'] },
    { label: 'سجلات النشاط', path: '/admin/logs', icon: ShieldAlert, roles: ['super_admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(profile?.role || ''));
  const currentMenuItem = menuItems.find(item => item.path === location.pathname);
  const canAccessCurrentPage = !currentMenuItem || currentMenuItem.roles.includes(profile?.role || '');

  const renderMenuItems = (mobile = false) => (
    <>
      {filteredMenu.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        const link = (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive 
                ? 'bg-primary text-white' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        );

        return mobile ? (
          <SheetClose key={item.path} asChild>
            {link}
          </SheetClose>
        ) : link;
      })}
    </>
  );

  return (
    <div className="min-h-screen flex bg-background rtl" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 border-l bg-white hidden lg:flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b">
          <Link to="/" className="font-bold text-lg text-primary">Saifrow Store Admin</Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {renderMenuItems()}
        </nav>
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 ml-3 rtl:mr-0 rtl:ml-3" />
            <span>تسجيل الخروج</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="فتح قائمة لوحة التحكم">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 text-right">
                <SheetHeader className="text-right">
                  <SheetTitle>لوحة التحكم</SheetTitle>
                </SheetHeader>
                <nav className="mt-8 space-y-1">
                  {renderMenuItems(true)}
                </nav>
                <Button 
                  variant="ghost" 
                  className="mt-6 w-full justify-start text-destructive hover:text-destructive hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 ml-3 rtl:mr-0 rtl:ml-3" />
                  <span>تسجيل الخروج</span>
                </Button>
              </SheetContent>
            </Sheet>
            <h2 className="font-bold text-lg">لوحة التحكم</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-left rtl:text-right">
              <p className="font-bold text-sm">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center border font-bold">
              {profile?.full_name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-8 overflow-y-auto">
          {canAccessCurrentPage ? (
            <Outlet />
          ) : (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center text-destructive gap-3">
              <ShieldAlert className="w-12 h-12" />
              <h1 className="text-2xl font-bold">غير مصرح لك بفتح هذه الصفحة</h1>
              <p className="text-sm text-muted-foreground">هذه الصفحة تحتاج صلاحيات إدارية مختلفة.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
