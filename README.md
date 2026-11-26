# SkiptoCRM

A modern, responsive Customer Relationship Management (CRM) web application built with React, TypeScript, Vite, Tailwind CSS, Recharts, React Hook Form, and Zod.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Demo Credentials

The application runs in **localStorage demo mode** with realistic pre-seeded CRM data (contacts, companies, leads, deals, tasks, activities, notifications). Any password works for the demo accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@skipto.com` | any (e.g., `demo`) |
| **Manager** | `maria@skipto.com` | any (e.g., `demo`) |
| **Sales Rep** | `james@skipto.com` | any (e.g., `demo`) |

## Implemented Modules

- **Authentication**: Demo login with role-based profiles (`admin`, `manager`, `sales_rep`), password visibility toggle, and protected routes.
- **Dashboard**: Real-time summary cards (Contacts, Companies, Leads, Active Deals, Total Revenue, Conversion Rate), Monthly Revenue bar chart, Leads by Status pie chart, Deal Pipeline progress bars, and recent records feeds.
- **Contacts & Contact Detail**: Full CRUD, search, status/company filters, duplicate email check, pagination, CSV export, and detailed contact view with related deals, tasks, and activity timeline.
- **Companies**: Card grid view with full CRUD, search, industry classification, revenue/employee stats, and pagination.
- **Leads**: Full CRUD, search, status/priority filters, one-click Lead Conversion (creates Contact + Deal without duplicating existing contacts), and CSV export.
- **Deals & Sales Pipeline**: List view + Kanban-style Sales Pipeline board across 6 stages (`new`, `qualification`, `proposal`, `negotiation`, `won`, `lost`) with stage movement and automatic probability/revenue updates.
- **Tasks & Activities**: Task management with overdue detection, priority/status filters, one-click completion toggle, and chronological Activity timeline (`call`, `meeting`, `email`, `note`, `follow_up`).
- **Reports & Analytics**: Recharts visualizations (Monthly Revenue Trend, Leads by Status, Deals by Stage, Won vs Lost Deals), pipeline summary table, and CSV report export.
- **Settings**: Profile editing, change password UI, and notification preference toggles.

## Architecture Notes

- All data access is encapsulated in `src/services/*` backed by `src/data/storage.ts` (`localStorage`).
- No backend server is included in this repository; services can be swapped to Axios REST calls against a Spring Boot / PostgreSQL backend without changing UI components.

