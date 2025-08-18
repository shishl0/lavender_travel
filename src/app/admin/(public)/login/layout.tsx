export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] flex items-start justify-center pt-16">
      <div className="w-full max-w-md p-6 card">{children}</div>
    </div>
  );
}