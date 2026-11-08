import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { OperationsLayout } from "../../components/OperationsLayout";
import { StoreLayout } from "../../components/StoreLayout";
import { AccountPage } from "../../features/account/pages/AccountPage";
import { AuthPage } from "../../features/auth/pages/AuthPage";
import { CartPage } from "../../features/cart/pages/CartPage";
import { CatalogPage } from "../../features/catalog/pages/CatalogPage";
import { CheckoutPage } from "../../features/checkout/pages/CheckoutPage";
import { OrderConfirmationRoute } from "../../features/checkout/routes/OrderConfirmationRoute";
import { ProductRoute } from "../../features/catalog/routes/ProductRoute";
import { RequireAuthentication } from "./guards/RequireAuthentication";
import { RequireRole } from "./guards/RequireRole";
import { routePaths } from "./routePaths";
import { OrdersPage } from "../../features/operations/orders/pages/OrdersPage";
import { InventoryPage } from "../../features/operations/inventory/pages/InventoryPage";
import { ReportsPage } from "../../features/operations/reports/pages/ReportsPage";
import { AdminCatalogPage } from "../../features/administration/pages/AdminCatalogPage";
import { AdminUsersPage } from "../../features/administration/pages/AdminUsersPage";

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
        <Link to={routePaths.home}>Volver a la tienda</Link>
      </Button>
    </section>
  );
}

function nestedRoutePath(path: string) {
  return path.startsWith("/") ? path.slice(1) : path;
}

function childRoutePath(parentPath: string, childPath: string) {
  const parent = nestedRoutePath(parentPath);
  const child = nestedRoutePath(childPath);
  return child.slice(parent.length + 1);
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<CatalogPage />} />
        <Route
          path={nestedRoutePath(routePaths.product)}
          element={<ProductRoute />}
        />
        <Route path={nestedRoutePath(routePaths.cart)} element={<CartPage />} />
        <Route
          path={nestedRoutePath(routePaths.signIn)}
          element={<AuthPage mode="signin" />}
        />
        <Route
          path={nestedRoutePath(routePaths.signUp)}
          element={<AuthPage mode="signup" />}
        />
        <Route
          path={nestedRoutePath(routePaths.orderConfirmation)}
          element={<OrderConfirmationRoute />}
        />
        <Route element={<RequireAuthentication />}>
          <Route
            path={nestedRoutePath(routePaths.checkout)}
            element={<CheckoutPage />}
          />
          <Route
            path={nestedRoutePath(routePaths.account)}
            element={<AccountPage />}
          />
        </Route>
        <Route path="*" element={<RouteNotFound />} />
      </Route>
      <Route
        element={<RequireRole allowedRoles={["Operador", "Administrador"]} />}
      >
        <Route
          path={nestedRoutePath(routePaths.operations)}
          element={<OperationsLayout />}
        >
          <Route index element={<ReportsPage />} />
          <Route
            path={childRoutePath(
              routePaths.operations,
              routePaths.operationsOrders,
            )}
            element={<OrdersPage />}
          />
          <Route
            path={childRoutePath(
              routePaths.operations,
              routePaths.operationsInventory,
            )}
            element={<InventoryPage />}
          />
          <Route
            path={childRoutePath(
              routePaths.operations,
              routePaths.operationsReports,
            )}
            element={<ReportsPage />}
          />
        </Route>
      </Route>
      <Route element={<RequireRole allowedRoles={["Administrador"]} />}>
        <Route
          path={nestedRoutePath(routePaths.administration)}
          element={<OperationsLayout />}
        >
          <Route
            path={childRoutePath(
              routePaths.administration,
              routePaths.administrationCatalog,
            )}
            element={<AdminCatalogPage />}
          />
          <Route
            path={childRoutePath(
              routePaths.administration,
              routePaths.administrationUsers,
            )}
            element={<AdminUsersPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
