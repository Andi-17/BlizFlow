import api from './api'

export const billingService = {
  async subscription() {
    const { data } = await api.get('/api/v1/billing/subscription')
    return data
  },

  async invoices(params = {}) {
    const { data } = await api.get('/api/v1/billing/invoices', { params })
    return data
  },

  async checkout(payload) {
    const { data } = await api.post('/api/v1/billing/checkout', payload)
    return data
  },

  async confirm(payload) {
    const { data } = await api.post('/api/v1/billing/confirm', payload)
    return data
  },

  async cancel(payload = { at_period_end: true }) {
    const { data } = await api.post('/api/v1/billing/cancel', payload)
    return data
  },

  async resume() {
    const { data } = await api.post('/api/v1/billing/resume')
    return data
  },

  async changePlan(payload) {
    const { data } = await api.post('/api/v1/billing/change-plan', payload)
    return data
  },

  async portal(payload) {
    const { data } = await api.post('/api/v1/billing/portal', payload)
    return data
  },
}
