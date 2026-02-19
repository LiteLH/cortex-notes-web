import { describe, it, expect } from 'vitest'

// Test the concept — actual rendering tested via build + visual
describe('markdown rendering strategy', () => {
  it('react-markdown is importable', async () => {
    const mod = await import('react-markdown')
    expect(mod.default).toBeDefined()
  })

  it('remark-gfm is importable', async () => {
    const mod = await import('remark-gfm')
    expect(mod.default).toBeDefined()
  })

  it('rehype-sanitize is importable', async () => {
    const mod = await import('rehype-sanitize')
    expect(mod.default).toBeDefined()
  })

  it('rehype-highlight is importable', async () => {
    const mod = await import('rehype-highlight')
    expect(mod.default).toBeDefined()
  })
})
