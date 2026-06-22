import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';

export default function AdminServices() {
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [features, setFeatures] = useState('');
  const [benefits, setBenefits] = useState('');
  const [requirements, setRequirements] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPopular, setIsPopular] = useState(false);

  // Fetch services
  const { data: services, isLoading } = useQuery({
    queryKey: ['admin_services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, category:categories(name)')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['admin_categories_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setSelectedService(null);
    setName('');
    setSlug('');
    setCategoryId('');
    setShortDesc('');
    setFullDesc('');
    setLogoUrl('');
    setCoverUrl('');
    setFeatures('');
    setBenefits('');
    setRequirements('');
    setNotes('');
    setIsActive(true);
    setIsFeatured(false);
    setIsPopular(false);
  };

  const handleEdit = (service: any) => {
    setSelectedService(service);
    setName(service.name || '');
    setSlug(service.slug || '');
    setCategoryId(service.category_id || '');
    setShortDesc(service.short_description || '');
    setFullDesc(service.full_description || '');
    setLogoUrl(service.logo_url || '');
    setCoverUrl(service.cover_image_url || '');
    setFeatures(service.features?.join('\n') || '');
    setBenefits(service.benefits?.join('\n') || '');
    setRequirements(service.requirements?.join('\n') || '');
    setNotes(service.important_notes?.join('\n') || '');
    setIsActive(service.is_active);
    setIsFeatured(service.is_featured);
    setIsPopular(service.is_popular);
    setIsOpen(true);
  };

  // Upsert Service Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsedFeatures = features.split('\n').filter(l => l.trim() !== '');
      const parsedBenefits = benefits.split('\n').filter(l => l.trim() !== '');
      const parsedRequirements = requirements.split('\n').filter(l => l.trim() !== '');
      const parsedNotes = notes.split('\n').filter(l => l.trim() !== '');

      const payload = {
        name,
        slug,
        category_id: categoryId,
        short_description: shortDesc || null,
        full_description: fullDesc || null,
        logo_url: logoUrl || null,
        cover_image_url: coverUrl || null,
        features: parsedFeatures,
        benefits: parsedBenefits,
        requirements: parsedRequirements,
        important_notes: parsedNotes,
        is_active: isActive,
        is_featured: isFeatured,
        is_popular: isPopular,
        updated_at: new Date().toISOString()
      };

      if (selectedService) {
        // Update
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', selectedService.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('services')
          .insert([{ ...payload, sort_order: 0 }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_services'] });
      toast.success('تم حفظ الخدمة بنجاح');
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء الحفظ');
    }
  });

  // Delete Service Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_services'] });
      toast.success('تم حذف الخدمة بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل حذف الخدمة. تأكد من عدم وجود باقات مرتبطة بها أولاً.');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الخدمات</h1>
          <p className="text-muted-foreground">إضافة وتعديل الخدمات المعروضة على المتجر.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-1.5" />
              إضافة خدمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-right">
                {selectedService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-right">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الخدمة *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">الرابط الفريد (Slug) *</Label>
                  <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>التصنيف *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDesc">الوصف القصير</Label>
                <Input id="shortDesc" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDesc">الوصف التفصيلي (HTML أو نص طويل)</Label>
                <Textarea id="fullDesc" value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ImageUpload
                  bucketName="service-images"
                  onUploadSuccess={setLogoUrl}
                  label="شعار الخدمة (Logo)"
                />
                <ImageUpload
                  bucketName="service-images"
                  onUploadSuccess={setCoverUrl}
                  label="صورة الغلاف (Cover Image)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">المميزات (اكتب كل ميزة في سطر منفصل)</Label>
                <Textarea id="features" value={features} onChange={(e) => setFeatures(e.target.value)} rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefits">الفوائد (كل فائدة في سطر منفصل)</Label>
                <Textarea id="benefits" value={benefits} onChange={(e) => setBenefits(e.target.value)} rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requirements">شروط التفعيل (كل شرط في سطر)</Label>
                  <Textarea id="requirements" value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات هامة للعميل (كل ملاحظة في سطر)</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="isActive">نشط ومعروض</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                  <Label htmlFor="isFeatured">مميز</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isPopular" checked={isPopular} onCheckedChange={setIsPopular} />
                  <Label htmlFor="isPopular">الأكثر طلباً</Label>
                </div>
              </div>

              <Button 
                onClick={() => saveMutation.mutate()} 
                className="w-full mt-6"
                disabled={saveMutation.isPending || !name || !slug || !categoryId}
              >
                {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>

            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : services && services.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الخدمة</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">مميز / رائج</TableHead>
                  <TableHead className="text-left"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-bold flex items-center gap-3">
                      {service.logo_url && (
                        <div className="w-8 h-8 rounded bg-white p-0.5 border shrink-0 flex items-center justify-center">
                          <img src={service.logo_url} alt="" className="max-h-full object-contain" />
                        </div>
                      )}
                      <span>{service.name}</span>
                    </TableCell>
                    <TableCell>{service.category?.name || 'بدون'}</TableCell>
                    <TableCell>
                      {service.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">نشط</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {service.is_featured && <Badge className="bg-amber-500">مميز</Badge>}
                        {service.is_popular && <Badge variant="secondary">رائج</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-left space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
                          deleteMutation.mutate(service.id);
                        }
                      }}>
                        <Trash className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              لا توجد خدمات متاحة حالياً.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
