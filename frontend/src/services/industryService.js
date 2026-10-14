import api from './api'

export const industryService = {
  async list() {
    const { data } = await api.get('/api/v1/industries')
    return data
  },
}
