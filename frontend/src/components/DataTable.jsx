import EmptyState from './EmptyState'
import LoadingSpinner from './LoadingSpinner'

export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  emptyTitle,
  emptyMessage,
  keyField = 'id',
  onRowClick,
}) {
  if (loading) return <LoadingSpinner />

  if (!rows.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />
  }

  return (
    <div className="table-responsive data-table-wrap">
      <table className="table table-hover align-middle mb-0 data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={column.className || ''}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[keyField]}
              className={onRowClick ? 'table-row-clickable' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} className={column.className || ''}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
