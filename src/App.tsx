import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n";
import { LicenseProvider } from "@/hooks/useLicense";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <LicenseProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Index />
        </TooltipProvider>
      </LicenseProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
