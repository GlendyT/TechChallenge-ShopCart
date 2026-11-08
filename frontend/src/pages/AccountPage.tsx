import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../api/client'
import type { AuthUser } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { formatPrice } from '../lib/format'

interface OrderSummary {
  CodigoPublico: string
  NumeroPedido: string
  Estado: string
  Total: number
  FechaCreacion: string
}

interface Address {
  IDDireccion: number
  NombreDestinatario: string
  DireccionLinea1: string
  DireccionLinea2?: string | null
  Ciudad: string
  Departamento: string
  EsPrincipal: boolean
}

export function AccountPage() {
  const { user } = useAuth()
  const orders = useQuery({ queryKey: ['my-orders'], queryFn: () => apiRequest<OrderSummary[]>('/pedidos/mis-pedidos?pagina=1&limite=5').then((response) => response.datos), retry: false })
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: () => apiRequest<Address[]>('/auth/direcciones').then((response) => response.datos), retry: false })

  return (
    <section className="page-container account-page">
      <p className="eyebrow">Tu espacio Don Arturo</p><h1>Hola, <em>{user?.nombre.split(' ')[0]}.</em></h1>
      <div className="account-grid">
        <section className="account-card account-card--wide"><div className="account-card__heading"><div><p className="eyebrow">Tu historia con nosotros</p><h2>Pedidos recientes</h2></div><span className="account-card__number">01</span></div>
          {orders.isPending ? <p className="muted">Cargando pedidos…</p> : orders.isError ? <p className="form-alert" role="alert">No pudimos cargar tus pedidos.</p> : !orders.data?.length ? <div className="account-empty"><p>Aún no hay pedidos. Cuando encuentres tu próxima pieza, la verás aquí.</p><a className="text-button" href="/">Explorar tienda ↗</a></div> : <div className="order-list">{orders.data.map((order) => <div className="order-row" key={order.CodigoPublico}><div><strong>{order.NumeroPedido}</strong><span>{new Date(order.FechaCreacion).toLocaleDateString('es-GT')}</span></div><span className="order-status">{order.Estado.replaceAll('_', ' ')}</span><strong>{formatPrice(order.Total)}</strong></div>)}</div>}
        </section>
        <section className="account-card"><div className="account-card__heading"><div><p className="eyebrow">Entrega personal</p><h2>Direcciones</h2></div><span className="account-card__number">02</span></div>
          {addresses.isPending ? <p className="muted">Cargando direcciones…</p> : addresses.isError ? <p className="form-alert" role="alert">No pudimos cargar tus direcciones.</p> : !addresses.data?.length ? <p className="muted">Todavía no tienes direcciones guardadas.</p> : addresses.data.map((address) => <div className="address-block" key={address.IDDireccion}><strong>{address.NombreDestinatario}{address.EsPrincipal ? ' · Principal' : ''}</strong><span>{address.DireccionLinea1}{address.DireccionLinea2 ? `, ${address.DireccionLinea2}` : ''}</span><span>{address.Ciudad}, {address.Departamento}</span></div>)}
        </section>
        <section className="account-card"><div className="account-card__heading"><div><p className="eyebrow">Tu perfil</p><h2>Datos de cuenta</h2></div><span className="account-card__number">03</span></div><UserDetails user={user} /></section>
      </div>
    </section>
  )
}

function UserDetails({ user }: { user: AuthUser | null }) {
  return <div className="account-details"><span>Nombre</span><strong>{user ? `${user.nombre} ${user.apellido}` : '—'}</strong><span>Correo</span><strong>{user?.correo ?? '—'}</strong><span>Teléfono</span><strong>{user?.telefono || 'No registrado'}</strong></div>
}
