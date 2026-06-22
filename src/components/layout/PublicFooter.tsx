import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function PublicFooter() {
  const { data: settings } = useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const siteName = settings?.site_name || 'Saifrow Store';
  const description = settings?.description || 'متجرك الرقمي الأول لاشتراكاتك المفضلة. نقدم خدمات رقمية متنوعة بأسعار تنافسية.';
  const email = settings?.contact_email || 'support@saifrow.store';

  return (
    <footer className="border-t bg-white">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="font-bold text-2xl mb-4 block">{siteName}</Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {description}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-3">
              <li><Link to="/services" className="text-muted-foreground hover:text-foreground text-sm">تصفح الخدمات</Link></li>
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground text-sm">الأسئلة الشائعة</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground text-sm">تواصل معنا</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">السياسات</h3>
            <ul className="space-y-3">
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground text-sm">شروط الاستخدام</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground text-sm">سياسة الخصوصية</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="text-muted-foreground text-sm select-all">{email}</li>
              {settings?.contact_phone && (
                <li className="text-muted-foreground text-sm select-all">الهاتف: {settings.contact_phone}</li>
              )}
              {settings?.whatsapp_number && (
                <li className="text-muted-foreground text-sm select-all">واتساب: {settings.whatsapp_number}</li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {siteName}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
