export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-3 w-64 bg-[#1c2029] rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#12151c] border border-[#232733] rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-[#12151c] border border-[#232733] rounded-xl" />
    </div>
  );
}
