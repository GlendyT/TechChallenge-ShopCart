import { Link } from 'react-router-dom'
import type { Product } from '../catalog/types'
import { formatPrice } from '../lib/format'

export function ProductCard({ product }: { product: Product }) {
  const price = product.PrecioMinimo ?? product.PrecioMaximo

  return (
    <article className="product-card">
      <Link className="product-card__image-link" to={`/producto/${product.CodigoPublico}`} aria-label={`Ver ${product.Nombre}`}>
        {product.ImagenPrincipal ? (
          <img className="product-card__image" src={product.ImagenPrincipal} alt={product.Nombre} loading="lazy" />
        ) : (
          <div className="product-card__image product-card__image--empty" aria-hidden="true">
            <span>{product.Nombre.slice(0, 1)}</span>
          </div>
        )}
        <span className="product-card__quick-view">Descubrir pieza <span aria-hidden="true">↗</span></span>
      </Link>
      <div className="product-card__details">
        <div className="product-card__meta">
          <span>{product.Categoria}</span>
          <span>{product.TotalStockDisponible > 0 ? 'Disponible' : 'Agotado'}</span>
        </div>
        <Link className="product-card__title" to={`/producto/${product.CodigoPublico}`}>{product.Nombre}</Link>
        <div className="product-card__bottom">
          <strong>{price === null || price === undefined ? 'Consultar' : formatPrice(price)}</strong>
          <span className="product-card__sizes">{product.TotalVariantes} {product.TotalVariantes === 1 ? 'variante' : 'variantes'}</span>
        </div>
      </div>
    </article>
  )
}
