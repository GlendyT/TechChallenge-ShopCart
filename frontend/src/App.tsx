import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/useAuth";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { StoreLayout } from "./components/StoreLayout";
import { AccountPage } from "./pages/AccountPage";
import { AuthPage } from "./pages/AuthPage";
import { CartPage } from "./pages/CartPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CheckoutPage, OrderConfirmationPage } from "./pages/CheckoutPage";
import { ProductPage } from "./pages/ProductPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

function RequireAuthentication() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate
      to="/acceso"
      state={{ from: `${location.pathname}${location.search}` }}
      replace
    />
  );
}

function RouteNotFound() {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-7xl flex-col items-start justify-center px-5 py-16 sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-dn-rojo">
        404 · Fuera de colección
      </p>
      <h1 className="mt-4 max-w-2xl text-5xl font-semibold tracking-tight text-dn-gris-oscuro sm:text-7xl">
        Esta página tomó otro camino.
      </h1>
      <Button asChild className="mt-8">
        <Link to="/">Volver a la tienda</Link>
      </Button>
    </section>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="producto/:codigoPublico" element={<ProductPage />} />
        <Route path="carrito" element={<CartPage />} />
        <Route path="acceso" element={<AuthPage mode="signin" />} />
        <Route path="registro" element={<AuthPage mode="signup" />} />
        <Route
          path="pedido-confirmado/:codigoPublico"
          element={<OrderConfirmationPage />}
        />
        <Route element={<RequireAuthentication />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="cuenta" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<RouteNotFound />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
