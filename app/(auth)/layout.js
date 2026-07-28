export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-9 h-9 rounded-md bg-teal-500 flex items-center justify-center font-bold text-black">
            T
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">THF STOCK</div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Operations Control</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
