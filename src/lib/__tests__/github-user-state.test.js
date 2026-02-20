import { describe, it, expect } from 'vitest'

describe('getUserState / saveUserState', () => {
  it('getUserState is a function on GitHubService', async () => {
    const { GitHubService } = await import('../github.js')
    expect(typeof GitHubService.prototype.getUserState).toBe('function')
  })

  it('saveUserState is a function on GitHubService', async () => {
    const { GitHubService } = await import('../github.js')
    expect(typeof GitHubService.prototype.saveUserState).toBe('function')
  })

  it('has DEFAULT_USER_STATE with version and pins', async () => {
    const { GitHubService } = await import('../github.js')
    expect(GitHubService.DEFAULT_USER_STATE).toEqual({ version: 1, pins: [] })
  })
})
