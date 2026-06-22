import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Loader2 } from 'lucide-react';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin_categories_crud'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setSelectedCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setIsActive(true);
  };

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setName(category.name || '');
    setSlug(category.slug || '');
    setDescription(category.description || '');
    setImageUrl(category.image_url || '');
    setIsActive(category.is_active);
    setIsOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        slug,
        description: description || null,
        image_url: imageUrl || null,
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      if (selectedCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', selectedCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ ...payload, sort_order: 0 }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_categories_crud'] });
      toast.success('تم حفظ التصنيف بنجاح');
      setIsOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'خطأ أثناء الحفظ');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_categories_crud'] });
      toast.success('تم حذف التصنيف بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل حذف التصنيف. ربما توجد خدمات مرتبطة به.');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة التصنيفات</h1>
          <p className="text-muted-foreground">تنظيم الاشتراكات الرقمية وتسهيل تصفحها للعملاء.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-1.5" />
              إضافة تصنيف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">
                {selectedCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-right">
              
              <div className="space-y-2">
                <Label htmlFor="name">اسم التصنيف *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">الرابط الفريد (Slug) *</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">الوصف</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <ImageUpload
                bucketName="category-images"
                onUploadSuccess={setImageUrl}
                label="صورة التصنيف"
              />

              <div className="flex items-center gap-2 pt-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive">نشط ومعروض</Label>
              </div>

              <Button 
                onClick={() => saveMutation.mutate()} 
                className="w-full mt-4"
                disabled={saveMutation.isPending || !name || !slug}
              >
                {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ التصنيف'}
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
          ) : categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">الرابط الفريد</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-bold flex items-center gap-3">
                      {cat.image_url && (
                        <div className="w-8 h-8 rounded bg-white p-0.5 border shrink-0 flex items-center justify-center">
                          <img src={cat.image_url} alt="" className="max-h-full object-contain" />
                        </div>
                      )}
                      <span>{cat.name}</span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{cat.slug}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{cat.description || '-'}</TableCell>
                    <TableCell>
                      {cat.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">نشط</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700">غير نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(cat)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
                          deleteMutation.mutate(cat.id);
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
              لا توجد تصنيفات متاحة حالياً.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
