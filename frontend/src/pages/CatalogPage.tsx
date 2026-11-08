import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'
import { ProductCard } from '../components/ProductCard'
import type { ApiEnvelope } from '../api/client'
import type { Category, Product } from '../catalog/types'

interface ProductPageResult extends ApiEnvelope<Product[]> {
  totalRegistros: number
  paginaActual: number
  tamanoPagina: number
  totalPaginas: number
}

export function CatalogPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [order, setOrder] = useState('RECIENTE')
  const [page, setPage] = useState(1)
  const [inStock, setInStock] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [search])

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<Category[]>('/catalogo/categorias').then((response) => response.datos),
    staleTime: 5 * 60_000,
  })

  const products = useQuery({
    queryKey: ['products', debouncedSearch, category, order, page, inStock],
    queryFn: async () => {
      const params = new URLSearchParams({ pagina: String(page), limite: '9', orden: order })
      if (debouncedSearch) params.set('busqueda', debouncedSearch)
      if (category) params.set('idCategoria', category)
      if (inStock) params.set('soloConStock', 'true')
      return apiRequest<Product[]>(`/catalogo/productos?${params}`).then((response) => response as ProductPageResult)
    },
    placeholderData: (previous) => previous,
  })

  const productRows = products.data?.datos ?? []
  const totalPages = products.data?.totalPaginas ?? 1

  return (
    <>
      <section className="hero-banner" aria-labelledby="hero-title">
        <div className="hero-banner__copy">
          <p className="eyebrow"><span /> Vestir bien, vivir mejor</p>
          <h1 id="hero-title">Los buenos momentos<br />también se <em>visten.</em></h1>
          <p className="hero-banner__description">Piezas pensadas para durar. Encuentra tu próximo favorito entre nuestros esenciales.</p>
          <a className="button button--dark" href="#colecciones">Explorar colección <span aria-hidden="true">↘</span></a>
          <div className="hero-banner__footnote"><span>01 — 03</span><span className="hero-banner__rule" /><span>Nueva temporada</span></div>
        </div>
        <div className="hero-banner__visual" role="img" aria-label="Selección de prendas de la nueva temporada">
          <div className="hero-banner__image" />
          <div className="hero-banner__stamp"><span>ESTILO</span><strong>con<br />intención</strong><span>DA · 1987</span></div>
          <span className="hero-banner__vertical">COLECCIÓN ESENCIA · 2026</span>
        </div>
      </section>

      <section className="catalog-section" id="colecciones" aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selección Don Arturo</p>
            <h2 id="catalog-title">Encuentra tu <em>esencial.</em></h2>
          </div>
          <p>Prendas versátiles, buenos materiales<br />y detalles que se sienten.</p>
        </div>

        <div className="catalog-toolbar">
          <div className="category-pills" aria-label="Filtrar por categoría">
            <button className={!category ? 'category-pill is-active' : 'category-pill'} onClick={() => { setCategory(''); setPage(1) }} type="button">Todo</button>
            {categories.data?.map((item) => (
              <button key={item.IDCategoria} className={category === String(item.IDCategoria) ? 'category-pill is-active' : 'category-pill'} onClick={() => { setCategory(String(item.IDCategoria)); setPage(1) }} type="button">{item.Nombre}</button>
            ))}
          </div>
          <div className="catalog-controls">
            <label className="stock-toggle"><input type="checkbox" checked={inStock} onChange={(event) => { setInStock(event.target.checked); setPage(1) }} /> Solo disponibles</label>
            <label className="sort-control"><span>Ordenar</span><select aria-label="Ordenar productos" value={order} onChange={(event) => { setOrder(event.target.value); setPage(1) }}>
              <option value="RECIENTE">Más recientes</option>
              <option value="PRECIO_ASC">Precio: menor a mayor</option>
              <option value="PRECIO_DESC">Precio: mayor a menor</option>
              <option value="NOMBRE_ASC">Nombre</option>
            </select></label>
          </div>
        </div>

        <label className="catalog-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busca una prenda, color o estilo" aria-label="Buscar productos" /><kbd>↵</kbd></label>

        {products.isPending ? (
          <div className="product-grid" aria-label="Cargando productos">{Array.from({ length: 6 }, (_, index) => <div className="product-skeleton" key={index} />)}</div>
        ) : products.isError ? (
          <div className="state-panel state-panel--error" role="alert"><span className="state-panel__symbol">!</span><h3>No pudimos cargar la colección</h3><p>{products.error.message}</p><button className="button button--outline" type="button" onClick={() => void products.refetch()}>Intentar de nuevo</button></div>
        ) : productRows.length === 0 ? (
          <div className="state-panel"><span className="state-panel__symbol">⌕</span><h3>No encontramos esa pieza</h3><p>Prueba con otra búsqueda o explora todas las categorías.</p><button className="text-button" type="button" onClick={() => { setSearch(''); setCategory(''); setInStock(false) }}>Limpiar filtros <span aria-hidden="true">↗</span></button></div>
        ) : (
          <>
            <div className="product-grid" aria-live="polite">{productRows.map((product) => <ProductCard key={product.IDProducto} product={product} />)}</div>
            <div className="pagination-bar"><span>{products.data?.totalRegistros ?? 0} piezas seleccionadas</span><div className="pagination-controls"><button aria-label="Página anterior" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>←</button><span>{page.toString().padStart(2, '0')} <span className="pagination-separator">/</span> {totalPages.toString().padStart(2, '0')}</span><button aria-label="Página siguiente" type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>→</button></div></div>
          </>
        )}
      </section>

      <section className="brand-note">
        <span className="brand-note__ornament" aria-hidden="true">✳</span>
        <p>Diseñamos para acompañarte,<br /><em>no para llamar la atención.</em></p>
        <span className="brand-note__signature">— Don Arturo</span>
      </section>
    </>
  )
}
