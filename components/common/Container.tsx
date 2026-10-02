export default function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`w-[90%] max-w-[1110px] mx-auto ${className}`}>{children}</div>;
}
