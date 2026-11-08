import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { cartQueryKey, updateCartItem } from '../catalog/cart'
import type { ProductDetail } from '../catalog/types'
import { formatPrice } from '../lib/format'

export function ProductPage() {
  const { codigoPublico = '' } = useParams()
  const queryClient = useQueryClient()
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const product = useQuery({
    queryKey: ['product', codigoPublico],
    queryFn: () => apiRequest<ProductDetail>(`/catalogo/productos/${codigoPublico}`).then((response) => response.datos),
    enabled: Boolean(codigoPublico),
  })
  const addItem = useMutation({
    mutationFn: (idVariante: number) => updateCartItem(idVariante, 1),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartQueryKey })
      setNotice('Agregamos esta pieza a tu bolsa.')
    },
  })

  if (product.isPending) return <div className="page-container"><div className="detail-loading" /></div>
  if (product.isError || !product.data) return <div className="page-container"><div className="state-panel state-panel--error" role="alert"><h2>No encontramos este producto</h2><p>{product.error?.message}</p><Link className="button button--dark" to="/">Volver a la tienda</Link></div></div>

  const item = product.data
  const activeVariants = item.variantes.filter((variant) => variant.Activo)
  const selected = activeVariants.find((variant) => variant.IDVariante === selectedVariant) ?? activeVariants[0]
  const image = item.imagenes.find((photo) => photo.EsPrincipal)?.ImagenURL ?? item.imagenes[0]?.ImagenURL ?? item.ImagenPrincipal

  return (
    <section className="page-container product-detail">
      <div className="breadcrumbs"><Link to="/">Tienda</Link><span>/</span><span>{item.Categoria}</span><span>/</span><span>{item.Nombre}</span></div>
      <div className="product-detail__layout">
        <div className="product-detail__photo-wrap">{image ? <img className="product-detail__photo" src={image} alt={item.Nombre} /> : <div className="product-detail__photo product-detail__photo--empty">DA</div>}<span className="photo-caption">UNA PIEZA PARA QUEDARSE</span></div>
        <div className="product-detail__content">
          <p className="eyebrow">{item.Categoria} <span>·</span> ESENCIAL DA</p>
          <h1>{item.Nombre}</h1>
          <p className="product-detail__price">{selected ? formatPrice(selected.Precio) : 'Sin variantes disponibles'}</p>
          <p className="product-detail__description">{item.Descripcion}</p>
          <div className="detail-divider" />
          <div className="variant-heading"><span>Elige tu opción</span><span>{selected?.Color ?? ''}</span></div>
          <div className="variant-list" role="radiogroup" aria-label="Variantes disponibles">
            {activeVariants.map((variant) => <button key={variant.IDVariante} className={`variant-option ${selected?.IDVariante === variant.IDVariante ? 'is-selected' : ''}`} type="button" role="radio" aria-checked={selected?.IDVariante === variant.IDVariante} disabled={variant.ExistenciaDisponible < 1} onClick={() => setSelectedVariant(variant.IDVariante)}><span>{variant.Nombre}</span><small>{variant.ExistenciaDisponible > 0 ? `${variant.ExistenciaDisponible} disponibles` : 'Agotado'}</small></button>)}
          </div>
          {addItem.isError && <p className="form-alert" role="alert">{addItem.error.message}</p>}
          {notice && <p className="form-success" role="status">{notice}</p>}
          <button className="button button--dark button--wide" type="button" disabled={!selected || selected.ExistenciaDisponible < 1 || addItem.isPending} onClick={() => selected && addItem.mutate(selected.IDVariante)}>{addItem.isPending ? 'Agregando…' : 'Agregar a mi bolsa'} <span aria-hidden="true">↗</span></button>
          <p className="product-detail__assurance">Precios en quetzales · IVA incluido · Compra segura</p>
          <div className="detail-service"><div><span>01</span><p>Envío nacional<br /><small>Seguimiento hasta tu puerta</small></p></div><div><span>02</span><p>Atención personal<br /><small>Estamos para ayudarte</small></p></div></div>
        </div>
      </div>
    </section>
  )
}
