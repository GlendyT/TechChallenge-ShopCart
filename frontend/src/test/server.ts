import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { categories, emptyCart, products, productDetail } from './fixtures'

const api = 'http://localhost:3000/api'

export const server = setupServer(
  http.get(`${api}/catalogo/categorias`, () => HttpResponse.json({ ok: true, datos: categories })),
  http.get(`${api}/catalogo/productos`, () => HttpResponse.json({
    ok: true,
    datos: products,
    totalRegistros: products.length,
    paginaActual: 1,
    tamanoPagina: 9,
    totalPaginas: 1,
  })),
  http.get(`${api}/catalogo/productos/:codigo`, () => HttpResponse.json({ ok: true, datos: productDetail })),
  http.get(`${api}/carrito`, () => HttpResponse.json({ ok: true, datos: emptyCart })),
)
