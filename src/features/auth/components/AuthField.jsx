import { useState } from 'react'

function EyeIcon({ isOpen }) {
  if (isOpen) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
        <path
          fill="currentColor"
          d="M12 5C6.4 5 2 12 2 12s4.4 7 10 7 10-7 10-7-4.4-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="currentColor"
        d="M12 5c5.6 0 10 7 10 7a18 18 0 0 1-2.4 3.2l1.4 1.4-1.4 1.4-17-17L4 0l2.1 2.1A10.8 10.8 0 0 1 12 5Zm0 11a3.9 3.9 0 0 0 2-.5l-1.4-1.4a2 2 0 0 1-2.7-2.7L8.5 10A4 4 0 0 0 12 16Zm-8.4-.8A18 18 0 0 1 2 12s1.7-2.7 4.5-4.7L8 8.8A4 4 0 0 0 13.2 14l1.2 1.2a10.7 10.7 0 0 1-2.4.8 8.8 8.8 0 0 1-8.4-.8Z"
      />
    </svg>
  )
}

export function AuthField({ label, id, type = 'text', value, onChange, placeholder, autoComplete }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPasswordField = type === 'password'
  const inputType = isPasswordField && showPassword ? 'text' : type

  return (
    <label className="auth-field" htmlFor={id}>
      <span>{label}</span>
      <div className="auth-input-wrap">
        <input
          className="auth-input"
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />

        {isPasswordField ? (
          <button
            className="auth-eye-toggle"
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((currentValue) => !currentValue)}
          >
            <EyeIcon isOpen={showPassword} />
          </button>
        ) : null}
      </div>
    </label>
  )
}
