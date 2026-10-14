export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  helpText,
  children,
  as = 'input',
  options = [],
  className = '',
  ...rest
}) {
  const controlId = rest.id || name
  const shared = {
    id: controlId,
    name,
    className: `form-control ${error ? 'is-invalid' : ''} ${className}`.trim(),
    value: value ?? '',
    onChange,
    required,
    ...rest,
  }

  let control = null
  if (children) {
    control = children
  } else if (as === 'select') {
    control = (
      <select {...shared} className={`form-select ${error ? 'is-invalid' : ''} ${className}`.trim()}>
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  } else if (as === 'textarea') {
    control = <textarea {...shared} />
  } else {
    control = <input type={type} {...shared} />
  }

  return (
    <div className="mb-3">
      {label ? (
        <label htmlFor={controlId} className="form-label">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      {control}
      {helpText ? <div className="form-text">{helpText}</div> : null}
      {error ? <div className="invalid-feedback d-block">{error}</div> : null}
    </div>
  )
}
