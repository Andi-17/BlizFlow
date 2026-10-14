import api from './api'

export const reportService = {
  async sales(params = {}) {
    const { data } = await api.get('/api/v1/reports/sales', { params })
    return data
  },

  async inventory() {
    const { data } = await api.get('/api/v1/reports/inventory')
    return data
  },

  async dashboardStats() {
    const { data } = await api.get('/api/v1/dashboard/stats')
    return data
  },

  async smartSearch(q) {
    const { data } = await api.get('/api/v1/dashboard/search', { params: { q } })
    return data
  },
}
