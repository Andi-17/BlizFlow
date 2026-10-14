import api, { ensureCsrfCookie } from './api'

export const authService = {
  async register(payload) {
    await ensureCsrfCookie()
    const { data } = await api.post('/api/v1/auth/register', payload)
    return data
  },

  async confirmRegistration(payload) {
    await ensureCsrfCookie()
    const { data } = await api.post('/api/v1/auth/register/confirm', payload)
    return data
  },

  async deleteAccount(payload) {
    const { data } = await api.delete('/api/v1/auth/account', { data: payload })
    return data
  },

  async login(payload) {
    await ensureCsrfCookie()
    const { data } = await api.post('/api/v1/auth/login', payload)
    return data
  },

  async confirmLogin(payload) {
    await ensureCsrfCookie()
    const { data } = await api.post('/api/v1/auth/login/confirm', payload)
    return data
  },

  async logout() {
    const { data } = await api.post('/api/v1/auth/logout')
    return data
  },

  async stopImpersonating() {
    const { data } = await api.post('/api/v1/auth/stop-impersonating')
    return data
  },

  async me() {
    const { data } = await api.get('/api/v1/auth/me')
    return data
  },

  async forgotPassword(payload) {
    await ensureCsrfCookie()
    const { data } = await api.post('/api/v1/auth/forgot-password', payload)
    return data
  },

  async resetPassword(payload) {
    await ensureCsrfCookie()
    const { data } = await api.post('/api/v1/auth/reset-password', payload)
    return data
  },

  async sendVerificationEmail() {
    const { data } = await api.post('/api/v1/auth/email/verification-notification')
    return data
  },
}
