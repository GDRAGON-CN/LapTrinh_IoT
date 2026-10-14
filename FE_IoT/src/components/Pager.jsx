import './Pager.css'

export default function Pager(props) {
  const page = props.page

  // Tổng số trang (làm tròn lên)
  let totalPages = Math.ceil(props.total / props.size)
  if (totalPages < 1) {
    totalPages = 1
  }

  // Số thứ tự dòng đầu và dòng cuối của trang hiện tại
  let from = 0
  if (props.total > 0) {
    from = (page - 1) * props.size + 1
  }
  let to = page * props.size
  if (to > props.total) {
    to = props.total
  }

  // Chỉ hiện trang đầu, trang cuối và các trang gần trang hiện tại
  const items = []
  let lastShown = 0
  for (let n = 1; n <= totalPages; n++) {
    const isFirstOrLast = n === 1 || n === totalPages
    const isNearCurrent = n >= page - 1 && n <= page + 1
    if (isFirstOrLast || isNearCurrent) {
      if (n - lastShown > 1) {
        items.push('...')
      }
      items.push(n)
      lastShown = n
    }
  }

  return (
    <div className="pager">
      <div className="pager-left">
        <small className="muted">
          Showing {from}–{to} of {props.total} {props.label}
        </small>

        {/* Chọn số dòng hiển thị trên 1 trang */}
        <label className="pager-size">
          Rows per page
          <select
            value={props.size}
            onChange={(e) => props.onSizeChange(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      <div>
        <button disabled={page === 1} onClick={() => props.onPage(page - 1)}>
          Previous
        </button>

        {items.map((item, index) => {
          if (item === '...') {
            return <em key={'dots' + index}>…</em>
          }
          let buttonClass = ''
          if (item === page) {
            buttonClass = 'on'
          }
          return (
            <button
              key={item}
              className={buttonClass}
              onClick={() => props.onPage(item)}
            >
              {item}
            </button>
          )
        })}

        <button
          disabled={page === totalPages}
          onClick={() => props.onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
