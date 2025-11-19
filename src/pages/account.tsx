"use client";

import { useEffect, useState } from "react";
import ClientNavbar from "@/components/ClientNavbar";
import { useSession } from "next-auth/react";
import { Globe, Clock, Languages, User, Mail, Phone, MapPin, Package, Shield } from "lucide-react";

export default function AccountPage() {
  const { data: session, status } = useSession();

  const [detectedTimezone, setDetectedTimezone] = useState<string>("");
  const [detectedCountry, setDetectedCountry] = useState<string>("");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("");

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

  const { name, email, role, phone, address, shippingInfo } = session.user;

  return (
    <div className="min-h-screen bg-white"> {/* Dark/rich secondary background */}
      <ClientNavbar />

      <div className="max-w-4xl mx-auto px-6 bg-secondary rounded-lg mt-4 mb-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-10 text-center md:text-left">
          Account Settings
        </h1>

        <div className="space-y-8">
          {/* Role Highlight */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-white/80 text-lg font-medium">Your Role</p>
              <span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-white font-bold text-lg shadow-lg">
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
              <InfoRow icon={<Phone className="h-6 w-6 text-primary" />} label="Phone" value={phone ?? "Not provided"} />
              <InfoRow icon={<MapPin className="h-6 w-6 text-primary" />} label="Address" value={address ?? "Not provided"} />
              <InfoRow icon={<Package className="h-6 w-6 text-primary" />} label="Shipping Info" value={shippingInfo ?? "Not provided"} />
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
    </div>
  );
}

// Beautiful, consistent row with primary icon pop
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