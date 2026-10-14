import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import './Layout.css'

// Layout = Sidebar bên trái + nội dung trang bên phải
export default function Layout(props) {
  const location = useLocation()

  // Dashboard (đường dẫn "/") không có thanh cuộn, các trang khác thì có
  let contentClass = 'layout-content'
  if (location.pathname === '/') {
    contentClass = 'layout-content layout-content--fit'
  }

  return (
    <div className="layout">
      <Sidebar onLogout={props.onLogout} />
      <main className={contentClass}>
        <Outlet />
      </main>
    </div>
  )
}
