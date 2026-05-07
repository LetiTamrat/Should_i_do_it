export function StateLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-4 left-4 border border-outline px-2 py-1 text-outline text-label-xs">
      {children}
    </div>
  );
}
