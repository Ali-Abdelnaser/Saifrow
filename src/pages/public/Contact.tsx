import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mail, Phone, MessageSquare, Send } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

export default function ContactPage() {
  useSEO({
    title: 'اتصل بنا',
    description: 'تواصل مع فريق دعم متجر Saifrow Store. نحن هنا للإجابة على استفساراتك ومساعدتك في تفعيل وحل أي مشكلة بخصوص اشتراكاتك الرقمية.',
    keywords: 'saifrow store, اتصل بنا, الدعم الفني, تواصل معنا, خدمة العملاء'
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['site_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      
      const flatSettings = {
        contact_email: 'saifrowstore@gmail.com',
        contact_phone: '',
        whatsapp_number: '',
      };

      data?.forEach((row: any) => {
        if (row.key === 'contact') {
          flatSettings.contact_email = row.value?.email || flatSettings.contact_email;
          flatSettings.contact_phone = row.value?.phone || '';
          flatSettings.whatsapp_number = row.value?.whatsapp || '';
        }
      });

      return flatSettings;
    }
  });

  const contactEmail = settings?.contact_email || 'saifrowstore@gmail.com';
  const whatsappNumber = settings?.whatsapp_number;
  const contactPhone = settings?.contact_phone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name,
          email,
          subject: subject || null,
          message,
          is_read: false
        });

      if (error) throw error;

      toast.success('تم إرسال رسالتك بنجاح! سنقوم بالرد عليك قريباً.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Error submitting contact form:', err);
      toast.error('حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-12 max-w-5xl min-h-screen">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">تواصل معنا</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          لديك أي استفسار أو مشكلة؟ فريق الدعم الفني متواجد لمساعدتك في أي وقت.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-accent flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">البريد الإلكتروني</h3>
              <p className="text-muted-foreground text-xs mb-2">راسلنا مباشرة وسنجيبك خلال 24 ساعة</p>
              <span className="font-semibold text-sm select-all">{contactEmail}</span>
            </div>
          </div>

          {whatsappNumber && (
            <a 
              href={`https://wa.me/${whatsappNumber.replace(/\+/g, '')}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-card border rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:border-emerald-200 hover:bg-emerald-50/5 transition-all block"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1 text-emerald-800">واتساب</h3>
                <p className="text-muted-foreground text-xs mb-2">تواصل معنا فوراً للمساعدة السريعة</p>
                <span className="font-semibold text-sm select-all text-emerald-700">{whatsappNumber}</span>
              </div>
            </a>
          )}

          {contactPhone && (
            <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">الهاتف</h3>
                <p className="text-muted-foreground text-xs mb-2">تواصل معنا هاتفياً لأي استفسار عاجل</p>
                <span className="font-semibold text-sm select-all">{contactPhone}</span>
              </div>
            </div>
          )}
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6">أرسل لنا رسالة</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم بالكامل <span className="text-destructive">*</span></Label>
                  <Input 
                    id="name" 
                    placeholder="الاسم" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني <span className="text-destructive">*</span></Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    dir="ltr"
                    className="text-left rtl:text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">الموضوع</Label>
                <Input 
                  id="subject" 
                  placeholder="موضوع الرسالة" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">الرسالة <span className="text-destructive">*</span></Label>
                <Textarea 
                  id="message" 
                  placeholder="كيف يمكننا مساعدتك؟" 
                  rows={5} 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  required 
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto px-6 gap-2" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                <Send className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
