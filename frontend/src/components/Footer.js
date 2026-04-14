import React from "react";
import { Link } from "react-router-dom";
import { Store, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const categories = [
    { label: "Kuliner", value: "kuliner" },
    { label: "Fashion", value: "fashion" },
    { label: "Handmade", value: "handmade" },
    { label: "Jasa Event", value: "jasa_event" },
    { label: "Jasa Otomotif", value: "jasa_otomotif" },
  ];

  return (
    <footer data-testid="footer" className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">UMKM<span className="text-green-400">Hub</span></span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Platform direktori UMKM Indonesia. Temukan dan dukung usaha mikro, kecil, dan menengah di sekitar Anda.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Kategori</h4>
            <ul className="space-y-2.5">
              {categories.map((cat) => (
                <li key={cat.value}>
                  <Link to={`/daftar?kategori=${cat.value}`} className="text-sm text-slate-400 hover:text-green-400 transition-colors">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Navigasi</h4>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-sm text-slate-400 hover:text-green-400 transition-colors">Beranda</Link></li>
              <li><Link to="/daftar" className="text-sm text-slate-400 hover:text-green-400 transition-colors">Daftar UMKM</Link></li>
              <li><Link to="/login" className="text-sm text-slate-400 hover:text-green-400 transition-colors">Admin Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Kontak</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-green-500 flex-shrink-0" />
                info@umkmhub.id
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                +62 812 3456 7890
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                Jakarta, Indonesia
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} UMKMHub. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
