import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('ShopCart storefront', () => {
  it('shows the storefront and products returned by the catalog API', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /los buenos momentos/i })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Camisa Oxford Slim Fit' })).toBeInTheDocument()
    expect(screen.getByText(/249\.00/)).toBeInTheDocument()
  })
})
