import { Navigate, useParams } from "react-router-dom";
import { routePaths } from "../../../app/router/routePaths";
import { ProductPage } from "../pages/ProductPage";

export function ProductRoute() {
  const { codigoPublico } = useParams<{ codigoPublico: string }>();
  if (!codigoPublico) return <Navigate to={routePaths.home} replace />;
  return <ProductPage codigoPublico={codigoPublico} />;
}
