import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { useState, FormEvent } from "react";

export default function AccountingPage() {
  const utils = trpc.useUtils();
  const { data: expenses } = trpc.accounting.getExpenses.useQuery();
  const { data: summary } = trpc.accounting.getSummary.useQuery();
  const addExpense = trpc.accounting.addExpense.useMutation({
    onSuccess: () => {
      utils.accounting.getExpenses.invalidate();
      utils.accounting.getSummary.invalidate();
    },
  });

  const [form, setForm] = useState({ category: "Fuel", amount: "", description: "" });
  function submit(e: FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.category || isNaN(amount)) return;
    addExpense.mutate({ category: form.category, amount, description: form.description || undefined });
    setForm({ category: "Fuel", amount: "", description: "" });
  }

  return (
    <SidebarLayout>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Income" value={formatKES(summary?.totalIncome ?? 0)} />
        <Stat title="Expenses" value={formatKES(summary?.totalExpenses ?? 0)} />
        <Stat title="Net Income" value={formatKES(summary?.netIncome ?? 0)} />
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-2 md:grid-cols-5 border rounded-lg p-3">
        <input className="border rounded px-2 py-1" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div />
        <button className="bg-black text-white rounded px-3 py-1">Add Expense</button>
      </form>

      <div className="mt-6 overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-t">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {(expenses ?? []).map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="p-3">{e.category}</td>
                <td className="p-3">{formatKES(e.amount)}</td>
                <td className="p-3">{e.description ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SidebarLayout>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function formatKES(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "KES" }).format(amount);
}


