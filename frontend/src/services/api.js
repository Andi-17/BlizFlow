import axios from 'axios'

// Empty baseURL = same origin as Vite (proxy /api + /sanctum). Avoids CSRF/cookie host mismatches.
const API_URL = import.meta.env.VITE_API_URL ?? ''

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function applyXsrfHeader(config = {}) {
  const token = readCookie('XSRF-TOKEN')
  if (token) {
    config.headers = config.headers || {}
    config.headers['X-XSRF-TOKEN'] = token
  }
  return config
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  },
})

let companyId = localStorage.getItem('bizflow_company_id')

export function setCompanyHeader(id) {
  companyId = id ? String(id) : null
  if (companyId) {
    localStorage.setItem('bizflow_company_id', companyId)
    api.defaults.headers.common['X-Company-Id'] = companyId
  } else {
    localStorage.removeItem('bizflow_company_id')
    delete api.defaults.headers.common['X-Company-Id']
  }
}

if (companyId) {
  api.defaults.headers.common['X-Company-Id'] = companyId
}

api.interceptors.request.use((config) => applyXsrfHeader(config))

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const original = error.config
    if (status === 419 && original && !original.__csrfRetried) {
      original.__csrfRetried = true
      await ensureCsrfCookie()
      return api.request(applyXsrfHeader(original))
    }
    return Promise.reject(error)
  },
)

export async function ensureCsrfCookie() {
  await api.get('/sanctum/csrf-cookie')
  applyXsrfHeader(api.defaults)
}

export function getApiUrl() {
  return API_URL || window.location.origin
}

export default api
