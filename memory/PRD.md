# UMKM Directory Website - PRD

## Problem Statement
Website direktori UMKM Indonesia lengkap dengan dashboard admin, daftar UMKM dengan card UI + badge + rating, sidebar filter kategori, search realtime, pagination, dan login admin.

## Architecture
- **Backend**: FastAPI + MongoDB + Object Storage (Emergent)
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Auth**: JWT (cookies + Bearer token + localStorage)
- **Database**: MongoDB (test_database)

## User Personas
1. **Admin**: Mengelola data UMKM (CRUD), upload gambar, set badge & rating
2. **Pengunjung**: Melihat daftar UMKM, mencari, filter, melihat detail

## Core Requirements
- Homepage dengan hero, featured UMKM, kategori
- Halaman Daftar UMKM dengan search, filter, pagination
- Admin login & dashboard
- CRUD UMKM (nama, kategori, deskripsi, alamat, telepon, harga, rating, badges, gambar)
- 5 Kategori: Kuliner, Fashion, Handmade, Jasa Event, Jasa Otomotif
- 3 Badge: Viral, Best Seller, Termurah
- Image upload via Object Storage

## What's Been Implemented (Feb 2026)
- [x] Homepage (hero, stats, categories, featured UMKM, CTA)
- [x] Daftar UMKM page (cards, search, filter, pagination)
- [x] Admin login page
- [x] Admin dashboard (stats, table, add/edit/delete UMKM)
- [x] Image upload to Object Storage
- [x] JWT authentication with localStorage + cookies
- [x] 12 demo UMKM entries seeded
- [x] Responsive design with Poppins font
- [x] Green theme with orange badges, amber ratings

## Prioritized Backlog
### P0 (Done)
- Full CRUD UMKM
- Auth admin
- Search, filter, pagination

### P1
- Detail UMKM page (click card → full detail)
- Image gallery per UMKM
- Admin can manage multiple images

### P2
- Statistik dashboard lebih detail (chart)
- Export data UMKM
- Multi-admin support
- WhatsApp integration (click to chat)

## Test Credentials
- Admin: admin@umkm.com / admin123
