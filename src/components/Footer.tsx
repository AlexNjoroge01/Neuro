"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white border-t border-border mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand Info */}
        <div>
          <h2 className="text-xl font-bold text-primary mb-3">Dukafiy</h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Your go-to hub for premium tech, sleek design, and unmatched shopping
            experience. We don’t just sell products — we sell vibes.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-primary mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/" className="hover:text-primary transition">Home</Link></li>
            <li><Link href="/shop" className="hover:text-primary transition">Shop</Link></li>
            <li><Link href="/about" className="hover:text-primary transition">About</Link></li>
            <li><Link href="/contact" className="hover:text-primary transition">Contact</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-primary mb-3">Contact</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Nairobi, Kenya
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> +254 700 123 456
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> support@neuro.co.ke
            </li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h3 className="text-lg font-semibold text-primary mb-3">Follow Us</h3>
          <div className="flex gap-4 text-white/80">
            <Link href="#" className="hover:text-primary transition"><Facebook className="h-5 w-5" /></Link>
            <Link href="#" className="hover:text-primary transition"><Twitter className="h-5 w-5" /></Link>
            <Link href="#" className="hover:text-primary transition"><Instagram className="h-5 w-5" /></Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border py-4 text-center text-sm text-white/70">
        © {new Date().getFullYear()} <span className="text-primary font-semibold">Dukafiy</span>. All rights reserved.
      </div>

      <div className="py-4 text-center text-sm">
         <span className="text-primary font-semibold">Developed by BrightLine Labs</span>.
         <br/>
         <span className="text-white/70 font-semibold">Contact us at clientcare.global@gmail.com</span>.
         <br/>
          <span className="text-white/70 font-semibold">Or call our Office Number: 0716090099</span>.
      </div>
    </footer>
  );
}
