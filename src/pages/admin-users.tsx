import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [admins, setAdmins] = useState<{id: string, email: string}[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const isSuper = session?.user?.role === "SUPERUSER";
  useEffect(() => {
    if (!isSuper) return;
    fetch("/api/admin-users").then(r => r.json()).then(setAdmins);
  }, [isSuper]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setCreating(true);
    const res = await fetch("/api/admin-users", { method: "POST", body: JSON.stringify({ email, password }), headers: { "Content-Type": "application/json" } });
    setCreating(false);
    if (!res.ok) { setError("Failed"); return; }
    setAdmins(await res.json());
    setEmail(""); setPassword("");
  }

  if (!isSuper) return <div className="p-6">Forbidden - Superuser Only</div>;

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-5">Admin Users</h1>
      <form className="mb-6 grid gap-2" onSubmit={handleAdd}>
        <input className="border rounded px-2 py-1" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="border rounded px-2 py-1" type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-primary px-4 py-2 text-white rounded" disabled={creating}>{creating ? "Adding..." : "Add Admin"}</button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </form>
      <div>
        <h2 className="font-semibold mb-2">All Admins</h2>
        <ul>
          {admins.map(a => <li key={a.id} className="text-sm my-1">{a.email}</li>)}
        </ul>
      </div>
    </div>
  );
}
