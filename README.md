# Gilnokie Textile Manufacturing System

A modern web-based production management system for textile manufacturing, built to replace a legacy Visual Basic 6 / Microsoft Access system.

## Overview

This system manages the complete production workflow for a knitted fabric manufacturing operation, from customer orders through yarn procurement, knitting production, quality control, packing, and delivery.

### Key Features

- **Customer & Order Management**: Track customer orders, specifications, and delivery requirements
- **Yarn Stock Management**: Monitor yarn inventory, allocations, and consumption
- **Production Tracking**: Record production data with piece-level detail and quality metrics
- **Job Card System**: Comprehensive job management with multi-tab forms (111+ fields)
- **Packing & Delivery**: Generate packing slips and delivery notes
- **Quality Control**: Track quality metrics, defects, and inspections
- **Reporting**: PDF generation for job cards, packing slips, and delivery notes
- **Real-time Dashboard**: Live production statistics and status updates
- **Tablet-Optimized Production Entry**: Shop floor data entry with large touch-friendly interface

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form management with Zod validation
- **TanStack Table** - Advanced data tables

### Backend
- **Supabase** - PostgreSQL database, authentication, and real-time subscriptions
- **Prisma** - Type-safe ORM
- **Next.js API Routes** - RESTful API endpoints

### Additional Features
- **PWA Support** - Progressive Web App for offline capability
- **PDF Generation** - React PDF for reports
- **Dark/Light Theme** - Next Themes for user preference
- **Real-time Updates** - Supabase subscriptions for live data

## Project Structure

```
gilnokie/
├── gilnokie-app/          # Main Next.js application
│   ├── app/               # Next.js App Router pages & API routes
│   ├── components/        # React components
│   ├── lib/               # Utility functions and configurations
│   ├── prisma/            # Database schema and migrations
│   └── public/            # Static assets
├── supabase/              # Supabase local development setup
│   ├── config.toml        # Supabase configuration
│   └── docker/            # Docker compose for local database
├── migration/             # Python scripts for Access DB to Postgres migration
├── docs/                  # Project documentation
│   ├── PROJECT_SETUP_GUIDE.md
│   ├── research-technical-2025-11-11.md
│   └── WORKFLOW_PROPOSAL.md
└── data/                  # Data directories
```

## Database Schema

The system includes 24+ tables covering:

- **Core Entities**: Customers, Employees, Materials
- **Production**: CustomerOrders (Job Cards), Production records, FabricQuality
- **Inventory**: YarnStock, YarnTypes, MaterialTypes
- **Fulfillment**: Packs, PackSlips, DeliveryNotes
- **Reference Data**: MachineSpecifications, SystemSettings, ArchiveJobCards

## Getting Started

### Prerequisites

- **Node.js 20+** (via Homebrew or nvm)
- **Supabase CLI** (for local development)
- **Docker** (for local database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Gilnokie
   ```

2. **Install dependencies**
   ```bash
   cd gilnokie-app
   npm install
   ```

3. **Start local Supabase**
   ```bash
   cd supabase
   supabase start
   ```

4. **Configure environment variables**

   Copy the Supabase connection details from `supabase start` output to `gilnokie-app/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   ```

5. **Run database migrations**
   ```bash
   cd gilnokie-app
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open the application**

   Visit [http://localhost:3000](http://localhost:3000)

### Useful Development Tools

- **Prisma Studio**: Database GUI
  ```bash
  cd gilnokie-app
  npx prisma studio
  ```

- **Supabase Studio**: View at [http://127.0.0.1:54323](http://127.0.0.1:54323)

## Development Status

### Completed Modules (v0.1.0)

- ✅ Authentication system (Supabase Auth)
- ✅ Middleware for route protection
- ✅ Database schema (24+ tables)
- ✅ Responsive layout with sidebar navigation
- ✅ Dashboard with real-time statistics
- ✅ Customer Management (Full CRUD)
- ✅ Yarn Type Management (Full CRUD)
- ✅ Dark/Light theme support
- ✅ Toast notifications

### In Development

- 🔨 Fabric Quality Management
- 🔨 Job Card System (Complex 111-field form with tabs)
- 🔨 Production Entry (Tablet-optimized)
- 🔨 Yarn Stock Management
- 🔨 Packing System
- 🔨 Delivery Management
- 🔨 PDF Report Generation
- 🔨 PWA Configuration

See [docs/PROJECT_SETUP_GUIDE.md](docs/PROJECT_SETUP_GUIDE.md) for detailed setup instructions and architecture overview.

## Migration from Legacy System

This project replaces a Visual Basic 6 application with Microsoft Access database. The `migration/` directory contains Python scripts to extract and transform data from the legacy Access database to the new PostgreSQL schema.

## Contributing

This is a private project for Gilnokie textile manufacturing. For questions or contributions, contact the development team.

## License

Proprietary - All rights reserved.

---

**Version**: 0.1.0
**Last Updated**: November 2024
