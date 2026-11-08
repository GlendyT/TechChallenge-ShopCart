import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import App from './App'
import { categories, products } from './test/fixtures'
import { server } from './test/server'

describe('ShopCart storefront', () => {
  it('shows the storefront and products returned by the catalog API', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Explora nuestras categorías' })).toBeInTheDocument()
    const categoryCarousel = await screen.findByRole('region', { name: 'Categorías de productos' })
    expect(within(categoryCarousel).getByText('Prendas y moda para hombres.')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Caballeros' })).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Productos de Caballeros' })).toBeInTheDocument()
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('region', { name: 'Beneficios de comprar en Don Arturo' })).toBeInTheDocument()
    expect(within(footer).getByText('Envío nacional')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Camisa Oxford Slim Fit' })).toBeInTheDocument()
    expect(screen.getByText(/249\.00/)).toBeInTheDocument()
  })

  it('requests products only for the first five visible categories', async () => {
    const requestedCategories: string[] = []
    const categoryRows = Array.from({ length: 6 }, (_, index) => ({
      IDCategoria: index + 1,
      Nombre: `Categoría ${index + 1}`,
      Descripcion: `Descripción ${index + 1}`,
      TotalProductos: 1,
    }))
    server.use(
      http.get('http://localhost:3000/api/catalogo/categorias', () =>
        HttpResponse.json({ ok: true, datos: categoryRows }),
      ),
      http.get('http://localhost:3000/api/catalogo/productos', ({ request }) => {
        const id = new URL(request.url).searchParams.get('idCategoria')
        if (id) requestedCategories.push(id)
        return HttpResponse.json({ ok: true, datos: [], totalRegistros: 0, paginaActual: 1, tamanoPagina: 9, totalPaginas: 1 })
      }),
    )
    render(<App />)

    expect(await screen.findByRole('region', { name: 'Productos de Categoría 5' })).toBeInTheDocument()
    await waitFor(() => expect(requestedCategories).toHaveLength(5))
    expect(requestedCategories.sort()).toEqual(['1', '2', '3', '4', '5'])
    expect(requestedCategories).not.toContain('6')
  })

  it('filters the product list when a category is selected from the carousel', async () => {
    const user = userEvent.setup()
    const catalogQueries: URL[] = []
    server.use(http.get('http://localhost:3000/api/catalogo/productos', ({ request }) => {
      catalogQueries.push(new URL(request.url))
      return HttpResponse.json({ ok: true, datos: products, totalRegistros: products.length, paginaActual: 1, tamanoPagina: 9, totalPaginas: 1 })
    }))
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Explorar categoría Caballeros' }))

    await waitFor(() => {
      expect(catalogQueries.some((query) => query.searchParams.get('idCategoria') === '1')).toBe(true)
    })
    expect(screen.getByRole('button', { name: 'Explorar categoría Caballeros' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps the small category card outside the main category slider', async () => {
    server.use(http.get('http://localhost:3000/api/catalogo/categorias', () => HttpResponse.json({
      ok: true,
      datos: [
        ...categories,
        { IDCategoria: 2, Nombre: 'Damas', Descripcion: 'Moda para mujeres.', TotalProductos: 2 },
        { IDCategoria: 3, Nombre: 'Calzado', Descripcion: 'Calzado para cada ocasión.', TotalProductos: 3 },
      ],
    })))
    render(<App />)

    const mainSlider = await screen.findByRole('region', { name: 'Categorías de productos' })
    const featuredCard = await screen.findByRole('complementary', { name: 'Categoría destacada' })

    expect(within(mainSlider).getByRole('button', { name: 'Explorar categoría Caballeros' })).toBeInTheDocument()
    expect(within(mainSlider).getByRole('button', { name: 'Explorar categoría Calzado' })).toBeInTheDocument()
    expect(within(mainSlider).queryByRole('button', { name: 'Explorar categoría Damas' })).not.toBeInTheDocument()
    expect(within(featuredCard).getByRole('button', { name: 'Explorar categoría Damas' })).toBeInTheDocument()
    expect(within(mainSlider).getByRole('button', { name: 'Categorías siguientes' })).toBeInTheDocument()
    expect(within(featuredCard).queryByRole('button', { name: 'Categorías siguientes' })).not.toBeInTheDocument()
  })

  it('uses the header category menu and centered search to filter the catalog', async () => {
    const user = userEvent.setup()
    const catalogQueries: URL[] = []
    server.use(http.get('http://localhost:3000/api/catalogo/productos', ({ request }) => {
      catalogQueries.push(new URL(request.url))
      return HttpResponse.json({ ok: true, datos: products, totalRegistros: products.length, paginaActual: 1, tamanoPagina: 9, totalPaginas: 1 })
    }))
    render(<App />)

    expect(screen.getByRole('banner')).toHaveClass('bg-dn-azul')
    expect(screen.getByRole('link', { name: /don arturo, ir al inicio/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /carrito de compra/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ingresar' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver categorías' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Caballeros' }))
    expect(await screen.findByRole('link', { name: 'Camisa Oxford Slim Fit' })).toBeInTheDocument()
    await waitFor(() => expect(catalogQueries.some((query) => query.searchParams.get('idCategoria') === '1')).toBe(true))

    const search = screen.getByRole('textbox', { name: 'Buscar productos' })
    await user.type(search, 'Oxford')
    const suggestions = await screen.findByRole('region', { name: 'Sugerencias de productos' })
    expect(within(suggestions).getByText('1 producto encontrado')).toBeInTheDocument()
    expect(within(suggestions).getByRole('link', { name: 'Ver Camisa Oxford Slim Fit' })).toBeInTheDocument()
    expect(catalogQueries.some((query) => query.searchParams.get('busqueda') === 'Oxford' && query.searchParams.get('idCategoria') === '1')).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByRole('link', { name: 'Camisa Oxford Slim Fit' })).toBeInTheDocument()
    await waitFor(() => expect(catalogQueries.some((query) => query.searchParams.get('busqueda') === 'Oxford' && query.searchParams.get('idCategoria') === '1')).toBe(true))
  })

  it('shows an empty state in search suggestions without replacing the catalog', async () => {
    const user = userEvent.setup()
    server.use(http.get('http://localhost:3000/api/catalogo/productos', ({ request }) => {
      const search = new URL(request.url).searchParams.get('busqueda')
      const resultRows = search ? [] : products
      return HttpResponse.json({ ok: true, datos: resultRows, totalRegistros: resultRows.length, paginaActual: 1, tamanoPagina: 9, totalPaginas: 1 })
    }))
    render(<App />)

    await user.type(screen.getByRole('textbox', { name: 'Buscar productos' }), 'xyz-no-existe')

    const suggestions = await screen.findByRole('region', { name: 'Sugerencias de productos' })
    expect(within(suggestions).getByText('No encontramos productos para “xyz-no-existe”.')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Camisa Oxford Slim Fit' })).toBeInTheDocument()
  })
})
