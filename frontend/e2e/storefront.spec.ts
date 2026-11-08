import { expect, test } from '@playwright/test'
import { categories, emptyCart, filledCart, productCode, productDetail, products } from '../src/test/fixtures'

test('customer can browse a piece, add it to the guest cart and review the bag', async ({ page }) => {
  let cart = emptyCart

  await page.route('http://localhost:3000/api/**', async (route) => {
    const { pathname } = new URL(route.request().url())
    const method = route.request().method()
    const json = (datos: unknown, extra: Record<string, unknown> = {}) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, datos, ...extra }),
    })

    if (pathname.endsWith('/catalogo/categorias')) return json(categories)
    if (pathname.endsWith('/catalogo/productos')) return json(products, { totalRegistros: 1, paginaActual: 1, tamanoPagina: 9, totalPaginas: 1 })
    if (pathname.endsWith(`/catalogo/productos/${productCode}`)) return json(productDetail)
    if (pathname.endsWith('/carrito/items') && method === 'POST') {
      cart = filledCart
      return json(cart, { mensaje: 'Carrito actualizado.' })
    }
    if (pathname.endsWith('/carrito')) return json(cart)
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ ok: false, mensaje: 'Ruta no simulada.' }) })
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /los buenos momentos/i })).toBeVisible()
  await page.getByRole('link', { name: 'Camisa Oxford Slim Fit', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Camisa Oxford Slim Fit' })).toBeVisible()
  await page.getByRole('radio', { name: /azul \/ talla m/i }).click()
  await page.getByRole('button', { name: /agregar a mi bolsa/i }).click()
  await expect(page.getByRole('status')).toContainText('Agregamos esta pieza')
  await page.goto('/carrito')
  await expect(page.getByRole('heading', { name: /tu bolsa/i })).toBeVisible()
  await expect(page.getByText('Camisa Oxford Slim Fit')).toBeVisible()
  await expect(page.getByText(/249\.00/).first()).toBeVisible()
})
