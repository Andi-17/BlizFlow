import api from './api'

export const projectService = {
  async list(params = {}) {
    const { data } = await api.get('/api/v1/projects', { params })
    return data
  },

  async show(id) {
    const { data } = await api.get(`/api/v1/projects/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await api.post('/api/v1/projects', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`/api/v1/projects/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`/api/v1/projects/${id}`)
    return data
  },
}
