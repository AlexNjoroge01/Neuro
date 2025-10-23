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
  const [isModalOpen, setIsModalOpen] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.category || isNaN(amount)) return;
    addExpense.mutate({ category: form.category, amount, description: form.description || undefined });
    setForm({ category: "Fuel", amount: "", description: "" });
    setIsModalOpen(false);
  }

  return (
    <SidebarLayout>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Income" value={formatKES(summary?.totalIncome ?? 0)} index={0} />
        <Stat title="Expenses" value={formatKES(summary?.totalExpenses ?? 0)} index={1} />
        <Stat title="Net Income" value={formatKES(summary?.netIncome ?? 0)} index={2} />
      </div>

      <div className="mt-6">
        <button
          className="bg-primary text-primary-foreground rounded px-3 py-1"
          onClick={() => setIsModalOpen(true)}
        >
          Add Expense
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0  bg-black/50  flex items-center justify-center z-50">
          <div className="bg-background border border-gray-200/20 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Expense</h2>
            <form onSubmit={submit} className="grid gap-4">
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <input
                className="border rounded px-2 py-1 bg-gray-100/10"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="bg-secondary text-secondary-foreground rounded px-3 py-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground rounded px-3 py-1"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto border rounded-lg bg-white">
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

function Stat({ title, value, index }: { title: string; value: string; index: number }) {
  const bgColor = index % 2 === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground';
  return (
    <div className={`border rounded-lg px-8 py-10 ${bgColor}`}>
      <div className="text-sm">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function formatKES(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "KES" }).format(amount);
}