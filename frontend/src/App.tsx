import { AppProviders } from "./app/providers/AppProviders";
import { AppRouter } from "./app/router/AppRouter";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <AppProviders>
      <AppRouter />
      <Toaster position="top-right" />
    </AppProviders>
  );
}

export default App;
