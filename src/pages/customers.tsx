import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { FormEvent, useState } from "react";

export default function CustomersPage() {
  const utils = trpc.useUtils();
  const { data: customers } = trpc.customers.list.useQuery();
  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => utils.customers.list.invalidate(),
  });
  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => utils.customers.list.invalidate(),
  });

  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    createCustomer.mutate({ ...form, phone: form.phone || undefined });
    setForm({ name: "", email: "", phone: "" });
  }

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Customers</h1>
      </div>

      <form onSubmit={submit} className="grid gap-2 md:grid-cols-5 border rounded-lg p-3 mb-6">
        <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <div />
        <button className="bg-black text-white rounded px-3 py-1">Add</button>
      </form>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-t">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.email}</td>
                <td className="p-3">{c.phone ?? "-"}</td>
                <td className="p-3">
                  <button className="text-red-600 underline" onClick={() => deleteCustomer.mutate(c.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SidebarLayout>
  );
}


