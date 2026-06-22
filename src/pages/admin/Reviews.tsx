import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Loader2, Star } from 'lucide-react';

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Fetch reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin_reviews_crud'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setSelectedReview(null);
    setCustomerName('');
    setRating(5);
    setReviewText('');
    setIsFeatured(true);
    setIsActive(true);
  };

  const handleEdit = (review: any) => {
    setSelectedReview(review);
    setCustomerName(review.customer_name || '');
    setRating(review.rating || 5);
    setReviewText(review.review_text || '');
    setIsFeatured(review.is_featured);
    setIsActive(review.is_active);
    setIsOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customer_name: customerName,
        rating,
        review_text: reviewText,
        is_featured: isFeatured,
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      if (selectedReview) {
        const { error } = await supabase
          .from('reviews')
          .update(payload)
          .eq('id', selectedReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert([{ ...payload, sort_order: 0 }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_reviews_crud'] });
      toast.success('تم حفظ التقييم بنجاح');
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
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_reviews_crud'] });
      toast.success('تم حذف التقييم بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل حذف التقييم.');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تقييمات وآراء العملاء</h1>
          <p className="text-muted-foreground">إدارة وعرض التقييمات في الصفحة الرئيسية للمتجر.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-1.5" />
              إضافة تقييم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">
                {selectedReview ? 'تعديل التقييم' : 'إضافة تقييم جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-right">
              
              <div className="space-y-2">
                <Label htmlFor="customerName">اسم العميل *</Label>
                <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>التقييم بالنجوم *</Label>
                <Select value={rating.toString()} onValueChange={(val) => setRating(Number(val))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((val) => (
                      <SelectItem key={val} value={val.toString()}>
                        <div className="flex items-center gap-1">
                          <span>{val}</span>
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewText">محتوى التقييم *</Label>
                <Textarea id="reviewText" value={reviewText} onChange={(e) => setReviewText(e.target.value)} required rows={4} />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                  <Label htmlFor="isFeatured">عرض بالصفحة الرئيسية</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="isActive">نشط ومفعل</Label>
                </div>
              </div>

              <Button 
                onClick={() => saveMutation.mutate()} 
                className="w-full mt-4"
                disabled={saveMutation.isPending || !customerName || !reviewText}
              >
                {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ التقييم'}
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
          ) : reviews && reviews.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">التقييم</TableHead>
                  <TableHead className="text-right">الرأي</TableHead>
                  <TableHead className="text-right">رئيسي / نشط</TableHead>
                  <TableHead className="text-left"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-bold">{review.customer_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{review.review_text}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {review.is_featured && <Badge className="bg-blue-50 text-blue-700">الرئيسية</Badge>}
                        {review.is_active ? <Badge variant="outline" className="bg-green-50 text-green-700">نشط</Badge> : <Badge variant="outline">غير نشط</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-left space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(review)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
                          deleteMutation.mutate(review.id);
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
              لا توجد تقييمات للعملاء حالياً.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
