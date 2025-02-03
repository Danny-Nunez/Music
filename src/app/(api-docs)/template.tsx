export default function ApiDocsTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen">
      {children}
    </div>
  );
}
