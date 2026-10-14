import api from './api'

export const employeeService = {
  async list(params = {}) {
    const { data } = await api.get('/api/v1/employees', { params })
    return data
  },

  async lookup(query) {
    const { data } = await api.get('/api/v1/employees/lookup', { params: { q: query } })
    return data
  },

  async create(payload) {
    const { data } = await api.post('/api/v1/employees', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`/api/v1/employees/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`/api/v1/employees/${id}`)
    return data
  },

  async impersonate(id) {
    const { data } = await api.post(`/api/v1/employees/${id}/impersonate`)
    return data
  },
}
