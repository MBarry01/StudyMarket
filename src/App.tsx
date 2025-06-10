import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ListingsPage } from './pages/ListingsPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { EnvironmentalImpactPage } from './pages/EnvironmentalImpactPage';
import { SavedSearchesPage } from './pages/SavedSearchesPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { HelpPage } from './pages/HelpPage';
import { SafetyPage } from './pages/SafetyPage';
import { MessagesPage } from './pages/MessagesPage';
import { AuthPage } from './pages/AuthPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CartPage } from './components/checkout/CartPage';
import { CheckoutPage } from './components/checkout/CheckoutPage';
import { OrdersPage } from './components/checkout/OrdersPage';
import { OrderConfirmationPage } from './components/checkout/OrderConfirmationPage';
import { ProductsPage } from './components/checkout/ProductsPage';
import { CheckoutSuccessPage } from './components/checkout/CheckoutSuccessPage';
import './App.css';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 pt-16">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/listings" element={<ListingsPage />} />
                <Route path="/listing/:id" element={<ListingDetailPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/safety" element={<SafetyPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route
                  path="/checkout"
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
              </Routes>
            </main>
            <Footer />
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