import { useSession } from "next-auth/react";

export default function AccountPage() {
  const { data: session, status } = useSession();
  if (status !== "authenticated" || !session.user) {
    return <div className="p-8">You must be logged in to view your account.</div>;
  }
  const { name, email, role } = session.user;
  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-5">Account Settings</h1>
      <div className="mb-4">Role: <span className="font-bold text-primary">{role}</span></div>
      <form className="grid gap-4">
        <div>
          <label className="text-xs">Name</label>
          <input type="text" className="border rounded px-3 py-2 w-full" value={name ?? ""} disabled />
        </div>
        <div>
          <label className="text-xs">Email</label>
          <input type="email" className="border rounded px-3 py-2 w-full" value={email ?? ""} disabled />
        </div>
        {/* TODO: Add fields for editable phone, address, shippingInfo. Implement backend for updating. */}
        <div>
          <label className="text-xs">Phone</label>
          <input type="text" className="border rounded px-3 py-2 w-full" value={session.user.phone ?? ""} disabled />
        </div>
        <div>
          <label className="text-xs">Address</label>
          <input type="text" className="border rounded px-3 py-2 w-full" value={session.user.address ?? ""} disabled />
        </div>
        <div>
          <label className="text-xs">Shipping Info</label>
          <input type="text" className="border rounded px-3 py-2 w-full" value={session.user.shippingInfo ?? ""} disabled />
        </div>
      </form>
    </div>
  );
}
