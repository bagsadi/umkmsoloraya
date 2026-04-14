import React from "react";
import { Star } from "lucide-react";

const BADGE_CONFIG = {
  viral: { label: "Viral", className: "bg-orange-500 text-white" },
  best_seller: { label: "Best Seller", className: "bg-orange-600 text-white" },
  termurah: { label: "Termurah", className: "bg-amber-500 text-white" },
};

const KATEGORI_LABELS = {
  kuliner: "Kuliner",
  fashion: "Fashion",
  handmade: "Handmade",
  jasa_event: "Jasa Event",
  jasa_otomotif: "Jasa Otomotif",
};

export default function UMKMCard({ item }) {
  return (
    <div
      data-testid={`umkm-card-${item.id}`}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
    >
      <div className="relative overflow-hidden">
        <img
          src={item.image_url || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600"}
          alt={item.nama}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600"; }}
        />
        {item.badges && item.badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {item.badges.map((badge) => {
              const config = BADGE_CONFIG[badge];
              if (!config) return null;
              return (
                <span
                  key={badge}
                  data-testid={`badge-${badge}`}
                  className={`${config.className} font-bold px-2.5 py-1 rounded-md text-xs uppercase tracking-wide shadow-sm`}
                >
                  {config.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase text-green-600">
            {KATEGORI_LABELS[item.kategori] || item.kategori}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-slate-700">{item.rating?.toFixed(1) || "0.0"}</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-1.5 line-clamp-1">{item.nama}</h3>
        <p className="text-sm text-slate-500 mb-3 line-clamp-2 leading-relaxed">{item.deskripsi}</p>

        {item.harga_range && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-sm font-medium text-green-600">{item.harga_range}</span>
          </div>
        )}
      </div>
    </div>
  );
}
