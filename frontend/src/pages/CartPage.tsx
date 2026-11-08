import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { cartQueryKey, fetchCart, removeCartItem, updateCartItem } from '../catalog/cart'
import { formatPrice } from '../lib/format'

export function CartPage() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const cart = useQuery({ queryKey: cartQueryKey, queryFn: fetchCart, retry: false })
  const changeQuantity = useMutation({
    mutationFn: ({ idVariante, cantidad }: { idVariante: number; cantidad: number }) => updateCartItem(idVariante, cantidad),
    onSuccess: (updated) => queryClient.setQueryData(cartQueryKey, updated),
  })
  const removeItem = useMutation({
    mutationFn: removeCartItem,
    onSuccess: (updated) => queryClient.setQueryData(cartQueryKey, updated),
  })
  const error = changeQuantity.error ?? removeItem.error ?? cart.error
  const errorMessage = error instanceof ApiError ? error.message : error?.message

  return (
    <section className="page-container cart-page">
      <div className="breadcrumbs"><Link to="/">Tienda</Link><span>/</span><span>Tu bolsa</span></div>
      <div className="section-heading cart-heading"><div><p className="eyebrow">Piezas elegidas con intención</p><h1>Tu <em>bolsa.</em></h1></div><span>{cart.data?.TotalArticulos ?? 0} artículos</span></div>
      {cart.isPending ? <div className="state-panel"><p>Cargando tu bolsa…</p></div> : cart.isError ? <div className="state-panel state-panel--error" role="alert"><h2>No pudimos abrir tu bolsa</h2><p>{cart.error.message}</p><button className="button button--outline" type="button" onClick={() => void cart.refetch()}>Intentar de nuevo</button></div> : !cart.data?.items.length ? (
        <div className="empty-cart"><span className="empty-cart__icon" aria-hidden="true">♧</span><h2>Tu próxima pieza te espera.</h2><p>Aún no has agregado nada. Explora la colección y encuentra eso que se siente como tú.</p><Link className="button button--dark" to="/">Explorar la tienda <span aria-hidden="true">↗</span></Link></div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            <div className="cart-table-head"><span>Pieza</span><span>Precio</span><span>Cantidad</span><span>Total</span></div>
            {cart.data.items.map((item) => <article className="cart-item" key={item.IDVariante}>
              <Link to={`/producto/${item.CodigoPublicoProducto}`} className="cart-item__photo">{item.ImagenURL ? <img src={item.ImagenURL} alt="" /> : <span>DA</span>}</Link>
              <div className="cart-item__description"><Link to={`/producto/${item.CodigoPublicoProducto}`}>{item.NombreProducto}</Link><span>{item.NombreVariante}{item.SKU ? ` · ${item.SKU}` : ''}</span><button className="text-button text-button--small" type="button" onClick={() => removeItem.mutate(item.IDVariante)} disabled={removeItem.isPending}>Quitar</button></div>
              <span className="cart-item__price">{formatPrice(item.PrecioUnitario)}</span>
              <div className="quantity-control"><button aria-label={`Disminuir cantidad de ${item.NombreProducto}`} type="button" disabled={item.Cantidad <= 1 || changeQuantity.isPending} onClick={() => changeQuantity.mutate({ idVariante: item.IDVariante, cantidad: item.Cantidad - 1 })}>−</button><span>{item.Cantidad}</span><button aria-label={`Aumentar cantidad de ${item.NombreProducto}`} type="button" disabled={item.Cantidad >= item.ExistenciaDisponible || changeQuantity.isPending} onClick={() => changeQuantity.mutate({ idVariante: item.IDVariante, cantidad: item.Cantidad + 1 })}>+</button></div>
              <strong className="cart-item__total">{formatPrice(item.SubtotalLinea)}</strong>
            </article>)}
            {errorMessage && <p className="form-alert" role="alert">{errorMessage}</p>}
            <Link className="text-button continue-shopping" to="/">← Seguir explorando</Link>
          </div>
          <aside className="order-summary"><p className="eyebrow">Resumen</p><h2>Tu selección</h2><div className="summary-line"><span>Subtotal</span><span>{formatPrice(cart.data.Subtotal)}</span></div><div className="summary-line"><span>Envío</span><span>Se calcula al confirmar</span></div><div className="summary-total"><span>Total</span><strong>{formatPrice(cart.data.Subtotal)}</strong></div><p className="summary-note">Los precios incluyen IVA. El costo de envío se confirma durante el checkout.</p><Link className="button button--dark button--wide" to={isAuthenticated ? '/checkout' : '/acceso?next=/checkout'}>Continuar al checkout <span aria-hidden="true">↗</span></Link><div className="secure-note"><span aria-hidden="true">✳</span> Pago seguro · Inventario reservado por 15 min</div></aside>
        </div>
      )}
    </section>
  )
}
