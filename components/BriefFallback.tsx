export function BriefFallback() {
  return (
    <div className="lg:mt-6" aria-busy="true" aria-label="正在打开日报">
      <div className="mb-4 h-4 w-44 rounded skeleton-line" />
      <div className="space-y-3">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-5 w-full rounded skeleton-line" style={{ width: `${88 - (index % 3) * 10}%` }} />
        ))}
      </div>
    </div>
  );
}
