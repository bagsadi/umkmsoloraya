import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, Star, Utensils, Shirt, Palette, PartyPopper, Wrench, TrendingUp, ShieldCheck, Users } from "lucide-react";
import UMKMCard from "@/components/UMKMCard";
import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { value: "kuliner", label: "Kuliner", icon: Utensils, image: "https://images.unsplash.com/photo-1539755530862-00f623c00f52?w=400&q=80", desc: "Makanan & Minuman" },
  { value: "fashion", label: "Fashion", icon: Shirt, image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80", desc: "Pakaian & Aksesoris" },
  { value: "handmade", label: "Handmade", icon: Palette, image: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=400&q=80", desc: "Kerajinan Tangan" },
  { value: "jasa_event", label: "Jasa Event", icon: PartyPopper, image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=400&q=80", desc: "Event & Dekorasi" },
  { value: "jasa_otomotif", label: "Jasa Otomotif", icon: Wrench, image: "https://images.unsplash.com/photo-1645445522156-9ac06bc7a767?w=400&q=80", desc: "Bengkel & Perawatan" },
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/umkm?limit=6&sort=rating`).then(res => {
      setFeatured(res.data.items || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <main data-testid="homepage">
      {/* Hero */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="https://static.prod-images.emergentagent.com/jobs/96188705-1cf2-4eba-98e8-383d37a16b05/images/a86e6c101a4029c32d11a43c18955943ea42d4fc7f53faf5bac7541c83f3c634.png"
            alt="UMKM Indonesia"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-green-400 mb-4">
              Direktori UMKM Indonesia
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
              Temukan UMKM <span className="text-green-400">Terbaik</span> di Sekitarmu
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-lg">
              Jelajahi berbagai usaha mikro, kecil, dan menengah dari seluruh Indonesia. Dukung produk lokal, bangun ekonomi bersama.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/daftar">
                <Button data-testid="hero-explore-btn" size="lg" className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 gap-2 text-base h-12 hover:-translate-y-0.5 transition-transform">
                  Jelajahi UMKM
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/daftar">
                <Button data-testid="hero-search-btn" variant="outline" size="lg" className="rounded-xl px-8 gap-2 text-base h-12 border-white/30 text-white hover:bg-white/10 hover:text-white">
                  <Search className="w-4 h-4" />
                  Cari UMKM
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-slate-100" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: "500+", label: "UMKM Terdaftar" },
              { icon: TrendingUp, value: "5", label: "Kategori" },
              { icon: Star, value: "4.5", label: "Rata-rata Rating" },
              { icon: ShieldCheck, value: "100%", label: "Terverifikasi" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-slate-50 py-16 sm:py-20" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-green-600">Kategori</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">Jelajahi Berdasarkan Kategori</h2>
            <p className="text-base text-slate-500 mt-3 max-w-md mx-auto">Pilih kategori yang sesuai dengan kebutuhan Anda</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                to={`/daftar?kategori=${cat.value}`}
                data-testid={`category-${cat.value}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <img src={cat.image} alt={cat.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2">
                    <cat.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-base">{cat.label}</h3>
                  <p className="text-white/70 text-xs mt-0.5">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured UMKM */}
      <section className="py-16 sm:py-20 bg-white" data-testid="featured-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-green-600">Pilihan Terbaik</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 mt-2">UMKM Unggulan</h2>
            </div>
            <Link to="/daftar" className="hidden sm:flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-100 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((item) => (
                <UMKMCard key={item.id} item={item} />
              ))}
            </div>
          )}
          <div className="text-center mt-10 sm:hidden">
            <Link to="/daftar">
              <Button variant="outline" className="rounded-xl gap-2">
                Lihat Semua UMKM <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-16 sm:py-20" data-testid="cta-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">Punya Usaha UMKM?</h2>
          <p className="text-base text-green-100 mb-8 max-w-md mx-auto">Daftarkan usaha Anda sekarang dan jangkau lebih banyak pelanggan melalui platform kami.</p>
          <Link to="/login">
            <Button data-testid="cta-register-btn" size="lg" className="bg-white text-green-700 hover:bg-green-50 rounded-xl px-8 h-12 text-base font-semibold hover:-translate-y-0.5 transition-transform">
              Daftarkan UMKM
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
