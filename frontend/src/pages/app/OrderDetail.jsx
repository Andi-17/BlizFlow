import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'
import { orderService } from '../../services/orderService'
import { invoiceService } from '../../services/invoiceService'
import { useAlert } from '../../hooks/useAlert'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/formatters'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error: showError } = useAlert()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creatingInvoice, setCreatingInvoice] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await orderService.show(id)
        if (active) setOrder(response.data)
      } catch (err) {
        if (active) setError(getErrorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  const createInvoice = async () => {
    setCreatingInvoice(true)
    try {
      const response = await invoiceService.fromOrder(id)
      success(response.message || 'Invoice created')
      navigate(`/app/invoices/${response.data?.id}`)
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setCreatingInvoice(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <Alert type="danger" message={error} />
  if (!order) return null

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Order {order.order_number}</h1>
          <p className="text-secondary mb-0 text-capitalize">
            {order.status} · {formatDate(order.ordered_at || order.created_at)}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/app/orders" className="btn btn-outline-brand">
            Back
          </Link>
          <button type="button" className="btn btn-brand" disabled={creatingInvoice} onClick={createInvoice}>
            {creatingInvoice ? 'Creating…' : 'Create invoice'}
          </button>
        </div>
      </div>
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="panel h-100">
            <h2 className="h6 text-secondary">Customer</h2>
            <p className="mb-1 fw-semibold">{order.customer?.name || `Customer #${order.customer_id}`}</p>
            <p className="mb-0 text-secondary small">{order.customer?.email || '—'}</p>
            {order.notes ? <p className="mt-3 mb-0 small">{order.notes}</p> : null}
          </div>
        </div>
        <div className="col-lg-8">
          <div className="panel">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th className="text-end">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.name || item.description || 'Item'}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td className="text-end">{formatCurrency(item.total ?? item.quantity * item.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex flex-column align-items-end gap-1">
              <div>Subtotal: <strong>{formatCurrency(order.subtotal)}</strong></div>
              <div>Discount: <strong>{formatCurrency(order.discount)}</strong></div>
              <div>Tax: <strong>{formatCurrency(order.tax)}</strong></div>
              <div className="fs-5">Total: <strong>{formatCurrency(order.total)}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
