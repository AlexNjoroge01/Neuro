"use client";

import { useEffect, useState } from "react";
import ClientNavbar from "@/components/ClientNavbar";
import SidebarLayout from "@/components/Layout";
import { useSession } from "next-auth/react";
import { Globe, Clock, Languages, User, Mail, Phone, MapPin, Package, Shield, Edit, Save, X } from "lucide-react";
import { trpc } from "@/utils/trpc";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const utils = trpc.useUtils();
  const isAdmin =
    status === "authenticated" &&
    (session?.user?.role === "ADMIN" || session?.user?.role === "SUPERUSER");

  const [detectedTimezone, setDetectedTimezone] = useState<string>("");
  const [detectedCountry, setDetectedCountry] = useState<string>("");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("");

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [shippingInfo, setShippingInfo] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      setSaveMessage("Profile updated successfully!");
      setIsEditing(false);
      // Refresh session data
      utils.invalidate();
      setTimeout(() => setSaveMessage(""), 3000);
    },
    onError: (error) => {
      setSaveMessage(`Error: ${error.message}`);
      setTimeout(() => setSaveMessage(""), 3000);
    },
  });

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(tz);

    const lang = navigator.languages?.[0] || navigator.language || "en-US";
    setDetectedLanguage(lang);

    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data && typeof data === "object" && "country_name" in data) {
          setDetectedCountry((data as { country_name: string }).country_name);
        } else {
          setDetectedCountry("Unknown");
        }
      })
      .catch(() => {
        fetch("https://www.cloudflare.com/cdn-cgi/trace")
          .then((res) => res.text())
          .then((text) => {
            const match = text.match(/loc=([A-Z]{2})/);
            if (match) {
              const codeToName: Record<string, string> = {
                US: "United States",
                GB: "United Kingdom",
                DE: "Germany",
                FR: "France",
                CA: "Canada",
                AU: "Australia",
              };
              setDetectedCountry(codeToName[match[1]] || match[1]);
            }
          })
          .catch(() => setDetectedCountry("Unknown"));
      });
  }, []);

  // Initialize form fields when session loads
  useEffect(() => {
    if (session?.user) {
      setPhone(session.user.phone || "");
      setAddress(session.user.address || "");
      setShippingInfo(session.user.shippingInfo || "");
    }
  }, [session]);

  if (status !== "authenticated" || !session?.user) {
    return (
      <div className="flex h-screen items-center justify-center px-6">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600">You must be logged in to view your account.</p>
        </div>
      </div>
    );
  }

  const { name, email, role } = session.user;

  const handleSave = () => {
    updateProfile.mutate({
      phone: phone || undefined,
      address: address || undefined,
      shippingInfo: shippingInfo || undefined,
    });
  };

  const handleCancel = () => {
    // Reset to original values
    setPhone(session.user.phone || "");
    setAddress(session.user.address || "");
    setShippingInfo(session.user.shippingInfo || "");
    setIsEditing(false);
  };

  const accountContent = (
    <div className="max-full mx-auto px-6 bg-secondary rounded-lg mt-4 mb-4 py-12">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-white text-center md:text-left">
          Account Settings
        </h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary font-bold text-secondary rounded-lg hover:bg-primary/90 transition"
          >
            <Edit className="h-4 w-4 text-secondary" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateProfile.isPending ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={updateProfile.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${saveMessage.includes("Error") ? "bg-red-500/20 text-red-200" : "bg-green-500/20 text-green-200"}`}>
          {saveMessage}
        </div>
      )}

      <div className="space-y-8">
        {/* Role Highlight */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-white/80 text-lg font-medium">Your Role</p>
            <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-secondary font-bold text-lg shadow-lg">
              <Shield className="h-6 w-6" />
              {role || "User"}
            </span>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <User className="h-7 w-7 text-primary" />
            Profile Information
          </h2>
          <div className="space-y-7">
            <InfoRow icon={<User className="h-6 w-6 text-primary" />} label="Full Name" value={name ?? "—"} />
            <InfoRow icon={<Mail className="h-6 w-6 text-primary" />} label="Email Address" value={email ?? "—"} />

            {/* Editable Phone */}
            {!isEditing ? (
              <InfoRow icon={<Phone className="h-6 w-6 text-primary" />} label="Phone" value={phone || "Not provided"} />
            ) : (
              <EditableRow
                icon={<Phone className="h-6 w-6 text-primary" />}
                label="Phone"
                value={phone}
                onChange={setPhone}
                placeholder="Enter phone number"
              />
            )}

            {/* Editable Address */}
            {!isEditing ? (
              <InfoRow icon={<MapPin className="h-6 w-6 text-primary" />} label="Address" value={address || "Not provided"} />
            ) : (
              <EditableRow
                icon={<MapPin className="h-6 w-6 text-primary" />}
                label="Address"
                value={address}
                onChange={setAddress}
                placeholder="Enter your address"
              />
            )}

            {/* Editable Shipping Info */}
            {!isEditing ? (
              <InfoRow icon={<Package className="h-6 w-6 text-primary" />} label="Shipping Info" value={shippingInfo || "Not provided"} />
            ) : (
              <EditableRow
                icon={<Package className="h-6 w-6 text-primary" />}
                label="Shipping Info"
                value={shippingInfo}
                onChange={setShippingInfo}
                placeholder="Enter shipping preferences"
              />
            )}
          </div>
        </div>

        {/* Detected Information */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Globe className="h-7 w-7 text-primary" />
            Detected Information
          </h2>
          <div className="space-y-7">
            <InfoRow icon={<Clock className="h-6 w-6 text-primary" />} label="Timezone" value={detectedTimezone || "Detecting..."} />
            <InfoRow icon={<Globe className="h-6 w-6 text-primary" />} label="Country" value={detectedCountry || "Detecting..."} />
            <InfoRow icon={<Languages className="h-6 w-6 text-primary" />} label="Browser Language" value={detectedLanguage || "Detecting..."} />
          </div>
          <p className="mt-8 text-sm text-white/70 italic">
            This data is auto-detected from your device and browser.
          </p>
        </div>
      </div>
    </div>
  );

  if (isAdmin) {
    return (
      <SidebarLayout>
        <div className="overflow-y-auto h-screen bg-white">
          {accountContent}
        </div>
      </SidebarLayout>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ClientNavbar />
      {accountContent}
    </div>
  );
}

// Read-only row component
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-6 py-4 border-b border-white/10 last:border-0">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-white/70 text-sm font-medium">{label}</p>
        <p className="text-white text-lg font-semibold mt-1 truncate">{value}</p>
      </div>
    </div>
  );
}

// Editable row component
function EditableRow({
  icon,
  label,
  value,
  onChange,
  placeholder
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-6 py-4 border-b border-white/10 last:border-0">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-white/70 text-sm font-medium mb-2">{label}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}