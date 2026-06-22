import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Menu } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PublicHeader() {
  const { isAuthenticated, profile, isLoading } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const siteName = settings?.site_name || 'Saifrow Store';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={siteName} className="h-8 object-contain" />
            ) : (
              <span className="font-bold inline-block text-xl">{siteName}</span>
            )}
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link to="/services" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
              الخدمات
            </Link>
            <Link to="/faq" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
              الأسئلة الشائعة
            </Link>
            <Link to="/contact" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
              تواصل معنا
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {profile?.full_name && <p className="font-medium">{profile.full_name}</p>}
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">حسابي</Link>
                </DropdownMenuItem>
                {profile?.role && profile.role !== 'customer' && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">لوحة التحكم</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link to="/login">تسجيل الدخول</Link>
              </Button>
              <Button asChild>
                <Link to="/register">حساب جديد</Link>
              </Button>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
