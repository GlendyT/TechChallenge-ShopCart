import { ArrowLeft, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { routePaths } from '../app/router/routePaths'
import { useAuth } from '../shared/auth/useAuth'
import { RoleNavigation } from './RoleNavigation'
import { Button } from './ui/button'

export function OperationsLayout() {
  const { user, signOut } = useAuth()
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)

  useEffect(() => {
    if (!isNavigationOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsNavigationOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isNavigationOpen])

  if (!user) return <Navigate to={routePaths.signIn} replace />
  if (user.rol === 'Cliente') return <Navigate to={routePaths.home} replace />

  return (
    <div className="min-h-screen bg-dn-gris/5 text-dn-gris-oscuro md:grid md:grid-cols-[250px_minmax(0,1fr)]">
      {isNavigationOpen && <button className="fixed inset-0 z-30 bg-black/40 md:hidden" type="button" aria-label="Cerrar menú de operaciones" onClick={() => setIsNavigationOpen(false)} />}
      <aside aria-label="Menú de operaciones" className={`${isNavigationOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[min(285px,86vw)] flex-col bg-dn-azul px-4 py-5 text-white transition-transform md:sticky md:top-0 md:h-screen md:w-auto md:translate-x-0`}>
        <Link className="flex items-center gap-3 border-b border-white/15 px-2 pb-6" to="/" aria-label="Don Arturo, volver a tienda">
          <span className="grid size-10 place-items-center rounded-md bg-dn-azul font-bold text-white">DA</span>
          <span className="text-xs font-extrabold tracking-[0.12em]">DON ARTURO<small className="mt-1 block text-[9px] font-medium tracking-[0.14em] text-white/65">GESTIÓN DE TIENDA</small></span>
        </Link>
        <RoleNavigation role={user.rol} onNavigate={() => setIsNavigationOpen(false)} />
        <div className="mt-auto border-t border-white/15 px-1 pt-4">
          <div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold text-white">{user.nombre.slice(0, 1)}{user.apellido.slice(0, 1)}</span><div className="min-w-0"><strong className="block truncate text-xs font-semibold">{user.nombre} {user.apellido}</strong><small className="text-[10px] text-white/65">{user.rol}</small></div></div>
          <button className="ml-12 mt-3 block text-xs text-white/70 hover:text-white" type="button" onClick={() => void signOut()}>Cerrar sesión</button>
          <Link className="ml-12 mt-3 inline-flex items-center gap-2 text-xs text-white/70 hover:text-white" to="/"><ArrowLeft aria-hidden="true" size={15} /> Volver a la tienda</Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-16 items-center gap-3 border-b border-dn-gris/20 bg-white px-4 text-sm font-semibold sm:px-8">
          <Button
            className="md:hidden"
            variant="outline"
            size="icon"
            type="button"
            aria-label={isNavigationOpen ? 'Cerrar navegación' : 'Abrir navegación'}
            aria-expanded={isNavigationOpen}
            onClick={() => setIsNavigationOpen((isOpen) => !isOpen)}
          >
            {isNavigationOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
          <span>Panel de operaciones</span>
          <span className="ml-auto rounded-full bg-dn-azul/5 px-3 py-1.5 text-xs font-medium text-dn-azul">{user.rol}</span>
        </header>
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
