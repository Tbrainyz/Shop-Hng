type ButtonProps = {
  text: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "dark" | "outline";
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
};

export default function Button({ text, onClick, variant = "primary", fullWidth = false, disabled = false, type = "button", className = "" }: ButtonProps) {
  const base = "px-8 py-4 text-[13px] font-bold uppercase tracking-[1px] transition-all duration-300 inline-flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-[#D87D4A] text-white hover:bg-[#FBAF85]",
    secondary: "border-2 border-white text-white hover:bg-white hover:text-black",
    dark: "bg-black text-white hover:bg-white hover:text-black border-2 border-white",
    outline: "border border-black text-black hover:bg-black hover:text-white",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ minWidth: 160, minHeight: 48 }}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}>
      {text}
    </button>
  );
}
