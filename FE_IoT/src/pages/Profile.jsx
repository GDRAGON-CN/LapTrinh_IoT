import { useState } from 'react'
import { Pencil, Github, Figma, Workflow, ExternalLink } from 'lucide-react'
import { apiUpdateProfile, apiUpdatePassword } from '../services/api'
import './Profile.css'

function InfoRow(props) {
  let content = <div>{props.value}</div>
  if (!props.value) {
    content = (
      <div>
        <span className="muted">Not set</span>
      </div>
    )
  }
  if (props.editing) {
    content = (
      <input
        value={props.value || ''}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
      />
    )
  }

  return (
    <div className="profile-field">
      <small className="muted">{props.label}</small>
      {content}
    </div>
  )
}

function ProjectLink(props) {
  let content = <span className="muted">Not set</span>
  if (props.url) {
    content = (
      <a href={props.url} target="_blank" rel="noreferrer" className="link">
        {props.label} <ExternalLink size={14} />
      </a>
    )
  }

  return (
    <div className="profile-link-row">
      <span className="profile-link-ico">{props.icon}</span>
      <div className="profile-link-main">
        <b>{props.title}</b>
        <small className="muted">{props.sub}</small>
        {props.editing ? (
          <input
            value={props.url || ''}
            placeholder="https://..."
            onChange={(e) => props.onChange(e.target.value)}
          />
        ) : (
          content
        )}
      </div>
    </div>
  )
}

export default function Profile(props) {
  const user = props.user
  const [editing, setEditing] = useState(false)

  const [name, setName] = useState(user.name || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [github, setGithub] = useState(user.github || '')
  const [figma, setFigma] = useState(user.figma || '')
  const [drawio, setDrawio] = useState(user.drawio || '')

  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passErr, setPassErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSaveInfo() {
    setLoading(true)
    try {
      const updated = await apiUpdateProfile({
        name,
        phone,
        github,
        figma,
        drawio,
      })
      props.onChange(updated)
      setEditing(false)
    } catch (err) {
      alert(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  function handleCancelInfo() {
    setName(user.name || '')
    setPhone(user.phone || '')
    setGithub(user.github || '')
    setFigma(user.figma || '')
    setDrawio(user.drawio || '')
    setEditing(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPassMsg('')
    setPassErr('')

    if (newPass.length < 6) {
      setPassErr('New password must be at least 6 characters.')
      return
    }
    if (newPass !== confirmPass) {
      setPassErr('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await apiUpdatePassword(oldPass, newPass)
      setPassMsg('Password updated successfully.')
      setOldPass('')
      setNewPass('')
      setConfirmPass('')
    } catch (err) {
      setPassErr(err.message || 'Incorrect old password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="panel profile-card">
        <div className="profile-head">
          <div className="profile-avatar">
            {(name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{name}</h2>
            <p className="muted">{user.email}</p>
            <span className="pill sm">{user.role || 'USER'}</span>
          </div>
        </div>

        <div className="profile-section-title">
          <span>Personal Information</span>
          {!editing ? (
            <button className="btn sm" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <div className="row gap">
              <button className="btn sm ok" onClick={handleSaveInfo} disabled={loading}>
                Save
              </button>
              <button className="btn sm" onClick={handleCancelInfo}>
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="profile-grid">
          <InfoRow label="Full Name" value={name} editing={editing} onChange={setName} />
          <InfoRow label="Email Address" value={user.email} editing={false} disabled />
          <InfoRow label="Phone Number" value={phone} editing={editing} onChange={setPhone} />
          <InfoRow label="Account Role" value={user.role || 'USER'} editing={false} disabled />
        </div>

        <div className="profile-section-title">
          <span>Project Links</span>
        </div>

        <div className="profile-links">
          <ProjectLink
            icon={<Github size={20} />}
            title="GitHub Repository"
            sub="Source code & documentation"
            url={github}
            label="View Repository"
            editing={editing}
            onChange={setGithub}
          />
          <ProjectLink
            icon={<Figma size={20} />}
            title="Figma Design"
            sub="UI / UX wireframes"
            url={figma}
            label="Open Figma"
            editing={editing}
            onChange={setFigma}
          />
          <ProjectLink
            icon={<Workflow size={20} />}
            title="System Architecture"
            sub="Flow diagrams & schematics"
            url={drawio}
            label="Open Diagram"
            editing={editing}
            onChange={setDrawio}
          />
        </div>
      </div>

      <div className="panel profile-card">
        <h3>Change Password</h3>
        <p className="muted">Ensure your account is using a secure password</p>

        {passMsg && <div className="profile-alert ok">{passMsg}</div>}
        {passErr && <div className="profile-alert bad">{passErr}</div>}

        <form onSubmit={handleChangePassword} className="profile-form">
          <label>Current Password</label>
          <input
            type="password"
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
            required
          />

          <label>New Password</label>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            required
          />

          <button type="submit" className="btn ok" disabled={loading}>
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
