import { useQuery } from '@tanstack/react-query'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { cartQueryKey, fetchCart } from '../catalog/cart'

export function StoreLayout() {
  const { user, signOut } = useAuth()
  const cart = useQuery({ queryKey: cartQueryKey, queryFn: fetchCart, retry: false, staleTime: 20_000 })
  const cartCount = cart.data?.TotalArticulos ?? 0

  return (
    <div className="app-shell">
      <div className="announcement-bar">
        <span>Una forma más personal de vestir</span>
        <span className="announcement-bar__right">Envíos en toda Guatemala · Compra segura</span>
      </div>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Don Arturo, inicio">
          <span className="brand__mark">DA</span>
          <span className="brand__wordmark">DON ARTURO<span>GUATEMALA · DESDE 1987</span></span>
        </Link>
        <nav className="main-nav" aria-label="Navegación principal">
          <NavLink to="/">Tienda</NavLink>
          <a href="/#colecciones">Colecciones</a>
          <a href="/#nosotros">Nuestra historia</a>
        </nav>
        <div className="header-actions">
          {user ? (
            <div className="user-action">
              <Link className="account-link" to="/cuenta"><span className="header-icon" aria-hidden="true">♙</span><span className="account-link__label">Hola, {user.nombre.split(' ')[0]}</span></Link>
              <button className="signout-button" type="button" onClick={() => void signOut()}>Salir</button>
            </div>
          ) : (
            <Link className="icon-link account-link" to="/acceso" aria-label="Iniciar sesión"><span className="header-icon" aria-hidden="true">♙</span><span className="account-link__label">Ingresar</span></Link>
          )}
          <Link className="icon-link cart-link" to="/carrito" aria-label={`Carrito, ${cartCount} artículos`}>
            <span className="header-icon" aria-hidden="true">♧</span>
            <span className="account-link__label">Bolsa</span>
            <span className="cart-count">{cartCount}</span>
          </Link>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer" id="nosotros">
        <Link className="brand brand--footer" to="/">
          <span className="brand__mark">DA</span>
          <span className="brand__wordmark">DON ARTURO<span>GUATEMALA · DESDE 1987</span></span>
        </Link>
        <p>Prendas para acompañarte en cada momento.</p>
        <span>© {new Date().getFullYear()} Don Arturo. Hecho con cuidado en Guatemala.</span>
      </footer>
    </div>
  )
}
