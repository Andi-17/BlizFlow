import api from './api'

export const companyService = {
  async list(params = {}) {
    const { data } = await api.get('/api/v1/companies', { params })
    return data
  },

  async current() {
    const { data } = await api.get('/api/v1/company')
    return data
  },

  async show(id) {
    const { data } = await api.get(`/api/v1/companies/${id}`)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`/api/v1/companies/${id}`, payload)
    return data
  },

  async uploadLogo(id, file) {
    const body = new FormData()
    body.append('logo', file)
    const { data } = await api.post(`/api/v1/companies/${id}/logo`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async removeLogo(id) {
    const { data } = await api.delete(`/api/v1/companies/${id}/logo`)
    return data
  },

  async destroy(id, payload) {
    const { data } = await api.delete(`/api/v1/companies/${id}`, { data: payload })
    return data
  },

  async limits() {
    const { data } = await api.get('/api/v1/onboarding/limits')
    return data
  },

  async requestCode(payload) {
    const { data } = await api.post('/api/v1/onboarding/company/request-code', payload)
    return data
  },

  async confirm(payload) {
    const { data } = await api.post('/api/v1/onboarding/company/confirm', payload)
    return data
  },

  async onboard(payload) {
    const { data } = await api.post('/api/v1/onboarding/company/confirm', payload)
    return data
  },
}
