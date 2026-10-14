import api from './api'

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const invoiceService = {
  async list(params = {}) {
    const { data } = await api.get('/api/v1/invoices', { params })
    return data
  },

  async show(id) {
    const { data } = await api.get(`/api/v1/invoices/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await api.post('/api/v1/invoices', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`/api/v1/invoices/${id}`, payload)
    return data
  },

  async remove(id) {
    const { data } = await api.delete(`/api/v1/invoices/${id}`)
    return data
  },

  async fromOrder(orderId) {
    const { data } = await api.post(`/api/v1/invoices/from-order/${orderId}`)
    return data
  },

  async markPaid(id) {
    const { data } = await api.post(`/api/v1/invoices/${id}/mark-paid`)
    return data
  },

  async downloadPdf(id, filename = null) {
    try {
      const response = await api.get(`/api/v1/invoices/${id}/pdf`, {
        responseType: 'blob',
      })
      const disposition = response.headers['content-disposition'] || ''
      const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i)
      const resolvedName = filename
        || (match ? decodeURIComponent(match[1].replace(/"/g, '')) : `invoice-${id}.pdf`)
      triggerBlobDownload(response.data, resolvedName)
      return true
    } catch (error) {
      const blob = error.response?.data
      if (blob instanceof Blob) {
        const text = await blob.text()
        try {
          const parsed = JSON.parse(text)
          const message = parsed.message || parsed.error || 'PDF download failed'
          throw Object.assign(new Error(message), {
            response: { data: parsed, status: error.response?.status },
          })
        } catch (parseError) {
          if (parseError instanceof SyntaxError) {
            throw error
          }
          throw parseError
        }
      }
      throw error
    }
  },
}
