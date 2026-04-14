import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Store, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Beranda" },
    { to: "/daftar", label: "Daftar UMKM" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header data-testid="header" className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center group-hover:bg-green-700 transition-colors">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">UMKM<span className="text-green-600">Hub</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                data-testid={`nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.to)
                    ? "bg-green-50 text-green-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button data-testid="dashboard-btn" variant="outline" size="sm" className="gap-2 rounded-xl border-green-200 text-green-700 hover:bg-green-50">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button data-testid="logout-btn" variant="ghost" size="sm" onClick={logout} className="gap-2 text-slate-500 hover:text-red-600">
                  <LogOut className="w-4 h-4" />
                  Keluar
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button data-testid="login-btn" size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6">
                  Masuk Admin
                </Button>
              </Link>
            )}
          </div>

          <button
            data-testid="mobile-menu-btn"
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 mt-2 pt-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(link.to) ? "bg-green-50 text-green-700" : "text-slate-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600">Dashboard</Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600">Keluar</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-green-700">Masuk Admin</Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
