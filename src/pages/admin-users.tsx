"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import SidebarLayout from "@/components/Layout";
import { Plus, Mail, Shield, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { z } from "zod";

const createAdminSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a symbol"),
});

type CreateAdminForm = z.infer<typeof createAdminSchema>;

const ITEMS_PER_PAGE = 10;

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState<{ id: string; email: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [editingAdmin, setEditingAdmin] = useState<{ id: string; email: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAdminForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<CreateAdminForm>>({});
  const [creating, setCreating] = useState(false);

  const isSuper = session?.user?.role === "SUPERUSER";

  useEffect(() => {
    if (!isSuper) return;
    fetch("/api/admin-users")
      .then((r) => r.json())
      .then(setAdmins);
  }, [isSuper]);

  const handleChange = (field: keyof CreateAdminForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const result = createAdminSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<CreateAdminForm> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as keyof CreateAdminForm] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create admin");
      }

      const updated = await res.json();
      setAdmins(updated);
      setFormData({ email: "", password: "" });
      setOpen(false);
      toast.success("Admin created successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrors({ password: msg });
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (admin: { id: string; email: string }) => {
    setEditingAdmin(admin);
    setFormData({ email: admin.email, password: "" });
    setOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    if (!validate()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/admin-users", {
        method: "PUT",
        body: JSON.stringify({ id: editingAdmin.id, ...formData }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update admin");
      }

      const updated = await res.json();
      setAdmins(updated);
      setFormData({ email: "", password: "" });
      setEditingAdmin(null);
      setOpen(false);
      toast.success("Admin updated successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrors({ password: msg });
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      const res = await fetch("/api/admin-users", {
        method: "DELETE",
        body: JSON.stringify({ id: deletingId }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete admin");
      }

      const updated = await res.json();
      setAdmins(updated);
      setDeletingId(null);
      toast.success("Admin deleted successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    }
  };

  if (!isSuper) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md border border-gray-200">
          <h2 className="text-xl font-bold mb-3 text-red-600">Access Denied</h2>
          <p className="text-gray-600">This page is only for Superusers.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(admins.length / ITEMS_PER_PAGE);
  const paginated = admins.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
            <p className="text-gray-600 mt-2">Create and manage admin users</p>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                All Admins ({admins.length})
              </h2>
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition"
              >
                <Plus className="h-4 w-4" />
                Add Admin
              </button>
            </div>

            {admins.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No admins yet. Click “Add Admin” to create one.
              </div>
            ) : (
              <>
                {/* Responsive Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginated.map((admin, idx) => (
                        <tr key={admin.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-primary" />
                              </div>
                              <span className="font-medium">{admin.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                              <Shield className="h-3 w-3" />
                              Admin
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(admin)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit admin"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(admin.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete admin"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm text-gray-700">
                      Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
                      {Math.min(page * ITEMS_PER_PAGE, admins.length)} of {admins.length}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Edit/Create Modal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in duration-200">
              <h3 className="text-xl font-semibold mb-4">
                {editingAdmin ? "Edit Admin" : "Create New Admin"}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                The new admin will receive an invitation email.
              </p>

              <form onSubmit={editingAdmin ? handleUpdate : handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="admin@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required={!editingAdmin}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="Min 8 chars • upper • number • symbol"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setEditingAdmin(null);
                      setFormData({ email: "", password: "" });
                      setErrors({});
                    }}
                    className="px-5 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {creating ? (editingAdmin ? "Updating..." : "Creating...") : (editingAdmin ? "Update Admin" : "Create Admin")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4 text-red-600">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this admin? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-5 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Delete Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}