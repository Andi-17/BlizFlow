import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import { projectService } from '../../services/projectService'
import { usePagination } from '../../hooks/usePagination'
import { useAlert } from '../../hooks/useAlert'
import { useIndustry } from '../../hooks/useIndustry'
import { firstValidationError, formatDate, getErrorMessage, getValidationErrors, unwrapList } from '../../utils/formatters'

const emptyForm = {
  name: '',
  description: '',
  status: 'active',
  start_date: '',
  due_date: '',
}

export default function Projects() {
  const { label } = useIndustry()
  const { success, error: showError } = useAlert()
  const { page, setPage, meta, setMeta, params } = usePagination()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await projectService.list(params)
      const { items, meta: nextMeta } = unwrapList(response.data)
      setRows(items)
      setMeta(nextMeta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      name: row.name || '',
      description: row.description || '',
      status: row.status || 'active',
      start_date: row.start_date ? String(row.start_date).slice(0, 10) : '',
      due_date: row.due_date ? String(row.due_date).slice(0, 10) : '',
    })
    setErrors({})
    setShowForm(true)
  }

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    const payload = {
      ...form,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
    }
    try {
      if (editing) {
        await projectService.update(editing.id, payload)
        success('Project updated')
      } else {
        await projectService.create(payload)
        success('Project created')
      }
      setShowForm(false)
      load()
    } catch (err) {
      setErrors(getValidationErrors(err))
      showError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await projectService.remove(deleteTarget.id)
      success('Project deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Project', render: (row) => <strong>{row.name}</strong> },
    { key: 'status', label: 'Status', render: (row) => <span className="badge badge-soft text-capitalize">{row.status}</span> },
    { key: 'tasks_count', label: 'Tasks', render: (row) => row.tasks_count ?? '—' },
    { key: 'start_date', label: 'Start', render: (row) => formatDate(row.start_date) },
    { key: 'due_date', label: 'Due', render: (row) => formatDate(row.due_date) },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) => (
        <div className="btn-group btn-group-sm">
          <button type="button" className="btn btn-outline-brand" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={() => setDeleteTarget(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{label('projects')}</h1>
          <p className="text-secondary mb-0">Organize delivery work</p>
        </div>
        <button type="button" className="btn btn-brand" onClick={openCreate}>
          New project
        </button>
      </div>
      {error ? <Alert type="danger" message={error} /> : null}
      <div className="panel">
        <DataTable columns={columns} rows={rows} loading={loading} />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal
        show={showForm}
        title={editing ? 'Edit project' : 'New project'}
        onClose={() => setShowForm(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline-brand" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" form="project-form" className="btn btn-brand" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="project-form" onSubmit={onSubmit}>
          <FormField label="Name" name="name" value={form.name} onChange={onChange} required error={firstValidationError(errors, 'name')} />
          <FormField label="Description" name="description" as="textarea" rows={3} value={form.description} onChange={onChange} error={firstValidationError(errors, 'description')} />
          <FormField label="Status" name="status" value={form.status} onChange={onChange} error={firstValidationError(errors, 'status')} />
          <div className="row">
            <div className="col-md-6">
              <FormField label="Start date" name="start_date" type="date" value={form.start_date} onChange={onChange} error={firstValidationError(errors, 'start_date')} />
            </div>
            <div className="col-md-6">
              <FormField label="Due date" name="due_date" type="date" value={form.due_date} onChange={onChange} error={firstValidationError(errors, 'due_date')} />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        show={Boolean(deleteTarget)}
        title="Delete project"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-brand" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" disabled={deleting} onClick={confirmDelete}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="mb-0">
          Delete <strong>{deleteTarget?.name}</strong>?
        </p>
      </Modal>
    </>
  )
}
