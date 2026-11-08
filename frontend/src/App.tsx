import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/useAuth";
import { StoreLayout } from "./components/StoreLayout";
import { AccountPage } from "./pages/AccountPage";
import { AuthPage } from "./pages/AuthPage";
import { CartPage } from "./pages/CartPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CheckoutPage, OrderConfirmationPage } from "./pages/CheckoutPage";
import { ProductPage } from "./pages/ProductPage";
import "./App.css";

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
    <section className="page-container not-found">
      <p className="eyebrow">404 · Fuera de colección</p>
      <h1>
        Esta página
        <br />
        <em>tomó otro camino.</em>
      </h1>
      <a className="button button--dark" href="/">
        Volver a la tienda <span aria-hidden="true">↗</span>
      </a>
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
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
