export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-9 h-9 rounded-md bg-teal-500 flex items-center justify-center font-bold text-black">
            T
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">THF STOCK</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Operations Control</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
