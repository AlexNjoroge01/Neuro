import SidebarLayout from "@/components/Layout";
import { trpc } from "@/utils/trpc";
import { useState, FormEvent, useMemo } from "react";
import ClientOnly from "@/components/ClientOnly";

export default function HRPage() {
  const utils = trpc.useUtils();
  const { data: employees } = trpc.hr.getEmployees.useQuery();
  const addEmployee = trpc.hr.addEmployee.useMutation({ onSuccess: () => utils.hr.getEmployees.invalidate() });
  const recordPayroll = trpc.hr.recordPayroll.useMutation({ onSuccess: () => utils.hr.getEmployees.invalidate() });

  const [empForm, setEmpForm] = useState({ name: "", role: "Driver", salary: "" });
  const [payForm, setPayForm] = useState({ employeeId: "", month: "2025-10", amountPaid: "" });

  const hrStats = useMemo(() => {
    const stats = {
      totalEmployees: employees?.length ?? 0,
      totalPayrollRecords: employees?.reduce((acc, e) => acc + e.Payroll.length, 0) ?? 0,
      totalSalary: employees?.reduce((acc, e) => acc + e.salary, 0) ?? 0,
      driverCount: employees?.filter(e => e.role === "Driver").length ?? 0,
    };
    return stats;
  }, [employees]);

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

  const payrollRows = useMemo(() => {
    const rows: { id: string; employee: string; month: string; amountPaid: number; paidAt: string }[] = [];
    (employees ?? []).forEach((e) => {
      (e.Payroll ?? []).forEach((p) => {
        rows.push({ id: p.id, employee: e.name, month: p.month, amountPaid: p.amountPaid, paidAt: new Date(p.paidAt).toLocaleString() });
      });
    });
    return rows.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  }, [employees]);

  return (
    <SidebarLayout>
      <ClientOnly>
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={addEmployeeSubmit} className="border rounded-lg p-3 grid gap-2 bg-background">
          <div className="font-medium">Add Employee</div>
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Name" 
            value={empForm.name} 
            onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} 
          />
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Role" 
            value={empForm.role} 
            onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })} 
          />
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Salary" 
            value={empForm.salary} 
            onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })} 
          />
          <button className="bg-primary text-primary-foreground rounded px-3 py-1">Save</button>
        </form>

        <form onSubmit={recordPayrollSubmit} className="border rounded-lg p-3 grid gap-2 bg-background">
          <div className="font-medium">Record Payroll</div>
          <select 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            value={payForm.employeeId} 
            onChange={(e) => setPayForm({ ...payForm, employeeId: e.target.value })}
          >
            <option value="">Select employee</option>
            {(employees ?? []).map((e) => (
              <option key={e.id} value={e.id}>{e.name} - {e.role}</option>
            ))}
          </select>
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Month (YYYY-MM)" 
            value={payForm.month} 
            onChange={(e) => setPayForm({ ...payForm, month: e.target.value })} 
          />
          <input 
            className="border rounded px-2 py-1 bg-gray-100/10" 
            placeholder="Amount Paid" 
            value={payForm.amountPaid} 
            onChange={(e) => setPayForm({ ...payForm, amountPaid: e.target.value })} 
          />
          <button className="bg-secondary text-secondary-foreground rounded px-3 py-1">Save</button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Stat title="Total Employees" value={hrStats.totalEmployees.toString()} index={0} />
        <Stat title="Total Payroll Records" value={hrStats.totalPayrollRecords.toString()} index={1} />
        <Stat title="Total Salary" value={formatKES(hrStats.totalSalary)} index={2} />
        <Stat title="Drivers" value={hrStats.driverCount.toString()} index={3} />
      </div>

      <div className="mt-6 overflow-x-auto border rounded-lg bg-white">
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
                <td className="p-3">{formatKES(e.salary)}</td>
                <td className="p-3">{e.Payroll.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 overflow-x-auto border rounded-lg bg-white">
        <div className="p-3 font-medium">Payroll Details</div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-t">
              <th className="text-left p-3">Employee</th>
              <th className="text-left p-3">Month</th>
              <th className="text-left p-3">Amount Paid</th>
              <th className="text-left p-3">Paid At</th>
            </tr>
          </thead>
          <tbody>
            {payrollRows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.employee}</td>
                <td className="p-3">{r.month}</td>
                <td className="p-3">{formatKES(r.amountPaid)}</td>
                <td className="p-3">{r.paidAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </ClientOnly>
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