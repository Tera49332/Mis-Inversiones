export default function Header({ title, rightAction, rightIcon: RightIcon }) {
  return (
    <header className="app-header">
      <h1 className="header-title">{title}</h1>
      {rightAction && RightIcon && (
        <button className="header-action btn btn-secondary" onClick={rightAction} style={{padding: '8px', borderRadius: '10px'}}>
          <RightIcon size={20} />
        </button>
      )}
    </header>
  )
}
