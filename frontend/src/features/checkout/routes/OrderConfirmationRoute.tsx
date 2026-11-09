import { Navigate, useParams } from "react-router-dom";
import { routePaths } from "../../../app/router/routePaths";
import { OrderConfirmationPage } from "../pages/OrderConfirmationPage";

export function OrderConfirmationRoute() {
  const { codigoPublico } = useParams<{ codigoPublico: string }>();
  if (!codigoPublico) return <Navigate to={routePaths.home} replace />;
  return <OrderConfirmationPage codigoPublico={codigoPublico} />;
}
