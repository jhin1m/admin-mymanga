# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyManga VN Admin Dashboard is a Next.js 15 admin interface built with React 19, TypeScript, and Tailwind CSS v4. It connects to a Laravel API backend and provides complete admin panel functionality including authentication, user management, manga/chapter management, and data visualization.

**Key Features:**
- JWT-based authentication with Laravel API backend
- Protected route system with role-based access
- Real-time data synchronization with API
- Dark/light theme support with localStorage persistence
- Responsive design optimized for admin workflows

## Development Commands

**Essential commands for development:**

```bash
# Install dependencies (uses pnpm as package manager)
pnpm install

# Copy and configure environment file
cp .env.example .env.local
# Edit .env.local to set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev  # or pnpm dev

# Build for production
npm run build  # or pnpm build

# Start production server
npm run start  # or pnpm start

# Run linting
npm run lint  # or pnpm lint
```

## Architecture

### Directory Structure

- `src/app/` - Next.js 15 App Router pages with route groups:
  - `page.tsx` - Public landing page requiring admin authentication
  - `admin/` - Protected admin dashboard with full layout
  - `(admin)/` - Additional admin pages with shared admin layout
  - `(full-width-pages)/` - Authentication and error pages without sidebar
  - `layout.tsx` - Root layout with AuthProvider, ThemeProvider, and SidebarProvider

- `src/components/` - Reusable React components organized by feature:
  - `auth/` - Authentication forms and protected route components
  - `charts/` - ApexCharts integration (bar, line charts)
  - `form/` - Form elements, inputs, switches, multi-select
  - `ui/` - UI components (buttons, modals, tables, alerts, etc.)
  - `tables/` - Data table components with pagination
  - `header/` - Header and navigation components with user management

- `src/layout/` - Layout components:
  - `AppSidebar.tsx` - Collapsible sidebar navigation
  - `AppHeader.tsx` - Top header with authenticated user info and logout
  - `Backdrop.tsx` - Mobile overlay for sidebar

- `src/context/` - React contexts:
  - `AuthContext.tsx` - JWT authentication state management with API integration
  - `ThemeContext.tsx` - Dark/light theme management with localStorage persistence
  - `SidebarContext.tsx` - Sidebar state management

- `src/services/` - API integration:
  - `api.ts` - Centralized API service for Laravel backend communication

### Key Technologies

- **Next.js 15** with App Router and React Server Components
- **React 19** with modern hooks and patterns
- **TypeScript** with strict configuration
- **Tailwind CSS v4** for styling
- **ApexCharts** for data visualization
- **Flatpickr** for date picking
- **React DnD** for drag-and-drop functionality
- **@react-jvectormap** for world maps

### Styling System

- Uses Tailwind CSS v4 with custom configuration
- Dark mode implemented via `dark:` prefixes and ThemeContext
- Custom SVG icon handling via `@svgr/webpack`
- Font: Outfit from Google Fonts

### State Management

- React Context for global state (theme, sidebar)
- Client-side state management with hooks
- Local storage integration for theme persistence

## Development Guidelines

### Authentication System
- JWT tokens stored in localStorage with key `admin_token`
- `AuthContext` provides authentication state globally
- `useAuth()` hook for accessing user data and auth functions
- `ProtectedRoute` component wraps admin pages
- API service handles token refresh and error handling

### API Integration
- Laravel backend API at `localhost:8000/api/admin`
- All endpoints require Bearer token except login
- API responses follow standard format: `{success, data, message, code}`
- CORS headers configured for localhost:3000
- Error handling for 401, 403, 404, 422 responses

### Path Aliases
- Use `@/*` for imports from `src/` directory
- Example: `import { useAuth } from '@/context/AuthContext'`

### Component Patterns
- Most components are client-side ("use client" directive)
- AuthProvider wraps the entire app in root layout
- Responsive design with mobile-first approach
- Dark mode support required for all new components

### Form Handling
- Custom form components in `src/components/form/`
- Multi-select, date picker, and switch components available
- API validation errors displayed inline with form fields
- Loading states during form submission

### Route Structure
- `/` - Public homepage with login requirement
- `/admin` - Protected admin dashboard
- `/signin` - Login page
- `/(admin)/*` - Additional admin pages with shared layout
- All admin routes protected by authentication checks

## Testing and Quality

- ESLint configuration extends `next/core-web-vitals`
- TypeScript strict mode enabled
- No specific test framework configured - check with maintainers before adding tests

## Special Configurations

- SVG files processed through `@svgr/webpack` for React components
- Package overrides for `@react-jvectormap` to handle React 19 compatibility
- PostCSS and Tailwind CSS processing configured
- pnpm as primary package manager (see packageManager field in package.json)