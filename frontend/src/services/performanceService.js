import api from './api'

export const performanceService = {
  async mine(params = {}) {
    const { data } = await api.get('/api/v1/performance/me', { params })
    return data
  },
  async team(params = {}) {
    const { data } = await api.get('/api/v1/performance/team', { params })
    return data
  },
}

export const roleService = {
  async list() {
    const { data } = await api.get('/api/v1/roles')
    return data
  },
}
