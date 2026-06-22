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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function PublicHeader() {
  const { isAuthenticated, profile, isLoading } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      
      const flatSettings = {
        site_name: 'Saifrow Store',
        logo_url: '',
      };

      data?.forEach((row: any) => {
        if (row.key === 'general') {
          flatSettings.site_name = row.value?.site_name || flatSettings.site_name;
        } else if (row.key === 'branding') {
          flatSettings.logo_url = row.value?.logo_url || '';
        }
      });

      return flatSettings;
    }
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const siteName = settings?.site_name || 'Saifrow Store';
  const navLinks = [
    { to: '/services', label: 'الخدمات' },
    { to: '/faq', label: 'الأسئلة الشائعة' },
    { to: '/contact', label: 'تواصل معنا' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container relative flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={siteName} className="h-8 object-contain" />
            ) : (
              <span className="font-bold inline-block text-xl">{siteName}</span>
            )}
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-6 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((item) => (
            <Link key={item.to} to={item.to} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
              {item.label}
            </Link>
          ))}
        </nav>

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

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="فتح القائمة">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 text-right">
              <SheetHeader className="text-right">
                <SheetTitle>{siteName}</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-2">
                {navLinks.map((item) => (
                  <SheetClose key={item.to} asChild>
                    <Link to={item.to} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted">
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-8 border-t pt-6">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <SheetClose asChild>
                      <Link to="/profile" className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted">
                        حسابي
                      </Link>
                    </SheetClose>
                    {profile?.role && profile.role !== 'customer' && (
                      <SheetClose asChild>
                        <Link to="/admin" className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted">
                          لوحة التحكم
                        </Link>
                      </SheetClose>
                    )}
                    <Button variant="destructive" className="mt-4 w-full" onClick={handleLogout}>
                      تسجيل الخروج
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <SheetClose asChild>
                      <Button variant="outline" asChild>
                        <Link to="/login">تسجيل الدخول</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild>
                        <Link to="/register">حساب جديد</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
