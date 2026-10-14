import api from './api'

export const adminService = {
  async stats() {
    const { data } = await api.get('/api/v1/admin/stats')
    return data
  },

  async users(params = {}) {
    const { data } = await api.get('/api/v1/admin/users', { params })
    return data
  },

  async updateUser(id, payload) {
    const { data } = await api.put(`/api/v1/admin/users/${id}`, payload)
    return data
  },

  async companies(params = {}) {
    const { data } = await api.get('/api/v1/admin/companies', { params })
    return data
  },

  async showCompany(id) {
    const { data } = await api.get(`/api/v1/admin/companies/${id}`)
    return data
  },

  async updateCompany(id, payload) {
    const { data } = await api.put(`/api/v1/admin/companies/${id}`, payload)
    return data
  },

  async plans(params = {}) {
    const { data } = await api.get('/api/v1/admin/plans', { params })
    return data
  },

  async createPlan(payload) {
    const { data } = await api.post('/api/v1/admin/plans', payload)
    return data
  },

  async updatePlan(id, payload) {
    const { data } = await api.put(`/api/v1/admin/plans/${id}`, payload)
    return data
  },

  async contactMessages(params = {}) {
    const { data } = await api.get('/api/v1/admin/contact-messages', { params })
    return data
  },

  async markMessageRead(id) {
    const { data } = await api.post(`/api/v1/admin/contact-messages/${id}/read`)
    return data
  },

  async subscriptions(params = {}) {
    const { data } = await api.get('/api/v1/admin/subscriptions', { params })
    return data
  },

  async payments(params = {}) {
    const { data } = await api.get('/api/v1/admin/payments', { params })
    return data
  },

  async billingInvoices(params = {}) {
    const { data } = await api.get('/api/v1/admin/billing-invoices', { params })
    return data
  },

  async activityLogs(params = {}) {
    const { data } = await api.get('/api/v1/admin/activity-logs', { params })
    return data
  },
}
