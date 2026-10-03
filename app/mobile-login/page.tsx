import { isAllowedMobileRedirect } from "@/lib/mobileRedirect";
import StartLogin from "./StartLogin";

export const dynamic = "force-dynamic";

export default async function MobileLoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams;
  if (!isAllowedMobileRedirect(redirect)) {
    return <p className="py-24 text-center text-black/50">This sign-in link isn&apos;t valid. Go back to the app and try again.</p>;
  }
  return <StartLogin redirect={redirect} />;
}
