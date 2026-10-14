import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../../components/Alert'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import SearchFilter from '../../components/SearchFilter'
import { useAlert } from '../../hooks/useAlert'
import { useLocale } from '../../hooks/useLocale'
import { usePagination } from '../../hooks/usePagination'
import { usePermissions } from '../../hooks/usePermissions'
import {
  contactMessageService,
  notifyContactsChanged,
} from '../../services/contactMessageService'
import { downloadCsv } from '../../utils/businessExtras'
import { formatDate, getErrorMessage, unwrapList } from '../../utils/formatters'

const STATUS_OPTIONS = ['new', 'contacted', 'quoted', 'won', 'lost']

export default function ContactMessages() {
  const navigate = useNavigate()
  const { t } = useLocale()
  const { canManageCustomers } = usePermissions()
  const { success, error: showError } = useAlert()
  const { page, setPage, search, applySearch, meta, setMeta, params } = usePagination()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [marking, setMarking] = useState(false)
  const [converting, setConverting] = useState(false)

  const statusLabel = (status) => t(`app.leadStatus.${status}`) || status

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = { ...params }
      if (statusFilter === 'unread') query.is_read = 0
      else if (STATUS_OPTIONS.includes(statusFilter)) query.status = statusFilter
      const response = await contactMessageService.list(query)
      const { items, meta: nextMeta } = unwrapList(response.data)
      setRows(items)
      setMeta(nextMeta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const openMessage = async (row) => {
    setSelected(row)
    if (row.is_read && row.status !== 'new') return
    try {
      await contactMessageService.markRead(row.id)
      notifyContactsChanged()
      setSelected((current) =>
        current
          ? {
              ...current,
              is_read: true,
              status: current.status === 'new' ? 'contacted' : current.status,
            }
          : current,
      )
      setRows((current) =>
        current.map((item) =>
          item.id === row.id
            ? {
                ...item,
                is_read: true,
                status: item.status === 'new' ? 'contacted' : item.status,
              }
            : item,
        ),
      )
    } catch {
      // Keep message open even if mark-read fails.
    }
  }

  const markRead = async (row) => {
    if (!row?.id) return
    setMarking(true)
    try {
      const response = await contactMessageService.markRead(row.id)
      notifyContactsChanged()
      success(t('app.contactMarkedRead'))
      const updated = response?.data || { ...row, is_read: true }
      setSelected((current) => (current?.id === row.id ? { ...current, ...updated } : current))
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, ...updated } : item)))
    } catch (err) {
      showError(getErrorMessage(err, t('app.contactMarkRead')))
    } finally {
      setMarking(false)
    }
  }

  const changeStatus = async (row, status) => {
    try {
      const response = await contactMessageService.updateStatus(row.id, status)
      notifyContactsChanged()
      success(t('app.leadStatusUpdated'))
      const updated = response?.data || { ...row, status }
      setSelected((current) => (current?.id === row.id ? { ...current, ...updated } : current))
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, ...updated } : item)))
    } catch (err) {
      showError(getErrorMessage(err))
    }
  }

  const convertToCustomer = async (row) => {
    if (!row?.id) return
    setConverting(true)
    try {
      const response = await contactMessageService.toCustomer(row.id)
      notifyContactsChanged()
      success(t('app.contactConverted'))
      const customerId = response?.data?.id ?? response?.data?.data?.id
      setSelected(null)
      if (customerId) {
        navigate(`/app/customers/${customerId}`)
        return
      }
      load()
    } catch (err) {
      showError(getErrorMessage(err, t('app.contactToCustomer')))
    } finally {
      setConverting(false)
    }
  }

  const replyByEmail = (row) => {
    if (!row?.email) return
    window.location.href = `mailto:${row.email}?subject=${encodeURIComponent(row.subject || '')}`
  }

  const exportCsv = () => {
    downloadCsv(
      `contacts-${new Date().toISOString().slice(0, 10)}.csv`,
      rows,
      [
        { label: 'Name', value: (row) => row.name },
        { label: 'Email', value: (row) => row.email },
        { label: 'Subject', value: (row) => row.subject || '' },
        { label: 'Status', value: (row) => row.status || '' },
        { label: 'Message', value: (row) => row.message },
        { label: 'Received', value: (row) => row.created_at || '' },
      ],
    )
  }

  const columns = [
    {
      key: 'name',
      label: t('app.contactFrom'),
      render: (row) => (
        <div>
          <strong>{row.name}</strong>
          {!row.is_read || row.status === 'new' ? (
            <span className="badge badge-amber ms-2">{t('app.contactNew')}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'email',
      label: t('app.contactEmail'),
      render: (row) => (
        <a href={`mailto:${row.email}`} onClick={(event) => event.stopPropagation()}>
          {row.email}
        </a>
      ),
    },
    {
      key: 'status',
      label: t('app.leadStatusLabel'),
      render: (row) => (
        <select
          className="form-select form-select-sm"
          value={row.status || 'new'}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => changeStatus(row, event.target.value)}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'subject',
      label: t('app.contactSubject'),
      render: (row) => row.subject || '—',
    },
    {
      key: 'created_at',
      label: t('app.contactReceived'),
      render: (row) => formatDate(row.created_at),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) => (
        <button type="button" className="btn btn-sm btn-outline-brand" onClick={() => openMessage(row)}>
          {t('app.contactView')}
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('app.contactHistory')}</h1>
          <p className="text-secondary mb-0">{t('app.contactHistoryLede')}</p>
        </div>
        <button type="button" className="btn btn-outline-brand" onClick={exportCsv} disabled={!rows.length}>
          {t('app.exportCsv')}
        </button>
      </div>

      {error ? <Alert type="danger" message={error} /> : null}

      <div className="panel">
        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <div className="flex-grow-1">
            <SearchFilter
              value={search}
              onSearch={applySearch}
              placeholder={t('app.contactSearch')}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 180 }}
            value={statusFilter}
            onChange={(event) => {
              setPage(1)
              setStatusFilter(event.target.value)
            }}
          >
            <option value="all">{t('app.contactFilterAll')}</option>
            <option value="unread">{t('app.contactFilterNew')}</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <DataTable columns={columns} rows={rows} loading={loading} onRowClick={openMessage} />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal
        show={Boolean(selected)}
        title={selected?.subject || t('app.contactMessage')}
        onClose={() => setSelected(null)}
        footer={
          <>
            {selected ? (
              <button
                type="button"
                className="btn btn-outline-brand"
                disabled={converting || !canManageCustomers}
                onClick={() => convertToCustomer(selected)}
              >
                {converting ? t('common.sending') : t('app.contactToCustomer')}
              </button>
            ) : null}
            {selected && (!selected.is_read || selected.status === 'new') ? (
              <button
                type="button"
                className="btn btn-outline-brand"
                disabled={marking}
                onClick={() => markRead(selected)}
              >
                {t('app.contactMarkRead')}
              </button>
            ) : null}
            {selected?.email ? (
              <button type="button" className="btn btn-brand" onClick={() => replyByEmail(selected)}>
                {t('app.contactReply')}
              </button>
            ) : null}
            <button type="button" className="btn btn-outline-brand" onClick={() => setSelected(null)}>
              {t('common.close')}
            </button>
          </>
        }
      >
        {selected ? (
          <div className="contact-message-detail">
            <p className="mb-2">
              <strong>{t('app.contactFrom')}:</strong> {selected.name}
            </p>
            <p className="mb-2">
              <strong>{t('app.contactEmail')}:</strong>{' '}
              <a href={`mailto:${selected.email}`}>{selected.email}</a>
            </p>
            <p className="mb-2">
              <strong>{t('app.leadStatusLabel')}:</strong> {statusLabel(selected.status || 'new')}
            </p>
            <label className="form-label" htmlFor="lead-status">
              {t('app.leadStatusChange')}
            </label>
            <select
              id="lead-status"
              className="form-select mb-3"
              value={selected.status || 'new'}
              onChange={(event) => changeStatus(selected, event.target.value)}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
            <p className="mb-2 text-secondary">
              {t('app.contactReceived')}: {formatDate(selected.created_at)}
            </p>
            <hr />
            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
              {selected.message}
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
