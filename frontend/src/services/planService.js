import api from './api'

export const planService = {
  async list() {
    const { data } = await api.get('/api/v1/plans')
    return data
  },

  async contact(payload) {
    const { data } = await api.post('/api/v1/contact', payload)
    return data
  },
}
