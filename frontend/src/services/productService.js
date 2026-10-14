import api from './api'

export const productService = {
  async list(params = {}) {
    const { data } = await api.get('/api/v1/products', { params })
    return data
  },

  async show(id) {
    const { data } = await api.get(`/api/v1/products/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await api.post('/api/v1/products', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`/api/v1/products/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`/api/v1/products/${id}`)
    return data
  },

  async listCategories(params = {}) {
    const { data } = await api.get('/api/v1/categories', { params })
    return data
  },

  async createCategory(payload) {
    const { data } = await api.post('/api/v1/categories', payload)
    return data
  },

  async inventory(params = {}) {
    const { data } = await api.get('/api/v1/inventory', { params })
    return data
  },

  async adjustInventory(productId, payload) {
    const { data } = await api.put(`/api/v1/inventory/${productId}`, payload)
    return data
  },
}
