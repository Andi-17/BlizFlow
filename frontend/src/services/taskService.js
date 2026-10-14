import api from './api'

export const taskService = {
  async list(params = {}) {
    const { data } = await api.get('/api/v1/tasks', { params })
    return data
  },

  async show(id) {
    const { data } = await api.get(`/api/v1/tasks/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await api.post('/api/v1/tasks', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`/api/v1/tasks/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`/api/v1/tasks/${id}`)
    return data
  },
}
