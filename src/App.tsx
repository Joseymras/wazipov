import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import CameraPage from "./pages/CameraPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import EventFormPage from "./pages/EventFormPage";
import QRCodePage from "./pages/QRCodePage";
import GalleryPage from "./pages/GalleryPage";
import AdminPage from "./pages/AdminPage";
import ReferralPage from "./pages/ReferralPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import NotFound from "./pages/NotFound";
import AIChatWidget from "@/components/AIChatWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/camera/:eventId" element={<CameraPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><EventFormPage /></ProtectedRoute>} />
            <Route path="/events/:eventId/edit" element={<ProtectedRoute><EventFormPage /></ProtectedRoute>} />
            <Route path="/events/:eventId/qr" element={<ProtectedRoute><QRCodePage /></ProtectedRoute>} />
            <Route path="/events/:eventId/gallery" element={<GalleryPage />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIChatWidget />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
