import { NavLink } from 'react-router-dom'
import { Home, Database, History, User, LogOut } from 'lucide-react'
import './Sidebar.css'

export default function Sidebar(props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">
          <Home size={20} />
        </span>
        Smart Home
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className="sidebar-link">
          <Home size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/data-sensor" className="sidebar-link">
          <Database size={18} />
          Data Sensor
        </NavLink>
        <NavLink to="/history" className="sidebar-link">
          <History size={18} />
          History
        </NavLink>
        <NavLink to="/profile" className="sidebar-link">
          <User size={18} />
          Profile
        </NavLink>
      </nav>

      <button className="sidebar-link sidebar-logout" onClick={props.onLogout}>
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  )
}
