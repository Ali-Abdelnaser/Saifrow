import { useRouteError, Link, isRouteErrorResponse } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function ErrorPage() {
  const error = useRouteError();
  console.error('Application Error:', error);

  let title = 'حدث خطأ غير متوقع';
  let message = 'نعتذر عن ذلك، واجهنا مشكلة أثناء تحميل الصفحة.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'الصفحة غير موجودة';
      message = 'عذراً، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.';
    } else {
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 rtl" dir="rtl">
      <div className="w-full max-w-md bg-card border rounded-2xl p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button asChild className="flex-1 gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              الرئيسية
            </Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="flex-1 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث الصفحة
          </Button>
        </div>

        {import.meta.env.DEV && !!error && (
          <div className="text-left mt-6 p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-40 border" dir="ltr">
            <p className="font-bold text-destructive mb-1">Developer Debug Info:</p>
            <pre>{JSON.stringify(error, null, 2) || String(error)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
