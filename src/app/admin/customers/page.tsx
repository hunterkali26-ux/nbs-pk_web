import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  const customers = (data ?? []) as Profile[];
  return <main className="min-h-screen bg-[#f1efe9] px-6 py-10 lg:px-10 lg:py-14"><div className="mx-auto max-w-[1250px]"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b58a3a]">People</p><h1 className="mt-3 font-serif text-5xl">Customers</h1><div className="mt-10 overflow-x-auto border border-black/10 bg-white"><table className="w-full min-w-[800px] text-left text-sm"><thead className="border-b border-black/10 text-[10px] uppercase tracking-widest text-black/40"><tr><th className="px-5 py-4">Full name</th><th className="px-5 py-4">Phone</th><th className="px-5 py-4">Address</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Registered</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-b border-black/8 last:border-0"><td className="px-5 py-4 font-semibold">{customer.full_name || "Unnamed"}</td><td className="px-5 py-4 text-black/60">{customer.phone_number || "—"}</td><td className="max-w-xs truncate px-5 py-4 text-black/60">{customer.address || "—"}</td><td className="px-5 py-4 capitalize text-[#b58a3a]">{customer.role}</td><td className="px-5 py-4 text-black/50">{new Date(customer.created_at).toLocaleDateString("en-PK")}</td></tr>)}</tbody></table>{customers.length === 0 ? <p className="p-12 text-center text-sm text-black/45">No registered users yet.</p> : null}</div></div></main>;
}
