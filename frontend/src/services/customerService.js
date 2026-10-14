import api from './api'

export const customerService = {
  async list(params = {}) {
    const { data } = await api.get('/api/v1/customers', { params })
    return data
  },

  async show(id) {
    const { data } = await api.get(`/api/v1/customers/${id}`)
    return data
  },

  async timeline(id) {
    const { data } = await api.get(`/api/v1/customers/${id}/timeline`)
    return data
  },

  async create(payload) {
    const { data } = await api.post('/api/v1/customers', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`/api/v1/customers/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`/api/v1/customers/${id}`)
    return data
  },
}
