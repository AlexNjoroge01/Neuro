import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { useState, FormEvent } from "react";

export default function HRPage() {
  const utils = trpc.useUtils();
  const { data: employees } = trpc.hr.getEmployees.useQuery();
  const addEmployee = trpc.hr.addEmployee.useMutation({ onSuccess: () => utils.hr.getEmployees.invalidate() });
  const recordPayroll = trpc.hr.recordPayroll.useMutation({ onSuccess: () => utils.hr.getEmployees.invalidate() });

  const [empForm, setEmpForm] = useState({ name: "", role: "Driver", salary: "" });
  const [payForm, setPayForm] = useState({ employeeId: "", month: "2025-10", amountPaid: "" });

  function addEmployeeSubmit(e: FormEvent) {
    e.preventDefault();
    const salary = parseFloat(empForm.salary);
    if (!empForm.name || isNaN(salary)) return;
    addEmployee.mutate({ name: empForm.name, role: empForm.role, salary });
    setEmpForm({ name: "", role: "Driver", salary: "" });
  }

  function recordPayrollSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = parseFloat(payForm.amountPaid);
    if (!payForm.employeeId || !payForm.month || isNaN(amount)) return;
    recordPayroll.mutate({ employeeId: payForm.employeeId, month: payForm.month, amountPaid: amount });
    setPayForm({ employeeId: "", month: "2025-10", amountPaid: "" });
  }

  return (
    <SidebarLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={addEmployeeSubmit} className="border rounded-lg p-3 grid gap-2">
          <div className="font-medium">Add Employee</div>
          <input className="border rounded px-2 py-1" placeholder="Name" value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Role" value={empForm.role} onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Salary" value={empForm.salary} onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })} />
          <button className="bg-black text-white rounded px-3 py-1">Save</button>
        </form>

        <form onSubmit={recordPayrollSubmit} className="border rounded-lg p-3 grid gap-2">
          <div className="font-medium">Record Payroll</div>
          <select className="border rounded px-2 py-1" value={payForm.employeeId} onChange={(e) => setPayForm({ ...payForm, employeeId: e.target.value })}>
            <option value="">Select employee</option>
            {(employees ?? []).map((e) => (
              <option key={e.id} value={e.id}>{e.name} - {e.role}</option>
            ))}
          </select>
          <input className="border rounded px-2 py-1" placeholder="Month (YYYY-MM)" value={payForm.month} onChange={(e) => setPayForm({ ...payForm, month: e.target.value })} />
          <input className="border rounded px-2 py-1" placeholder="Amount Paid" value={payForm.amountPaid} onChange={(e) => setPayForm({ ...payForm, amountPaid: e.target.value })} />
          <button className="bg-black text-white rounded px-3 py-1">Save</button>
        </form>
      </div>

      <div className="mt-6 overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-t">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Salary</th>
              <th className="text-left p-3">Payroll Records</th>
            </tr>
          </thead>
          <tbody>
            {(employees ?? []).map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{e.name}</td>
                <td className="p-3">{e.role}</td>
                <td className="p-3">{formatCurrency(e.salary)}</td>
                <td className="p-3">{e.Payroll.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SidebarLayout>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(amount);
}


