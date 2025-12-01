import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { HomePage } from './pages/HomePage';
import { ListingsPage } from './pages/ListingsPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import ProfilePage from './pages/ProfilePage';
import VerificationRequestPage from './pages/VerificationRequestPage';
import { SettingsPage } from './pages/SettingsPage';
import { EnvironmentalImpactPage } from './pages/EnvironmentalImpactPage';
import { SavedSearchesPage } from './pages/SavedSearchesPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { HelpPage } from './pages/HelpPage';
import { SafetyPage } from './pages/SafetyPage';
import { MessagesPage } from './pages/MessagesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { CommunityGuidelinesPage } from './pages/CommunityGuidelinesPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { CookiesPage } from './pages/CookiesPage';
import { AuthPage } from './pages/AuthPage';
import EmailVerificationHandler from './pages/EmailVerificationHandler';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminOverview from './pages/AdminOverview';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminListingsPage from './pages/AdminListingsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminWebhookLogsPage from './pages/AdminWebhookLogsPage';
import AdminPayoutsPage from './pages/AdminPayoutsPage';
import AdminMessagesPage from './pages/AdminMessagesPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminAuditTrailPage from './pages/AdminAuditTrailPage';
import { AdminVerificationsPage } from './pages/AdminVerificationsPage';
import TestValidationPage from './pages/TestValidationPage';
import { AdminRoute } from './components/auth/AdminRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CartPage } from './components/checkout/CartPage';
import { ProductsPage } from './components/checkout/ProductsPage';
import { OrdersPage } from './components/checkout/OrdersPage';
import { SalesPage } from './components/checkout/SalesPage';
import { OrderDetailPage } from './components/checkout/OrderDetailPage';
import { OrderConfirmationPage } from './components/checkout/OrderConfirmationPage';
import { CheckoutSuccessPage } from './components/checkout/CheckoutSuccessPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import EditListingPage from './pages/EditListingPage';
import { JobSearchPage } from './pages/JobSearchPage';
import { HousingListingsPage } from './pages/HousingListingsPage';
import { MapPage } from './pages/MapPage';
import ChatbotWidget from './components/ui/ChatbotWidget';
import SouvenirBanner from './components/SouvenirBanner';
import './App.css';
import React from 'react';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{color:'red',padding:'2rem',textAlign:'center'}}>
          Une erreur est survenue : {this.state.error?.message}
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <SouvenirBanner />
            <main className="flex-1 pt-[3.5rem] md:pt-0 pb-20 md:pb-0 min-h-[100vh]">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/listings" element={<ListingsPage />} />
                  <Route path="/listing/:id" element={<ListingDetailPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/verify-email" element={<EmailVerificationHandler />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/safety" element={<SafetyPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/cookies" element={<CookiesPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                  <Route path="/payment/success" element={<PaymentSuccessPage />} />
                  {/* Admin */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminRoute>
                          <AdminDashboardPage />
                        </AdminRoute>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminOverview />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="listings" element={<AdminListingsPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="webhooks" element={<AdminWebhookLogsPage />} />
                    <Route path="payouts" element={<AdminPayoutsPage />} />
                    <Route path="messages" element={<AdminMessagesPage />} />
                    <Route path="reports" element={<AdminReportsPage />} />
                    <Route path="verifications" element={<AdminVerificationsPage />} />
                    <Route path="audit" element={<AdminAuditTrailPage />} />
                  </Route>
                  <Route
                    path="/checkout/:id"
                    element={
                      <ProtectedRoute>
                        <CheckoutPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <OrdersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sales"
                    element={
                      <ProtectedRoute>
                        <SalesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order-confirmation/:orderId"
                    element={
                      <ProtectedRoute>
                        <OrderConfirmationPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/create"
                    element={
                      <ProtectedRoute>
                        <CreateListingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/verification"
                    element={
                      <ProtectedRoute>
                        <VerificationRequestPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/test-validation"
                    element={
                      <ProtectedRoute>
                        <TestValidationPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/impact"
                    element={
                      <ProtectedRoute>
                        <EnvironmentalImpactPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/saved-searches"
                    element={
                      <ProtectedRoute>
                        <SavedSearchesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/favorites"
                    element={
                      <ProtectedRoute>
                        <FavoritesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payments"
                    element={
                      <ProtectedRoute>
                        <PaymentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute>
                        <MessagesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/edit-listing/:id" element={<EditListingPage />} />
                  <Route path="/jobs" element={<JobSearchPage />} />
                  <Route path="/housing" element={<HousingListingsPage />} />
                  <Route
                    path="/map"
                    element={
                      <ProtectedRoute>
                        <MapPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<div style={{padding:'2rem',textAlign:'center'}}>Page non trouvée (404)</div>} />
                </Routes>
              </ErrorBoundary>
            </main>
            <Footer />
            <ChatbotWidget />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;