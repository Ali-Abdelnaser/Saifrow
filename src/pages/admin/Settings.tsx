import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [siteName, setSiteName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Homepage sections hero states
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [primaryCta, setPrimaryCta] = useState('');
  const [secondaryCta, setSecondaryCta] = useState('');

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['admin_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      
      const flatSettings = {
        id: 'global',
        site_name: '',
        description: '',
        logo_url: '',
        contact_email: '',
        whatsapp_number: '',
        general_id: '',
        branding_id: '',
        contact_id: ''
      };

      data?.forEach((row: any) => {
        if (row.key === 'general') {
          flatSettings.site_name = row.value?.site_name || '';
          flatSettings.description = row.value?.site_description || '';
          flatSettings.general_id = row.id;
        } else if (row.key === 'branding') {
          flatSettings.logo_url = row.value?.logo_url || '';
          flatSettings.branding_id = row.id;
        } else if (row.key === 'contact') {
          flatSettings.contact_email = row.value?.email || '';
          flatSettings.whatsapp_number = row.value?.whatsapp || '';
          flatSettings.contact_id = row.id;
        }
      });

      return flatSettings;
    },
  });

  // Fetch homepage section
  const { data: homeSection } = useQuery({
    queryKey: ['admin_home_section'],
    queryFn: async () => {
      const { data, error } = await supabase.from('homepage_sections').select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
  });

  // Populate state on load
  useEffect(() => {
    if (settings) {
      setSiteName(settings.site_name || '');
      setDescription(settings.description || '');
      setLogoUrl(settings.logo_url || '');
      setContactEmail(settings.contact_email || '');
      setWhatsappNumber(settings.whatsapp_number || '');
    }
  }, [settings]);

  useEffect(() => {
    if (homeSection) {
      setHeroTitle(homeSection.hero_title || '');
      setHeroSubtitle(homeSection.hero_subtitle || '');
      setPrimaryCta(homeSection.primary_cta_text || '');
      setSecondaryCta(homeSection.secondary_cta_text || '');
    }
  }, [homeSection]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Update general
      const { error: err1 } = await supabase
        .from('site_settings')
        .update({
          value: {
            site_name: siteName,
            site_description: description || null
          },
          updated_at: new Date().toISOString()
        })
        .eq('key', 'general');
      if (err1) throw err1;

      // 2. Update branding
      const { error: err2 } = await supabase
        .from('site_settings')
        .update({
          value: {
            logo_url: logoUrl || null,
            favicon_url: null,
            primary_color: '#000000'
          },
          updated_at: new Date().toISOString()
        })
        .eq('key', 'branding');
      if (err2) throw err2;

      // 3. Update contact
      const { error: err3 } = await supabase
        .from('site_settings')
        .update({
          value: {
            email: contactEmail || null,
            whatsapp: whatsappNumber || null,
            phone: whatsappNumber || null
          },
          updated_at: new Date().toISOString()
        })
        .eq('key', 'contact');
      if (err3) throw err3;

      // 4. Upsert homepage hero
      const heroPayload = {
        hero_title: heroTitle || null,
        hero_subtitle: heroSubtitle || null,
        primary_cta_text: primaryCta || null,
        secondary_cta_text: secondaryCta || null,
        updated_at: new Date().toISOString()
      };

      const { error: heroError } = homeSection?.id
        ? await supabase.from('homepage_sections').update(heroPayload).eq('id', homeSection.id)
        : await supabase.from('homepage_sections').insert([heroPayload]);

      if (heroError) throw heroError;
    },
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات وتحديثات الواجهة بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء حفظ الإعدادات');
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إعدادات الموقع والواجهة</h1>
        <p className="text-muted-foreground">تعديل نصوص الصفحة الرئيسية ومعلومات الاتصال.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Site Config */}
        <Card>
          <CardHeader>
            <CardTitle>الإعدادات العامة للمتجر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-right">
            <div className="space-y-2">
              <Label htmlFor="siteName">اسم المتجر *</Label>
              <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteDesc">وصف المتجر (SEO)</Label>
              <Textarea id="siteDesc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <ImageUpload
              bucketName="site-assets"
              onUploadSuccess={setLogoUrl}
              label="شعار المتجر (Logo)"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">البريد الإلكتروني للتواصل</Label>
                <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">رقم الواتساب للدعم</Label>
                <Input id="whatsapp" placeholder="9665xxxxxxxx" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} dir="ltr" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Home Hero Settings */}
        <Card>
          <CardHeader>
            <CardTitle>نصوص واجهة البانر الرئيسي (Hero Section)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-right">
            <div className="space-y-2">
              <Label htmlFor="heroTitle">العنوان الرئيسي للبانر</Label>
              <Input id="heroTitle" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroSub">العنوان الفرعي للبانر</Label>
              <Textarea id="heroSub" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryCta">نص الزر الرئيسي</Label>
                <Input id="primaryCta" value={primaryCta} onChange={(e) => setPrimaryCta(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryCta">نص الزر الثانوي</Label>
                <Input id="secondaryCta" value={secondaryCta} onChange={(e) => setSecondaryCta(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={() => saveMutation.mutate()} size="lg" disabled={saveMutation.isPending || !siteName}>
          {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ كل التغييرات'}
        </Button>
      </div>
    </div>
  );
}
