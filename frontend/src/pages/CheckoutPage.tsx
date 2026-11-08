import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { cartQueryKey, fetchCart } from '../catalog/cart'
import { formatPrice } from '../lib/format'

interface Address {
  IDDireccion: number
  NombreDestinatario: string
  TelefonoContacto: string
  DireccionLinea1: string
  DireccionLinea2?: string | null
  Ciudad: string
  Departamento: string
  EsPrincipal: boolean
}

interface CreatedOrder {
  CodigoPublico: string
  NumeroPedido: string
  Total: number
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null)
  const [coupon, setCoupon] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const cart = useQuery({ queryKey: cartQueryKey, queryFn: fetchCart, retry: false })
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: () => apiRequest<Address[]>('/auth/direcciones').then((response) => response.datos), retry: false })

  const applyCoupon = useMutation({
    mutationFn: () => apiRequest<{ MontoDescuento?: number }>('/cupones/validar', { method: 'POST', body: JSON.stringify({ codigo: coupon.trim() }) }),
    onSuccess: (response) => setCouponMessage(response.mensaje ?? 'Cupón válido.'),
    onError: (error) => setCouponMessage(error instanceof Error ? error.message : 'No pudimos validar el cupón.'),
  })

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!selectedAddress) throw new Error('Selecciona una dirección de entrega.')
      await apiRequest('/pedidos/checkout/reserva', { method: 'POST', body: JSON.stringify({ claveIdempotencia: idempotencyKey }) })
      const response = await apiRequest<CreatedOrder>('/pedidos/checkout/confirmar', {
        method: 'POST',
        body: JSON.stringify({
          idDireccionEntrega: selectedAddress,
          claveIdempotencia: idempotencyKey,
          metodoPago: 'TARJETA_CREDITO',
          codigoCupon: coupon.trim() || null,
          simularResultadoPago: 'APROBADO',
        }),
      })
      return response.datos
    },
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: cartQueryKey })
      navigate(`/pedido-confirmado/${order.CodigoPublico}`, { replace: true })
    },
  })

  return (
    <section className="page-container checkout-page">
      <div className="breadcrumbs"><Link to="/">Tienda</Link><span>/</span><Link to="/carrito">Tu bolsa</Link><span>/</span><span>Checkout</span></div>
      <p className="eyebrow">Un último detalle</p><h1>Confirmar <em>pedido.</em></h1>
      {cart.isPending || addresses.isPending ? <div className="state-panel">Preparando tu checkout…</div> : cart.isError || addresses.isError ? <div className="state-panel state-panel--error" role="alert"><h2>No pudimos cargar los datos</h2><p>{cart.error?.message ?? addresses.error?.message}</p></div> : !cart.data?.items.length ? <div className="empty-cart"><h2>Tu bolsa está vacía.</h2><Link className="button button--dark" to="/">Volver a la tienda</Link></div> : (
        <div className="checkout-layout">
          <div className="checkout-main">
            <section className="checkout-section"><div className="checkout-section__heading"><span>01</span><div><h2>Dirección de entrega</h2><p>Elige dónde recibir tu pedido.</p></div></div>
              {!addresses.data?.length ? <div className="inline-note">Necesitas guardar una dirección antes de confirmar. <Link to="/cuenta">Ir a mi cuenta ↗</Link></div> : <div className="address-options">{addresses.data.map((address) => <label className={`address-option ${selectedAddress === address.IDDireccion ? 'is-selected' : ''}`} key={address.IDDireccion}><input type="radio" name="address" value={address.IDDireccion} checked={selectedAddress === address.IDDireccion} onChange={() => setSelectedAddress(address.IDDireccion)} /><span className="address-option__radio" /><span><strong>{address.NombreDestinatario}{address.EsPrincipal ? ' · Principal' : ''}</strong><small>{address.DireccionLinea1}{address.DireccionLinea2 ? `, ${address.DireccionLinea2}` : ''}<br />{address.Ciudad}, {address.Departamento} · {address.TelefonoContacto}</small></span></label>)}</div>}
            </section>
            <section className="checkout-section"><div className="checkout-section__heading"><span>02</span><div><h2>Promoción</h2><p>¿Tienes un código de descuento?</p></div></div><div className="coupon-row"><input aria-label="Código de cupón" placeholder="Escribe tu código" value={coupon} onChange={(event) => setCoupon(event.target.value.toUpperCase())} /><button className="button button--outline" type="button" disabled={!coupon.trim() || applyCoupon.isPending} onClick={() => applyCoupon.mutate()}>{applyCoupon.isPending ? 'Validando…' : 'Aplicar'}</button></div>{couponMessage && <p className={applyCoupon.isError ? 'form-alert' : 'form-success'} role="status">{couponMessage}</p>}</section>
            <section className="checkout-section"><div className="checkout-section__heading"><span>03</span><div><h2>Pago simulado</h2><p>La confirmación usa el flujo de demostración del reto; no se realizará un cobro real.</p></div></div><div className="payment-method"><span className="payment-method__icon">▤</span><span><strong>Tarjeta de crédito</strong><small>Autorización de demostración</small></span><span className="payment-method__selected">✓</span></div></section>
            {placeOrder.error && <p className="form-alert" role="alert">{placeOrder.error.message}</p>}
          </div>
          <aside className="order-summary"><p className="eyebrow">Resumen</p><h2>Tu selección</h2>{cart.data.items.map((item) => <div className="checkout-item" key={item.IDVariante}><span>{item.Cantidad} × {item.NombreProducto}<small>{item.NombreVariante}</small></span><strong>{formatPrice(item.SubtotalLinea)}</strong></div>)}<div className="summary-line"><span>Subtotal</span><span>{formatPrice(cart.data.Subtotal)}</span></div><div className="summary-line"><span>Envío</span><span>Por confirmar</span></div><div className="summary-total"><span>Total estimado</span><strong>{formatPrice(cart.data.Subtotal)}</strong></div><button className="button button--dark button--wide" type="button" disabled={!selectedAddress || placeOrder.isPending || !addresses.data?.length} onClick={() => placeOrder.mutate()}>{placeOrder.isPending ? 'Confirmando…' : 'Confirmar pedido'} <span aria-hidden="true">↗</span></button><p className="summary-note">Al confirmar, reservaremos tus piezas por 15 minutos y registraremos tu pedido de forma segura.</p></aside>
        </div>
      )}
    </section>
  )
}

export function OrderConfirmationPage() {
  const { codigoPublico = '' } = useParams()
  const order = useQuery({ queryKey: ['order', codigoPublico], queryFn: () => apiRequest<CreatedOrder>(`/pedidos/${codigoPublico}`).then((response) => response.datos), enabled: Boolean(codigoPublico), retry: false })
  return <section className="page-container confirmation-page"><span className="confirmation-mark">✓</span><p className="eyebrow">Pedido confirmado</p><h1>Gracias por elegirnos.</h1>{order.isPending ? <p>Cargando el resumen de tu pedido…</p> : order.isError ? <p>Tu pedido fue creado. Puedes consultarlo desde tu cuenta.</p> : <><p>Tu número de pedido es <strong>{order.data?.NumeroPedido}</strong>.</p><p>Total: <strong>{formatPrice(order.data?.Total ?? 0)}</strong></p></>}<Link className="button button--dark" to="/cuenta">Ver mi cuenta <span aria-hidden="true">↗</span></Link></section>
}
