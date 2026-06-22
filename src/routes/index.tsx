import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import HomePage from '@/pages/public/Home';
import LoginPage from '@/pages/public/auth/Login';
import RegisterPage from '@/pages/public/auth/Register';
import ForgotPasswordPage from '@/pages/public/auth/ForgotPassword';
import ServicesPage from '@/pages/public/services/Services';
import ServiceDetailsPage from '@/pages/public/services/ServiceDetails';
import CheckoutPage from '@/pages/public/Checkout';
import ProfilePage from '@/pages/public/Profile';
import FaqPage from '@/pages/public/Faq';
import ContactPage from '@/pages/public/Contact';
import TermsPage from '@/pages/public/Terms';
import PrivacyPage from '@/pages/public/Privacy';

// Admin Pages
import { AdminLayout } from '@/components/layout/AdminLayout';
import AdminOverview from '@/pages/admin/Overview';
import AdminOrders from '@/pages/admin/Orders';
import AdminPayments from '@/pages/admin/Payments';
import AdminServices from '@/pages/admin/Services';
import AdminPlans from '@/pages/admin/Plans';
import AdminCategories from '@/pages/admin/Categories';
import AdminPaymentMethods from '@/pages/admin/PaymentMethods';
import AdminCoupons from '@/pages/admin/Coupons';
import AdminReviews from '@/pages/admin/Reviews';
import AdminFaqs from '@/pages/admin/Faqs';
import AdminSettings from '@/pages/admin/Settings';
import AdminTeam from '@/pages/admin/Team';
import AdminLogs from '@/pages/admin/Logs';
import AdminContacts from '@/pages/admin/Contacts';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'services/:slug', element: <ServiceDetailsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout/:planId',
        element: (
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        ),
      },
      // Static
      { path: 'faq', element: <FaqPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminOverview /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'payments', element: <AdminPayments /> },
      { path: 'services', element: <AdminServices /> },
      { path: 'plans', element: <AdminPlans /> },
      { path: 'categories', element: <AdminCategories /> },
      { path: 'payment-methods', element: <AdminPaymentMethods /> },
      { path: 'coupons', element: <AdminCoupons /> },
      { path: 'reviews', element: <AdminReviews /> },
      { path: 'faqs', element: <AdminFaqs /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'team', element: <AdminTeam /> },
      { path: 'logs', element: <AdminLogs /> },
      { path: 'contacts', element: <AdminContacts /> },
    ],
  },
]);
