export function AuthFormMessage({ type = 'info', text }) {
  if (!text) {
    return null
  }

  return (
    <p className={`mt-4 rounded border p-3 text-sm ${type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
      {text}
    </p>
  )
}
