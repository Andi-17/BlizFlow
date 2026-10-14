import api from './api'

export const orderService = {
  async list(params = {}) {
    const { data } = await api.get('/api/v1/orders', { params })
    return data
  },

  async show(id) {
    const { data } = await api.get(`/api/v1/orders/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await api.post('/api/v1/orders', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`/api/v1/orders/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`/api/v1/orders/${id}`)
    return data
  },
}
