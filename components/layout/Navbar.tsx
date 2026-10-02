"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import Container from "../common/Container";
import CartModal from "../cart/CartModal";
import { useCart } from "@/lib/cartContext";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Headphones", to: "/category/headphones" },
  { label: "Speakers", to: "/category/speakers" },
  { label: "Earphones", to: "/category/earphones" },
];

export default function Navbar() {
  const { count, isOpen, setIsOpen } = useCart();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

  return (
    <>
      <header className="bg-[#191919] text-white sticky top-0 z-50">
        <Container>
          <nav className="flex items-center justify-between h-[90px] border-b border-white/10">
            <Link href="/" className="flex items-center">
              <Image src="/assets/logo.png" alt="Audiophile Logo" width={143} height={25} priority />
            </Link>

            <ul className="hidden lg:flex items-center gap-8 list-none">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link href={link.to} className={`text-[13px] font-bold uppercase tracking-[2px] transition-colors hover:text-[#D87D4A] ${isActive(link.to) ? "text-[#D87D4A]" : "text-white"}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <button onClick={() => setIsOpen(!isOpen)} className="relative flex items-center gap-2 text-white hover:text-[#D87D4A] transition-colors" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
                <svg width="20" height="18" viewBox="0 0 23 20" fill="none">
                  <path d="M8.322 17.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM19.322 17.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM1.322 1h2.697l2.657 11.493H18.98l2-8.493H5.322" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="hidden sm:inline text-[13px] font-bold uppercase tracking-[1px]">Cart</span>
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#D87D4A] text-white rounded-full w-[18px] h-[18px] text-[11px] font-bold flex items-center justify-center">{count}</span>
                )}
              </button>

              {status === "authenticated" ? (
                <button onClick={() => signOut()} className="text-[13px] font-bold uppercase tracking-[1px] border border-white px-[18px] py-2 hover:bg-white hover:text-black transition-all">
                  {session.user?.name?.split(" ")[0] ?? "Account"}
                </button>
              ) : (
                <button onClick={() => signIn("google")} className="text-[13px] font-bold uppercase tracking-[1px] bg-[#D87D4A] text-white px-[18px] py-2 hover:bg-[#FBAF85] transition-colors">
                  Sign In
                </button>
              )}
            </div>
          </nav>
        </Container>
      </header>

      {isOpen && <CartModal />}
    </>
  );
}
