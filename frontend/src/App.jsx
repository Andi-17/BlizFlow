import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CompanyProvider } from './contexts/CompanyContext'
import { AlertProvider } from './contexts/AlertContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LocaleProvider } from './contexts/LocaleContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <LocaleProvider>
        <ThemeProvider>
          <AlertProvider>
            <AuthProvider>
              <CompanyProvider>
                <AppRoutes />
              </CompanyProvider>
            </AuthProvider>
          </AlertProvider>
        </ThemeProvider>
      </LocaleProvider>
    </BrowserRouter>
  )
}
