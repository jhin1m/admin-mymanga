# 🧭 MyManga VN Admin Dashboard

Modern admin dashboard for **MyManga VN**, built with **Next.js 15**, **React 19**, **TypeScript**, and **TailAdmin**.

---

## ✨ Features

* 🔐 JWT Auth (Laravel backend)
* 👥 User / Role / Permission management
* 📚 Manga, chapter, tag, and author management
* 💬 Comment & reply system
* 📢 Announcement management
* 📊 Dashboard analytics (ApexCharts)
* 🌓 Dark / Light theme
* 📱 Responsive layout

---

## 🧰 Tech Stack

**Next.js 15**, **React 19**, **TypeScript**, **Tailwind v4**, **TailAdmin**,
**ApexCharts**, **Flatpickr**, **React DnD**, **@react-jvectormap**

---

## 🚀 Setup

```bash
# Prerequisites
Node.js 18+, pnpm, Laravel API (localhost:8000)

# 1. Clone & install
git clone https://github.com/jhin1m/admin-mymanga
cd admin-mymanga
pnpm install

# 2. Config .env
cp .env.example .env.local
# set NEXT_PUBLIC_API_URL=http://localhost:8000

# 3. Run dev
pnpm dev
```

Visit → [http://localhost:3000](http://localhost:3000)

Build:

```bash
pnpm build && pnpm start
```

---

## 📁 Structure

```
src/
├─ app/          # App Router pages (admin, auth, etc.)
├─ components/   # UI & form components
├─ context/      # Auth, Theme, Sidebar
├─ layout/       # Header, Sidebar, Layout
└─ services/     # API integration
```

---

## 🔑 Auth & API

* JWT stored in `localStorage` (`admin_token`)
* Base URL: `http://localhost:8000/api/admin`
* Role-based access control
* Handles 401 / 403 / 404 / 422

---

## 🧭 Dev Notes

* Use `@/*` path alias
* Most components are client-side
* Tailwind + ThemeContext for styling
* Font: **Outfit (Google Fonts)**

---

## 🧪 Scripts

```bash
pnpm dev      # Dev server
pnpm build    # Build
pnpm start    # Production
pnpm lint     # Lint check
```
---

## 📝 To Do
- [ ] Error report page
- [ ] Edit chapter by URL list
- [ ] View field edit in Manga table
- [ ] Rating field in Manga table
- [ ] Better users management (banned users, delete comments, permissions etc.)

---

## 💳 Credits & License

Built on **TailAdmin**.
© Proprietary software – for **MyManga VN** only.