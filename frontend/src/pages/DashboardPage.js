import React, { useState, useEffect, useCallback } from "react";
import { useAuth, getAuthHeaders } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Store, Plus, Pencil, Trash2, Upload, LogOut, Home, LayoutDashboard,
  Star, TrendingUp, Search, BarChart3
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { value: "kuliner", label: "Kuliner" },
  { value: "fashion", label: "Fashion" },
  { value: "handmade", label: "Handmade" },
  { value: "jasa_event", label: "Jasa Event" },
  { value: "jasa_otomotif", label: "Jasa Otomotif" },
];

const BADGE_OPTIONS = [
  { value: "viral", label: "Viral" },
  { value: "best_seller", label: "Best Seller" },
  { value: "termurah", label: "Termurah" },
];

const KATEGORI_LABELS = {
  kuliner: "Kuliner",
  fashion: "Fashion",
  handmade: "Handmade",
  jasa_event: "Jasa Event",
  jasa_otomotif: "Jasa Otomotif",
};

const emptyForm = {
  nama: "", kategori: "kuliner", deskripsi: "", alamat: "", telepon: "",
  harga_range: "", rating: 0, badges: [], image_url: "",
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total_umkm: 0, kategori_stats: {} });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getAuthConfig = useCallback(() => ({
    withCredentials: true,
    headers: { ...getAuthHeaders() },
  }), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const config = getAuthConfig();
      const umkmRes = await axios.get(`${API}/umkm?limit=100`, config);
      setItems(umkmRes.data.items || []);
      try {
        const statsRes = await axios.get(`${API}/stats`, config);
        setStats(statsRes.data);
      } catch {
        setStats({ total_umkm: umkmRes.data.total || 0, kategori_stats: {} });
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [getAuthConfig]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      nama: item.nama || "",
      kategori: item.kategori || "kuliner",
      deskripsi: item.deskripsi || "",
      alamat: item.alamat || "",
      telepon: item.telepon || "",
      harga_range: item.harga_range || "",
      rating: item.rating || 0,
      badges: item.badges || [],
      image_url: item.image_url || "",
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axios.post(`${API}/upload`, formData, {
        ...getAuthConfig(),
        headers: { ...getAuthConfig().headers, "Content-Type": "multipart/form-data" },
      });
      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}/api/files/${data.path}`;
      setForm(prev => ({ ...prev, image_url: imageUrl }));
      toast.success("Gambar berhasil diupload");
    } catch (err) {
      toast.error("Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.kategori || !form.deskripsi) {
      toast.error("Nama, Kategori, dan Deskripsi wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nama: form.nama,
        kategori: form.kategori,
        deskripsi: form.deskripsi,
        alamat: form.alamat || "",
        telepon: form.telepon || "",
        harga_range: form.harga_range || "",
        rating: parseFloat(form.rating) || 0,
        badges: form.badges || [],
        image_url: form.image_url || "",
      };
      const config = { ...getAuthConfig(), headers: { ...getAuthConfig().headers, "Content-Type": "application/json" } };
      if (editingItem) {
        await axios.put(`${API}/umkm/${editingItem.id}`, payload, config);
        toast.success("UMKM berhasil diperbarui");
      } else {
        await axios.post(`${API}/umkm`, payload, config);
        toast.success("UMKM berhasil ditambahkan");
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Gagal menyimpan UMKM");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await axios.delete(`${API}/umkm/${deleteItem.id}`, getAuthConfig());
      toast.success("UMKM berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeleteItem(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal menghapus UMKM");
    }
  };

  const toggleBadge = (badgeValue) => {
    setForm(prev => ({
      ...prev,
      badges: prev.badges.includes(badgeValue)
        ? prev.badges.filter(b => b !== badgeValue)
        : [...prev.badges, badgeValue]
    }));
  };

  const filteredItems = items.filter(item =>
    item.nama?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-testid="dashboard-page" className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed top-0 left-0 bottom-0">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">UMKM<span className="text-green-600">Hub</span></span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <div className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </div>
          <Link to="/" className="px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-colors">
            <Home className="w-4 h-4" />
            Beranda
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name || "Admin"}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <Button data-testid="sidebar-logout-btn" variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2 text-slate-500 hover:text-red-600 rounded-lg text-sm">
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Top bar mobile */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">UMKM<span className="text-green-600">Hub</span></span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Kelola semua data UMKM Anda</p>
            </div>
            <Button data-testid="add-umkm-btn" onClick={handleOpenAdd} className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2 h-10">
              <Plus className="w-4 h-4" />
              Tambah UMKM
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.total_umkm || items.length}</div>
              <div className="text-sm text-slate-500">Total UMKM</div>
            </div>
            {CATEGORIES.map((cat) => {
              const count = stats.kategori_stats?.[cat.value] || items.filter(i => i.kategori === cat.value).length;
              return (
                <div key={cat.value} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{count}</div>
                  <div className="text-sm text-slate-500">{cat.label}</div>
                </div>
              );
            }).slice(0, 3)}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Daftar UMKM</h2>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  data-testid="dashboard-search-input"
                  placeholder="Cari UMKM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl h-9 border-slate-200"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">Memuat data...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold">Nama</TableHead>
                      <TableHead className="font-semibold">Kategori</TableHead>
                      <TableHead className="font-semibold">Rating</TableHead>
                      <TableHead className="font-semibold">Badge</TableHead>
                      <TableHead className="font-semibold">Harga</TableHead>
                      <TableHead className="font-semibold text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                          Belum ada data UMKM
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id} data-testid={`table-row-${item.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image_url || "https://via.placeholder.com/40"}
                                alt={item.nama}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/40"; }}
                              />
                              <div>
                                <div className="font-medium text-slate-900 text-sm">{item.nama}</div>
                                <div className="text-xs text-slate-400 line-clamp-1">{item.alamat}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                              {KATEGORI_LABELS[item.kategori] || item.kategori}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-sm">{item.rating?.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.badges?.map(b => (
                                <span key={b} className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                                  {b === "best_seller" ? "Best Seller" : b === "termurah" ? "Termurah" : "Viral"}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{item.harga_range || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                data-testid={`edit-btn-${item.id}`}
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(item)}
                                className="h-8 w-8 text-slate-500 hover:text-green-600"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                data-testid={`delete-btn-${item.id}`}
                                variant="ghost"
                                size="icon"
                                onClick={() => { setDeleteItem(item); setDeleteDialogOpen(true); }}
                                className="h-8 w-8 text-slate-500 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit UMKM" : "Tambah UMKM Baru"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Perbarui informasi UMKM" : "Isi informasi UMKM yang ingin ditambahkan"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama UMKM *</Label>
                <Input
                  id="nama"
                  data-testid="form-nama-input"
                  value={form.nama}
                  onChange={(e) => setForm(p => ({ ...p, nama: e.target.value }))}
                  placeholder="Nama usaha"
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select value={form.kategori} onValueChange={(v) => setForm(p => ({ ...p, kategori: v }))}>
                  <SelectTrigger data-testid="form-kategori-select" className="rounded-xl">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi *</Label>
              <textarea
                id="deskripsi"
                data-testid="form-deskripsi-input"
                value={form.deskripsi}
                onChange={(e) => setForm(p => ({ ...p, deskripsi: e.target.value }))}
                placeholder="Deskripsi singkat tentang usaha..."
                required
                rows={3}
                className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Input
                  id="alamat"
                  data-testid="form-alamat-input"
                  value={form.alamat}
                  onChange={(e) => setForm(p => ({ ...p, alamat: e.target.value }))}
                  placeholder="Alamat lengkap"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telepon">Telepon</Label>
                <Input
                  id="telepon"
                  data-testid="form-telepon-input"
                  value={form.telepon}
                  onChange={(e) => setForm(p => ({ ...p, telepon: e.target.value }))}
                  placeholder="08xxxxxxxxxx"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="harga_range">Range Harga</Label>
                <Input
                  id="harga_range"
                  data-testid="form-harga-input"
                  value={form.harga_range}
                  onChange={(e) => setForm(p => ({ ...p, harga_range: e.target.value }))}
                  placeholder="Rp 10.000 - Rp 50.000"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input
                  id="rating"
                  data-testid="form-rating-input"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => setForm(p => ({ ...p, rating: parseFloat(e.target.value) || 0 }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Badges */}
            <div className="space-y-2">
              <Label>Badge</Label>
              <div className="flex flex-wrap gap-2">
                {BADGE_OPTIONS.map(b => (
                  <button
                    key={b.value}
                    type="button"
                    data-testid={`form-badge-${b.value}`}
                    onClick={() => toggleBadge(b.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      form.badges.includes(b.value)
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Gambar</Label>
              <div className="flex gap-3">
                <Input
                  data-testid="form-image-url-input"
                  value={form.image_url}
                  onChange={(e) => setForm(p => ({ ...p, image_url: e.target.value }))}
                  placeholder="URL gambar atau upload file"
                  className="rounded-xl flex-1"
                />
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div data-testid="form-upload-btn" className="h-9 px-3 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors">
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload
                  </div>
                </label>
              </div>
              {form.image_url && (
                <div className="mt-2 relative w-32 h-24 rounded-xl overflow-hidden border border-slate-200">
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                Batal
              </Button>
              <Button
                data-testid="form-submit-btn"
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
              >
                {submitting ? "Menyimpan..." : editingItem ? "Perbarui" : "Tambahkan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus UMKM</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deleteItem?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">
              Batal
            </Button>
            <Button
              data-testid="confirm-delete-btn"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
