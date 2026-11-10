export default function ColorField({ label, value, onChange }) {
  return (
    <label className="color-field">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span>{label}</span>
      <code>{value.toUpperCase()}</code>
    </label>
  )
}
