export function AuthFormMessage({ type = 'info', text }) {
  if (!text) {
    return null
  }

  return (
    <p className={`auth-message ${type === 'error' ? 'auth-message-error' : 'auth-message-success'}`}>
      {text}
    </p>
  )
}
