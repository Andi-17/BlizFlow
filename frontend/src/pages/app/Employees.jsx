import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import Alert from '../../components/Alert'
import SearchFilter from '../../components/SearchFilter'
import { employeeService } from '../../services/employeeService'
import { taskService } from '../../services/taskService'
import { roleService } from '../../services/performanceService'
import { usePagination } from '../../hooks/usePagination'
import { useAlert } from '../../hooks/useAlert'
import { useIndustry } from '../../hooks/useIndustry'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../hooks/useAuth'
import { useCompany } from '../../hooks/useCompany'
import { usePlanEntitlements } from '../../hooks/usePlanEntitlements'
import { useLocale } from '../../hooks/useLocale'
import { firstValidationError, getErrorMessage, getValidationErrors, unwrapList } from '../../utils/formatters'

const emptyForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  status: 'active',
  role_id: '',
  user_id: null,
}
const emptyAssign = { title: '', description: '', due_date: '', priority: 'medium' }

const ROLE_GUIDE = [
  {
    slug: 'admin',
    title: 'Admin',
    text: 'Full access: people, settings, billing, and all company data.',
  },
  {
    slug: 'manager',
    title: 'Manager',
    text: 'Runs day-to-day work and can see the whole team’s performance.',
  },
  {
    slug: 'employee',
    title: 'Worker',
    text: 'Sees only assigned tasks/orders and personal day / month / year stats.',
  },
]

export default function Employees() {
  const navigate = useNavigate()
  const { label } = useIndustry()
  const { canManageEmployees, isAdmin, canViewTeamPerformance } = usePermissions()
  const { refreshUser, applySession, isImpersonating } = useAuth()
  const { selectCompany, companyId } = useCompany()
  const { maxUsers, unlimitedUsers } = usePlanEntitlements()
  const canAssignWork = canManageEmployees || isAdmin || canViewTeamPerformance
  const canImpersonate = canManageEmployees && !isImpersonating
  const { success, error: showError } = useAlert()
  const { t } = useLocale()
  const [impersonatingId, setImpersonatingId] = useState(null)
  const { page, setPage, meta, setMeta, params, applySearch, search } = usePagination()
  const [rows, setRows] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [assignTarget, setAssignTarget] = useState(null)
  const [assignForm, setAssignForm] = useState(emptyAssign)
  const [assignErrors, setAssignErrors] = useState({})
  const [assigning, setAssigning] = useState(false)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResults, setLookupResults] = useState([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [createMode, setCreateMode] = useState(true)
  const [createdCredentials, setCreatedCredentials] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await employeeService.list(params)
      const { items, meta: nextMeta } = unwrapList(response.data)
      setRows(items)
      setMeta(nextMeta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await roleService.list()
        const list = Array.isArray(response.data) ? response.data : unwrapList(response.data).items
        if (active) setRoles(list || [])
      } catch (err) {
        if (active && canManageEmployees) {
          setError(getErrorMessage(err, 'Could not load roles'))
        }
      }
    })()
    return () => {
      active = false
    }
  }, [canManageEmployees])

  useEffect(() => {
    if (!showForm || editing || createMode) {
      setLookupResults([])
      return undefined
    }

    const query = lookupQuery.trim()
    if (query.length < 2) {
      setLookupResults([])
      return undefined
    }

    let active = true
    const timer = setTimeout(async () => {
      setLookupLoading(true)
      try {
        const response = await employeeService.lookup(query)
        const list = Array.isArray(response.data) ? response.data : unwrapList(response.data).items
        if (active) setLookupResults(list || [])
      } catch {
        if (active) setLookupResults([])
      } finally {
        if (active) setLookupLoading(false)
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [lookupQuery, showForm, editing, createMode])

  const generatePassword = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#'
    let value = ''
    for (let index = 0; index < 12; index += 1) {
      value += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    // Ensure mixed case + number for Password::defaults()
    if (!/[A-Z]/.test(value)) value = `A${value.slice(1)}`
    if (!/[a-z]/.test(value)) value = `${value.slice(0, 1)}a${value.slice(2)}`
    if (!/\d/.test(value)) value = `${value.slice(0, 2)}2${value.slice(3)}`
    setForm((current) => ({ ...current, password: value }))
  }

  const openCreate = () => {
    setEditing(null)
    const worker = roles.find((role) => role.slug === 'employee')
    setForm({ ...emptyForm, role_id: worker ? String(worker.id) : '' })
    setLookupQuery('')
    setLookupResults([])
    setCreateMode(true)
    setCreatedCredentials(null)
    setErrors({})
    setShowForm(true)
  }

  const selectExistingUser = (user) => {
    setForm((current) => ({
      ...current,
      user_id: user.id,
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
    }))
    setLookupQuery(user.username || user.name || '')
    setLookupResults([])
    setCreateMode(false)
  }

  const clearSelectedUser = () => {
    setForm((current) => ({
      ...current,
      user_id: null,
      name: '',
      username: '',
      email: '',
      password: '',
    }))
    setLookupQuery('')
  }

  const startCreateAccount = () => {
    setCreateMode(true)
    setForm((current) => ({
      ...current,
      user_id: null,
      name: '',
      username: '',
      email: '',
      password: '',
    }))
    setLookupResults([])
  }

  const openExistingLookup = () => {
    setCreateMode(false)
    clearSelectedUser()
  }

  const openEdit = (row) => {
    setEditing(row)
    setCreateMode(false)
    setForm({
      name: row.name || row.user?.name || '',
      username: row.username || row.user?.username || '',
      email: row.email || row.user?.email || '',
      password: '',
      status: row.status || 'active',
      role_id: row.role_id ? String(row.role_id) : row.role?.id ? String(row.role.id) : '',
      user_id: row.user_id || null,
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
    if (!form.role_id) {
      setErrors({ role_id: ['Please select a role.'] })
      return
    }
    if (!editing && !form.user_id && !form.password.trim()) {
      setErrors({ password: ['Set a password the worker will use to sign in.'] })
      return
    }
    setSubmitting(true)
    setErrors({})
    try {
      if (editing) {
        await employeeService.update(editing.id, {
          name: form.name,
          status: form.status,
          role_id: Number(form.role_id),
        })
        success('Team member updated')
        setShowForm(false)
      } else if (form.user_id) {
        await employeeService.create({
          user_id: Number(form.user_id),
          status: form.status,
          role_id: Number(form.role_id),
        })
        success('Worker added to company')
        setShowForm(false)
      } else {
        const username = form.username.trim().toLowerCase()
        const password = form.password
        await employeeService.create({
          name: form.name,
          username,
          email: form.email,
          password,
          status: form.status,
          role_id: Number(form.role_id),
        })
        setShowForm(false)
        setCreatedCredentials({
          name: form.name,
          username,
          password,
          email: form.email,
        })
        success('Worker account created — give them the login details')
      }
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
      await employeeService.remove(deleteTarget.id)
      success('Removed from company')
      setDeleteTarget(null)
      load()
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const openAssign = (row) => {
    setAssignTarget(row)
    setAssignForm(emptyAssign)
    setAssignErrors({})
  }

  const onAssignChange = (event) => {
    const { name, value } = event.target
    setAssignForm((current) => ({ ...current, [name]: value }))
  }

  const onAssignSubmit = async (event) => {
    event.preventDefault()
    if (!assignTarget?.user_id) {
      showError('This member has no linked user account.')
      return
    }
    setAssigning(true)
    setAssignErrors({})
    try {
      await taskService.create({
        title: assignForm.title,
        description: assignForm.description || null,
        assigned_to: Number(assignTarget.user_id),
        status: 'todo',
        priority: assignForm.priority || 'medium',
        due_date: assignForm.due_date || null,
      })
      success(`Job assigned to ${assignTarget.name || assignTarget.user?.name}`)
      setAssignTarget(null)
    } catch (err) {
      setAssignErrors(getValidationErrors(err))
      showError(getErrorMessage(err))
    } finally {
      setAssigning(false)
    }
  }

  const enterWorkerAccount = async (row) => {
    if (!row?.id) return
    setImpersonatingId(row.id)
    try {
      const response = await employeeService.impersonate(row.id)
      applySession({
        user: response.data?.user,
        memberships: [],
        impersonating: true,
        impersonator: response.data?.impersonator,
      })
      await refreshUser()
      if (response.data?.company_id || companyId) {
        await selectCompany(response.data?.company_id || companyId)
      }
      success(response.message || `Now viewing as ${row.name || row.user?.name}`)
      navigate('/app/my-work')
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setImpersonatingId(null)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => <strong>{row.name || row.user?.name}</strong>,
    },
    {
      key: 'username',
      label: 'Username',
      render: (row) => row.username || row.user?.username || '—',
    },
    { key: 'email', label: 'Email', render: (row) => row.email || row.user?.email || '—' },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className="badge badge-soft">{row.is_owner ? 'Owner' : row.role?.name || '—'}</span>
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <span className="text-capitalize">{row.status}</span> },
    {
      key: 'actions',
      label: '',
      className: 'text-end',
      render: (row) => (
        <div className="btn-group btn-group-sm">
          {canAssignWork && row.user_id && row.status !== 'inactive' ? (
            <button type="button" className="btn btn-brand" onClick={() => openAssign(row)}>
              Assign job
            </button>
          ) : null}
          {canImpersonate && !row.is_owner && row.status !== 'inactive' ? (
            <button
              type="button"
              className="btn btn-outline-brand"
              disabled={impersonatingId === row.id}
              onClick={() => enterWorkerAccount(row)}
            >
              {impersonatingId === row.id ? 'Entering…' : 'Enter account'}
            </button>
          ) : null}
          {canManageEmployees && !row.is_owner ? (
            <>
              <button type="button" className="btn btn-outline-brand" onClick={() => openEdit(row)}>
                Edit role
              </button>
              <button type="button" className="btn btn-outline-danger" onClick={() => setDeleteTarget(row)}>
                Remove
              </button>
            </>
          ) : null}
        </div>
      ),
    },
  ]

  const teamCount = meta?.total ?? rows.length
  const atSeatLimit = canManageEmployees && !unlimitedUsers && Number(teamCount) >= Number(maxUsers)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{label('employees')}</h1>
          <p className="text-secondary mb-0">
            Create a login for each worker (username + password). They sign in on BizFlow and enter this business.
          </p>
        </div>
        {canManageEmployees ? (
          <button type="button" className="btn btn-brand" onClick={openCreate} disabled={!roles.length || atSeatLimit}>
            Create worker account
          </button>
        ) : null}
      </div>

      {atSeatLimit ? (
        <Alert
          type="warning"
          message={
            <>
              {t('pricing.seatsFull', { max: String(maxUsers) })}{' '}
              <Link to="/app/billing">{t('pricing.upgradeCta')}</Link>
            </>
          }
        />
      ) : null}

      <div className="row g-3 mb-4">
        {ROLE_GUIDE.map((role) => {
          const live = roles.find((item) => item.slug === role.slug)
          return (
            <div className="col-md-4" key={role.slug}>
              <div className="panel h-100 role-card">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <h2 className="h6 mb-1">{role.title}</h2>
                  {live ? <span className="badge badge-soft">Available</span> : null}
                </div>
                <p className="small text-secondary mb-0">{role.text}</p>
              </div>
            </div>
          )
        })}
      </div>

      {error ? <Alert type="danger" message={error} /> : null}
      {!roles.length && canManageEmployees ? (
        <Alert type="warning" message="Roles are still loading or not seeded. Run RolePermissionSeeder on the backend." />
      ) : null}

      <div className="panel">
        <SearchFilter
          value={search}
          onSearch={applySearch}
          placeholder="Search by name or username…"
        />
        <DataTable columns={columns} rows={rows} loading={loading} />
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal
        show={showForm}
        title={editing ? 'Edit team member' : createMode ? 'Create worker account' : 'Add existing account'}
        onClose={() => setShowForm(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline-brand" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button
              type="submit"
              form="employee-form"
              className="btn btn-brand"
              disabled={
                submitting
                || (!editing && !form.user_id && !createMode)
              }
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="employee-form" onSubmit={onSubmit}>
          {!editing ? (
            <>
              {createMode && !form.user_id ? (
                <>
                  <p className="small text-secondary mb-3">
                    You create the account. Give the worker the username and password so they can log in
                    and work in this business.
                  </p>
                  <FormField
                    label="Full name"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    error={firstValidationError(errors, 'name')}
                  />
                  <FormField
                    label="Username"
                    name="username"
                    value={form.username}
                    onChange={onChange}
                    required
                    helpText="They will sign in with this username (or email)."
                    error={firstValidationError(errors, 'username')}
                  />
                  <FormField
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    required
                    helpText="Needed for login verification codes."
                    error={firstValidationError(errors, 'email')}
                  />
                  <FormField
                    label="Password"
                    name="password"
                    type="text"
                    value={form.password}
                    onChange={onChange}
                    required
                    helpText="Min. 8 characters, with upper/lowercase and a number. Share this with the worker once."
                    error={firstValidationError(errors, 'password')}
                  />
                  <button type="button" className="btn btn-sm btn-outline-brand mb-3" onClick={generatePassword}>
                    Generate password
                  </button>
                  <div className="mb-3">
                    <button type="button" className="btn btn-sm btn-link px-0" onClick={openExistingLookup}>
                      Or add someone who already has a BizFlow account
                    </button>
                  </div>
                </>
              ) : null}

              {!createMode && !form.user_id ? (
                <div className="mb-3">
                  <label className="form-label" htmlFor="worker-lookup">
                    Find existing BizFlow account
                  </label>
                  <input
                    id="worker-lookup"
                    type="search"
                    className="form-control"
                    value={lookupQuery}
                    onChange={(event) => setLookupQuery(event.target.value)}
                    placeholder="Username or email…"
                    autoComplete="off"
                  />
                  <div className="form-text">Only for people who already registered on BizFlow.</div>
                  {lookupLoading ? <p className="small text-secondary mt-2 mb-0">Searching…</p> : null}
                  {lookupResults.length ? (
                    <ul className="list-group mt-2 worker-lookup-results">
                      {lookupResults.map((user) => (
                        <li key={user.id} className="list-group-item list-group-item-action p-0">
                          <button
                            type="button"
                            className="btn btn-link text-start text-decoration-none w-100 px-3 py-2"
                            onClick={() => selectExistingUser(user)}
                          >
                            <strong className="d-block text-body">{user.name}</strong>
                            <span className="small text-secondary">
                              @{user.username}
                              {user.email ? ` · ${user.email}` : ''}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {lookupQuery.trim().length >= 2 && !lookupLoading && !lookupResults.length ? (
                    <p className="small text-secondary mt-2 mb-0">No account found.</p>
                  ) : null}
                  <button type="button" className="btn btn-sm btn-outline-brand mt-3" onClick={startCreateAccount}>
                    ← Create new login instead
                  </button>
                </div>
              ) : null}

              {form.user_id ? (
                <div className="alert alert-success py-2">
                  Selected: <strong>{form.name}</strong> (@{form.username})
                  <button type="button" className="btn btn-sm btn-link ms-2" onClick={clearSelectedUser}>
                    Change
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <FormField label="Name" name="name" value={form.name} onChange={onChange} required error={firstValidationError(errors, 'name')} />
              <FormField label="Username" name="username" value={form.username} onChange={onChange} disabled helpText="Username cannot be changed here." />
            </>
          )}

          <FormField
            label="Role"
            name="role_id"
            as="select"
            required
            value={form.role_id}
            onChange={onChange}
            error={firstValidationError(errors, 'role_id')}
            options={[
              { value: '', label: 'Select role…' },
              ...roles.map((role) => ({
                value: String(role.id),
                label: role.name,
              })),
            ]}
          />
          <FormField
            label="Status"
            name="status"
            as="select"
            value={form.status}
            onChange={onChange}
            error={firstValidationError(errors, 'status')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </form>
      </Modal>

      <Modal
        show={Boolean(createdCredentials)}
        title="Give these login details to the worker"
        onClose={() => setCreatedCredentials(null)}
        footer={
          <button type="button" className="btn btn-brand" onClick={() => setCreatedCredentials(null)}>
            Done
          </button>
        }
      >
        {createdCredentials ? (
          <div>
            <p className="mb-3">
              <strong>{createdCredentials.name}</strong> can now open BizFlow, sign in, and will enter this business
              as a worker.
            </p>
            <div className="panel border rounded p-3 mb-0">
              <p className="mb-2">
                <span className="text-secondary">Username:</span>{' '}
                <strong>{createdCredentials.username}</strong>
              </p>
              <p className="mb-2">
                <span className="text-secondary">Password:</span>{' '}
                <strong style={{ fontFamily: 'monospace' }}>{createdCredentials.password}</strong>
              </p>
              <p className="mb-0">
                <span className="text-secondary">Email:</span> {createdCredentials.email}
              </p>
            </div>
            <p className="small text-secondary mt-3 mb-0">
              Copy these now — the password is not shown again. They use the normal Login page.
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        show={Boolean(deleteTarget)}
        title="Remove team member"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-brand" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" disabled={deleting} onClick={confirmDelete}>
              {deleting ? 'Removing…' : 'Remove'}
            </button>
          </>
        }
      >
        <p className="mb-0">
          Remove <strong>{deleteTarget?.name || deleteTarget?.user?.name}</strong> from this company?
        </p>
      </Modal>

      <Modal
        show={Boolean(assignTarget)}
        title={`Assign job to ${assignTarget?.name || assignTarget?.user?.name || 'worker'}`}
        onClose={() => setAssignTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-brand" onClick={() => setAssignTarget(null)}>
              Cancel
            </button>
            <button type="submit" form="assign-job-form" className="btn btn-brand" disabled={assigning}>
              {assigning ? 'Assigning…' : 'Assign job'}
            </button>
          </>
        }
      >
        <form id="assign-job-form" onSubmit={onAssignSubmit}>
          <p className="small text-secondary">
            This creates a task for <strong>{assignTarget?.name || assignTarget?.user?.name}</strong> only.
          </p>
          <FormField
            label="Job title"
            name="title"
            value={assignForm.title}
            onChange={onAssignChange}
            required
            error={firstValidationError(assignErrors, 'title')}
          />
          <FormField
            label="Details"
            name="description"
            as="textarea"
            rows={3}
            value={assignForm.description}
            onChange={onAssignChange}
            error={firstValidationError(assignErrors, 'description')}
          />
          <div className="row">
            <div className="col-md-6">
              <FormField
                label="Priority"
                name="priority"
                as="select"
                value={assignForm.priority}
                onChange={onAssignChange}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />
            </div>
            <div className="col-md-6">
              <FormField
                label="Due date"
                name="due_date"
                type="date"
                value={assignForm.due_date}
                onChange={onAssignChange}
                error={firstValidationError(assignErrors, 'due_date')}
              />
            </div>
          </div>
        </form>
      </Modal>
    </>
  )
}
