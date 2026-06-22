import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Mail, MessageSquare, Phone, Send, ShieldCheck, HelpCircle, FileText, Landmark, CreditCard, Coins } from 'lucide-react';

export function PublicFooter() {
  const { data: settings } = useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      
      const flatSettings = {
        site_name: 'Saifrow Store',
        description: 'متجرك الرقمي الأول لاشتراكاتك المفضلة. نقدم خدمات رقمية متنوعة بأسعار تنافسية ودعم فني متميز.',
        contact_email: 'saifrowstore@gmail.com',
        contact_phone: '',
        whatsapp_number: '',
      };

      data?.forEach((row: any) => {
        if (row.key === 'general') {
          flatSettings.site_name = row.value?.site_name || flatSettings.site_name;
          flatSettings.description = row.value?.site_description || flatSettings.description;
        } else if (row.key === 'contact') {
          flatSettings.contact_email = row.value?.email || flatSettings.contact_email;
          flatSettings.contact_phone = row.value?.phone || '';
          flatSettings.whatsapp_number = row.value?.whatsapp || '';
        }
      });

      return flatSettings;
    }
  });

  const siteName = settings?.site_name || 'Saifrow Store';
  const description = settings?.description || 'متجرك الرقمي الأول لاشتراكاتك المفضلة. نقدم خدمات رقمية متنوعة بأسعار تنافسية ودعم فني متميز.';
  const email = settings?.contact_email || 'saifrowstore@gmail.com';

  return (
    <footer className="border-t bg-gradient-to-b from-gray-50/50 to-gray-100/50 pt-16 pb-8 text-foreground/90">
      <div className="container max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link 
              to="/" 
              className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-accent to-blue-600 bg-clip-text text-transparent hover:opacity-90 transition-opacity block"
            >
              {siteName}
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              {description}
            </p>
            <div className="flex items-center gap-3 pt-2">
              {settings?.whatsapp_number && (
                <a 
                  href={`https://wa.me/${settings.whatsapp_number.replace(/\+/g, '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border shadow-sm text-emerald-600 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300"
                  title="واتساب"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                </a>
              )}
              <a 
                href="https://t.me/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border shadow-sm text-sky-500 flex items-center justify-center hover:bg-sky-50 hover:border-sky-200 hover:-translate-y-1 transition-all duration-300"
                title="تليجرام"
              >
                <Send className="w-4.5 h-4.5" />
              </a>
              <a 
                href="https://www.facebook.com/share/1QFcbrZcWB/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border shadow-sm text-blue-600 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 hover:-translate-y-1 transition-all duration-300"
                title="فيسبوك"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border shadow-sm text-pink-600 flex items-center justify-center hover:bg-pink-50 hover:border-pink-200 hover:-translate-y-1 transition-all duration-300"
                title="انستغرام"
              >
                <svg className="w-4.5 h-4.5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-md text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              روابط سريعة
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/services" className="text-muted-foreground hover:text-accent hover:translate-x-[-4px] inline-flex items-center gap-1.5 text-sm transition-all duration-200">
                  <Landmark className="w-4 h-4 text-muted-foreground/60" />
                  تصفح الخدمات والاشتراكات
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-accent hover:translate-x-[-4px] inline-flex items-center gap-1.5 text-sm transition-all duration-200">
                  <HelpCircle className="w-4 h-4 text-muted-foreground/60" />
                  الأسئلة الشائعة والإرشادات
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-accent hover:translate-x-[-4px] inline-flex items-center gap-1.5 text-sm transition-all duration-200">
                  <Mail className="w-4 h-4 text-muted-foreground/60" />
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-md text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              السياسات والضمان
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-accent hover:translate-x-[-4px] inline-flex items-center gap-1.5 text-sm transition-all duration-200">
                  <FileText className="w-4 h-4 text-muted-foreground/60" />
                  شروط وأحكام الاستخدام
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-accent hover:translate-x-[-4px] inline-flex items-center gap-1.5 text-sm transition-all duration-200">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground/60" />
                  سياسة الخصوصية وحماية البيانات
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-md text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              تواصل مباشر
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center text-accent shadow-sm shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-muted-foreground select-all text-xs font-mono">{email}</span>
              </li>
              {settings?.contact_phone && (
                <li className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center text-accent shadow-sm shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-muted-foreground select-all font-mono">{settings.contact_phone}</span>
                </li>
              )}
              {settings?.whatsapp_number && (
                <li className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-emerald-700 font-semibold select-all font-mono">{settings.whatsapp_number}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Divider & Payment Methods */}
        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground text-center md:text-right order-2 md:order-1">
            © {new Date().getFullYear()} {siteName}. جميع الحقوق محفوظة لمتجر {siteName}.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 order-1 md:order-2">
            <span className="text-xs text-muted-foreground ml-2">طرق الدفع المدعومة:</span>
            
            <div className="flex items-center gap-1.5 bg-white border px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground shadow-sm">
              <Phone className="w-3.5 h-3.5 text-red-600" />
              <span>فودافون كاش</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white border px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground shadow-sm">
              <Landmark className="w-3.5 h-3.5 text-emerald-600" />
              <span>انستاباي</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white border px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground shadow-sm">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>بطاقة بنكية</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white border px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground shadow-sm">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>بايننس Pay</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
