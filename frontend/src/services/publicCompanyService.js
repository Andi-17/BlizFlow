import api from './api'

export const publicCompanyService = {
  async show(slug) {
    const { data } = await api.get(`/api/v1/public/companies/${encodeURIComponent(slug)}`)
    return data
  },

  async contact(slug, payload) {
    const { data } = await api.post(
      `/api/v1/public/companies/${encodeURIComponent(slug)}/contact`,
      payload,
    )
    return data
  },
}
