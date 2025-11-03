import ClientNavbar from "@/components/ClientNavbar";
import { useSession } from "next-auth/react";

export default function AccountPage() {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session?.user) {
    return (
      <div className="flex h-screen items-center justify-center text-center px-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 max-w-sm w-full">
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-sm text-gray-600">You must be logged in to view your account.</p>
        </div>
      </div>
    );
  }

  const { name, email, role } = session.user;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Account Settings</h1>

        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100">
          <div className="mb-6">
            <p className="text-sm text-gray-600">Role</p>
            <span className="inline-block mt-1 text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {role}
            </span>
          </div>

          <form className="grid gap-5">
            <FormField label="Name" value={name ?? ""} />
            <FormField label="Email" value={email ?? ""} />
            <FormField label="Phone" value={session.user.phone ?? ""} />
            <FormField label="Address" value={session.user.address ?? ""} />
            <FormField label="Shipping Info" value={session.user.shippingInfo ?? ""} />
          </form>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        disabled
        className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
