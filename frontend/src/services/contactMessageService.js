import api from './api'

export const contactMessageService = {
  async list(params = {}) {
    const { data } = await api.get('/api/v1/contact-messages', { params })
    return data
  },

  async show(id) {
    const { data } = await api.get(`/api/v1/contact-messages/${id}`)
    return data
  },

  async markRead(id) {
    const { data } = await api.post(`/api/v1/contact-messages/${id}/read`)
    return data
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/api/v1/contact-messages/${id}/status`, { status })
    return data
  },

  async unreadCount() {
    const { data } = await api.get('/api/v1/contact-messages/unread-count')
    return data
  },

  async toCustomer(id) {
    const { data } = await api.post(`/api/v1/contact-messages/${id}/to-customer`)
    return data
  },
}

export function notifyContactsChanged() {
  window.dispatchEvent(new Event('bizflow:contacts-changed'))
}
