"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import SidebarLayout from "@/components/Layout";
import { Plus, Mail, Lock, Shield, Edit2, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { z } from "zod";

const createAdminSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
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
  const [showPassword, setShowPassword] = useState(false);
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
        const path = issue.path[0] as keyof CreateAdminForm;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error(result.error.issues[0].message);
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
      setShowPassword(false);
      setOpen(false);
      toast.success("Admin created successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (admin: { id: string; email: string }) => {
    setEditingAdmin(admin);
    setFormData({ email: admin.email, password: "" });
    setShowPassword(false);
    setOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    // When editing, password is optional → only validate if provided
    const passwordToValidate = formData.password.trim() === "" ? "Temp123!" : formData.password;
    const result = createAdminSchema.safeParse({ ...formData, password: passwordToValidate });

    if (!result.success) {
      const fieldErrors: Partial<CreateAdminForm> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof CreateAdminForm;
        if (path === "password" && formData.password.trim() === "") return; // skip password error if empty on edit
        fieldErrors[path] = issue.message;
      });
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        toast.error(result.error.issues[0].message);
        return;
      }
    }

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
      setShowPassword(false);
      setEditingAdmin(null);
      setOpen(false);
      toast.success("Admin updated successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
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
          <div className="bg-secondary rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-primary">
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
                    <thead className="bg-secondary border-b border-secondary">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary">
                      {paginated.map((admin, idx) => (
                        <tr key={admin.id}>
                          <td className="px-6 py-4 text-sm text-white">
                            {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-primary" />
                              </div>
                              <span className="font-medium text-primary">{admin.email}</span>
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

              <form onSubmit={editingAdmin ? handleUpdate : handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      className={`w-full pl-11 pr-4 py-3.5 bg-gray-100/10 border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition ${
                        errors.email ? "border-red-500" : "border-input"
                      }`}
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      required
                      disabled={creating}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-600 mt-1.5">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Password {editingAdmin ? "(leave blank to keep current)" : <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      className={`w-full pl-11 pr-12 py-3.5 bg-gray-100/10 border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition ${
                        errors.password ? "border-red-500" : "border-input"
                      }`}
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 chars • upper • lower • number • symbol"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      required={!editingAdmin}
                      disabled={creating}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      disabled={creating}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-600 mt-1.5">{errors.password}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setEditingAdmin(null);
                      setFormData({ email: "", password: "" });
                      setShowPassword(false);
                      setErrors({});
                    }}
                    className="px-5 py-2.5 border border-input rounded-md font-medium hover:bg-accent transition"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-70"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {editingAdmin ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>{editingAdmin ? "Update Admin" : "Create Admin"}</>
                    )}
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