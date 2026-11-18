import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Announcements from "./pages/Announcements";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import PastorAdmin from "./pages/PastorAdmin";
import Sitemap from "./pages/Sitemap";
import Helpdesk from "./pages/Helpdesk";
import AdminHelpdesk from "./pages/AdminHelpdesk";
import Settings from "./pages/Settings";
import Notes from "./pages/Notes";
import Mentorship from "./pages/Mentorship";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pastor-admin" element={<PastorAdmin />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/helpdesk" element={<Helpdesk />} />
          <Route path="/admin/helpdesk" element={<AdminHelpdesk />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/mentorship" element={<Mentorship />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
