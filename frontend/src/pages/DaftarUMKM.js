import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UMKMCard from "@/components/UMKMCard";
import { Search, SlidersHorizontal, X, Utensils, Shirt, Palette, PartyPopper, Wrench, LayoutGrid } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { value: "", label: "Semua Kategori", icon: LayoutGrid },
  { value: "kuliner", label: "Kuliner", icon: Utensils },
  { value: "fashion", label: "Fashion", icon: Shirt },
  { value: "handmade", label: "Handmade", icon: Palette },
  { value: "jasa_event", label: "Jasa Event", icon: PartyPopper },
  { value: "jasa_otomotif", label: "Jasa Otomotif", icon: Wrench },
];

const BADGES = [
  { value: "", label: "Semua Badge" },
  { value: "viral", label: "Viral" },
  { value: "best_seller", label: "Best Seller" },
  { value: "termurah", label: "Termurah" },
];

export default function DaftarUMKM() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const kategori = searchParams.get("kategori") || "";
  const badge = searchParams.get("badge") || "";
  const sort = searchParams.get("sort") || "terbaru";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", "9");
      if (search) params.set("search", search);
      if (kategori) params.set("kategori", kategori);
      if (badge) params.set("badge", badge);
      if (sort) params.set("sort", sort);
      const { data } = await axios.get(`${API}/umkm?${params.toString()}`);
      setItems(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, kategori, badge, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");
    setSearchParams(params);
  };

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParam("search", searchInput);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <main data-testid="daftar-umkm-page" className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Daftar UMKM</h1>
          <p className="text-slate-500">Temukan {total} UMKM terbaik dari berbagai kategori</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                data-testid="search-input"
                placeholder="Cari UMKM..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 rounded-xl h-11 border-slate-200 bg-slate-50 focus:bg-white"
              />
              {searchInput && (
                <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={sort} onValueChange={(v) => updateParam("sort", v)}>
              <SelectTrigger data-testid="sort-select" className="w-full sm:w-44 rounded-xl h-11 border-slate-200">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terbaru">Terbaru</SelectItem>
                <SelectItem value="rating">Rating Tertinggi</SelectItem>
                <SelectItem value="nama">Nama A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Button
              data-testid="filter-toggle-btn"
              variant="outline"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden rounded-xl h-11 gap-2 border-slate-200"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filter */}
          <aside
            data-testid="sidebar-filter"
            className={`${sidebarOpen ? "fixed inset-0 z-40 bg-black/50 lg:relative lg:bg-transparent" : "hidden lg:block"} lg:w-64 flex-shrink-0`}
          >
            <div className={`${sidebarOpen ? "fixed right-0 top-0 bottom-0 w-72 bg-white p-6 shadow-xl overflow-y-auto z-50" : ""} lg:sticky lg:top-24 lg:p-0 lg:shadow-none lg:w-64`}>
              {sidebarOpen && (
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h3 className="font-semibold text-slate-900">Filter</h3>
                  <button onClick={() => setSidebarOpen(false)}>
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-3 uppercase tracking-wide">Kategori</h3>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      data-testid={`filter-kategori-${cat.value || "semua"}`}
                      onClick={() => { updateParam("kategori", cat.value); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        kategori === cat.value
                          ? "bg-green-50 text-green-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <cat.icon className="w-4 h-4 flex-shrink-0" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-3 uppercase tracking-wide">Badge</h3>
                <div className="space-y-1">
                  {BADGES.map((b) => (
                    <button
                      key={b.value}
                      data-testid={`filter-badge-${b.value || "semua"}`}
                      onClick={() => { updateParam("badge", b.value); setSidebarOpen(false); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        badge === b.value
                          ? "bg-green-50 text-green-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 h-80 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Tidak ada UMKM ditemukan</h3>
                <p className="text-slate-500 mb-4">Coba ubah filter atau kata kunci pencarian Anda</p>
                <Button variant="outline" onClick={() => setSearchParams({})} className="rounded-xl">
                  Reset Filter
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <UMKMCard key={item.id} item={item} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div data-testid="pagination" className="flex items-center justify-center gap-2 mt-10">
                    <Button
                      data-testid="pagination-prev"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => updateParam("page", String(page - 1))}
                      className="rounded-lg"
                    >
                      Sebelumnya
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        data-testid={`pagination-page-${p}`}
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateParam("page", String(p))}
                        className={`rounded-lg w-10 ${p === page ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button
                      data-testid="pagination-next"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => updateParam("page", String(page + 1))}
                      className="rounded-lg"
                    >
                      Selanjutnya
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
