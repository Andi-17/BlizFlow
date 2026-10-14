import { useCallback, useEffect, useMemo, useState } from 'react'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import { taskService } from '../../services/taskService'
import { projectService } from '../../services/projectService'
import { employeeService } from '../../services/employeeService'
import { usePagination } from '../../hooks/usePagination'
import { useAlert } from '../../hooks/useAlert'
import { useIndustry } from '../../hooks/useIndustry'
import { usePermissions } from '../../hooks/usePermissions'
import { firstValidationError, formatDate, getErrorMessage, getValidationErrors, unwrapList } from '../../utils/formatters'

const emptyForm = {
  title: '',
  description: '',
  project_id: '',
  assigned_to: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
}

export default function Tasks() {
  const { label } = useIndustry()
  const { isWorker, isAdmin, canManageEmployees, canViewTeamPerformance } = usePermissions()
  const canAssignWorkers = isAdmin || canManageEmployees || canViewTeamPerformance
  const { success, error: showError } = useAlert()
  const { page, setPage, meta, setMeta, params } = usePagination()
  const [rows, setRows] = useState([])
  const [projects, setProjects] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [employeesError, setEmployeesError] = useState(null)

  const assigneeOptions = useMemo(() => {
    return employees
      .filter((employee) => employee.user_id && employee.status !== 'inactive')
      .map((employee) => {
        const name = employee.name || employee.user?.name || employee.email || employee.user?.email || `User #${employee.user_id}`
        const roleName = employee.role?.name ? ` · ${employee.role.name}` : ''
        return {
          value: String(employee.user_id),
          label: `${name}${roleName}`,
        }
      })
  }, [employees])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await taskService.list({
        ...params,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(assigneeFilter ? { assigned_to: assigneeFilter } : {}),
      })
      const { items, meta: nextMeta } = unwrapList(response.data)
      setRows(items)
      setMeta(nextMeta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, assigneeFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    ;(async () => {
      try {
        const projectRes = await projectService.list({ per_page: 100 })
        setProjects(unwrapList(projectRes.data).items)
      } catch {
        // optional
      }

      if (!canAssignWorkers) return

      try {
        const employeeRes = await employeeService.list({ per_page: 100 })
        setEmployees(unwrapList(employeeRes.data).items)
        setEmployeesError(null)
      } catch (err) {
        setEmployees([])
        setEmployeesError(getErrorMessage(err, 'Could not load workers for assignment'))
      }
    })()
  }, [canAssignWorkers])

  const openCreate = (prefillUserId = '') => {
    setEditing(null)
    setForm({ ...emptyForm, assigned_to: prefillUserId ? String(prefillUserId) : '' })
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      title: row.title || '',
      description: row.description || '',
      project_id: row.project_id || '',
      assigned_to: row.assigned_to ? String(row.assigned_to) : '',
      status: row.status || 'todo',
      priority: row.priority || 'medium',
      due_date: row.due_date ? String(row.due_date).slice(0, 10) : '',
    })
    setErrors({})
    setShowForm(true)
  }

  const openReassign = (row) => {
    setEditing(row)
    setForm({
      title: row.title || '',
      description: row.description || '',
      project_id: row.project_id || '',
      assigned_to: row.assigned_to ? String(row.assigned_to) : '',
      status: row.status || 'todo',
      priority: row.priority || 'medium',
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
    if (canAssignWorkers && !form.assigned_to) {
      setErrors({ assigned_to: ['Pick a specific worker for this job.'] })
      return
    }
    setSubmitting(true)
    setErrors({})
    const payload = {
      title: form.title,
      description: form.description || null,
      project_id: form.project_id ? Number(form.project_id) : null,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
    }
    try {
      if (editing) {
        await taskService.update(editing.id, payload)
        success('Task updated and assigned')
      } else {
        await taskService.create(payload)
        success('Job assigned to worker')
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
      await taskService.remove(deleteTarget.id)
      success('Task deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'title', label: 'Job / Task', render: (row) => <strong>{row.title}</strong> },
    { key: 'project', label: 'Project', render: (row) => row.project?.name || '—' },
    {
      key: 'assignee',
      label: 'Worker',
      render: (row) =>
        row.assignee?.name ? (
          <span className="badge badge-soft">{row.assignee.name}</span>
        ) : (
          <span className="text-secondary">Unassigned</span>
        ),
    },
    { key: 'status', label: 'Status', render: (row) => <span className="badge badge-soft text-capitalize">{row.status}</span> },
    { key: 'priority', label: 'Priority', render: (row) => <span className="text-capitalize">{row.priority}</span> },
    { key: 'due_date', label: 'Due', render: (row) => formatDate(row.due_date) },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) => (
        <div className="btn-group btn-group-sm">
          {canAssignWorkers ? (
            <button type="button" className="btn btn-outline-brand" onClick={() => openReassign(row)}>
              Assign
            </button>
          ) : null}
          <button type="button" className="btn btn-outline-brand" onClick={() => openEdit(row)}>
            Edit
          </button>
          {canAssignWorkers ? (
            <button type="button" className="btn btn-outline-danger" onClick={() => setDeleteTarget(row)}>
              Delete
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{label('tasks')}</h1>
          <p className="text-secondary mb-0">
            {canAssignWorkers
              ? 'Create a job and assign it to one specific worker.'
              : `Your assigned ${label('tasks').toLowerCase()}`}
          </p>
        </div>
        {canAssignWorkers ? (
          <button type="button" className="btn btn-brand" onClick={() => openCreate()}>
            Assign job to worker
          </button>
        ) : (
          <button type="button" className="btn btn-brand" onClick={() => openCreate()}>
            New task
          </button>
        )}
      </div>

      {canAssignWorkers ? (
        <div className="assign-banner">
          <strong>How it works:</strong> pick the job title, choose one worker, save. That worker sees it under My work.
        </div>
      ) : null}

      {error ? <Alert type="danger" message={error} /> : null}
      {employeesError ? <Alert type="warning" message={employeesError} /> : null}

      <div className="panel">
        <div className="row g-3 mb-3">
          <div className="col-md-4" style={{ maxWidth: 240 }}>
            <label className="form-label small text-secondary">Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(event) => {
                setPage(1)
                setStatusFilter(event.target.value)
              }}
            >
              <option value="">All</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {canAssignWorkers ? (
            <div className="col-md-4" style={{ maxWidth: 280 }}>
              <label className="form-label small text-secondary">Worker</label>
              <select
                className="form-select"
                value={assigneeFilter}
                onChange={(event) => {
                  setPage(1)
                  setAssigneeFilter(event.target.value)
                }}
              >
                <option value="">All workers</option>
                {assigneeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <DataTable columns={columns} rows={rows} loading={loading} emptyMessage="No jobs yet." />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal
        show={showForm}
        title={editing ? 'Edit / reassign job' : 'Assign job to a worker'}
        size="modal-lg"
        onClose={() => setShowForm(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline-brand" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" form="task-form" className="btn btn-brand" disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save assignment' : 'Assign job'}
            </button>
          </>
        }
      >
        <form id="task-form" onSubmit={onSubmit}>
          <FormField label="Job title" name="title" value={form.title} onChange={onChange} required error={firstValidationError(errors, 'title')} />
          <FormField label="Details" name="description" as="textarea" rows={3} value={form.description} onChange={onChange} error={firstValidationError(errors, 'description')} />
          <div className="row">
            {canAssignWorkers ? (
              <div className="col-md-6">
                <FormField
                  label="Assign to this worker"
                  name="assigned_to"
                  as="select"
                  required
                  value={form.assigned_to}
                  onChange={onChange}
                  error={firstValidationError(errors, 'assigned_to')}
                  options={[
                    { value: '', label: 'Select worker…' },
                    ...assigneeOptions,
                  ]}
                />
                {!assigneeOptions.length ? (
                  <p className="small text-secondary mt-1 mb-0">
                    No workers yet. Add them on the Employees page first.
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="col-md-6">
              <FormField
                label="Project"
                name="project_id"
                as="select"
                value={form.project_id}
                onChange={onChange}
                error={firstValidationError(errors, 'project_id')}
                options={[
                  { value: '', label: 'No project' },
                  ...projects.map((project) => ({ value: project.id, label: project.name })),
                ]}
              />
            </div>
            <div className="col-md-4">
              <FormField
                label="Status"
                name="status"
                as="select"
                value={form.status}
                onChange={onChange}
                error={firstValidationError(errors, 'status')}
                options={[
                  { value: 'todo', label: 'Todo' },
                  { value: 'in_progress', label: 'In progress' },
                  { value: 'done', label: 'Done' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </div>
            <div className="col-md-4">
              <FormField
                label="Priority"
                name="priority"
                as="select"
                value={form.priority}
                onChange={onChange}
                error={firstValidationError(errors, 'priority')}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />
            </div>
            <div className="col-md-4">
              <FormField label="Due date" name="due_date" type="date" value={form.due_date} onChange={onChange} error={firstValidationError(errors, 'due_date')} />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        show={Boolean(deleteTarget)}
        title="Delete task"
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
          Delete <strong>{deleteTarget?.title}</strong>?
        </p>
      </Modal>
    </>
  )
}
