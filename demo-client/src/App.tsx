import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ShopProvider } from "./context/ShopContext";
import { ControlPanelProvider } from "./context/ControlPanelContext";
import { FaultlineErrorBoundary } from "./faultline";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ControlPanel } from "./components/ControlPanel/ControlPanel";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { DashboardPage } from "./pages/DashboardPage";

export const App: React.FC = () => {
  return (
    <FaultlineErrorBoundary>
      <ShopProvider>
        <ControlPanelProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white">
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <FaultlineErrorBoundary>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                  </Routes>
                </FaultlineErrorBoundary>
              </main>
              <Footer />
              <ControlPanel />
            </div>
          </Router>
        </ControlPanelProvider>
      </ShopProvider>
    </FaultlineErrorBoundary>
  );
};

export default App;

