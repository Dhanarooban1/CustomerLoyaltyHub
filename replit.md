# LoyaltyBoost - Customer Loyalty Campaign Platform

## Overview

LoyaltyBoost is a full-stack web application for creating and managing customer loyalty campaigns. The platform allows businesses to create campaigns with photo submission requirements and manage customer submissions with approval workflows. It features a React frontend with a shadcn/ui design system and an Express.js backend with PostgreSQL database integration.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Local file system with multer for uploads
- **Session Management**: Built-in Express session handling

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type-safe sharing between frontend and backend
- **Tables**: 
  - `users` - Admin user authentication
  - `campaigns` - Campaign configuration and metadata
  - `submissions` - Customer photo submissions with approval status

## Key Components

### Database Schema
```typescript
// Core tables with relationships
users: { id, username, password }
campaigns: { id, name, description, rewardType, rewardValue, endDate, status, uniqueUrl }
submissions: { id, campaignId, customerName, phone, imageUrl, status }
```

### API Structure
- **RESTful endpoints** under `/api` prefix
- **File uploads** handled via multer middleware
- **Static file serving** for uploaded images
- **Campaign management** CRUD operations
- **Submission processing** with status updates

### Frontend Pages
- **Admin Dashboard** (`/admin`) - Campaign and submission management
- **Customer Form** (`/c/:uniqueUrl`) - Public campaign submission interface
- **404 Page** - Error handling for invalid routes

### Storage Strategy
Implements PostgreSQL database storage (`DatabaseStorage`) using Drizzle ORM with type-safe queries. Database automatically handles data persistence, relationships, and transactions.

## Data Flow

1. **Campaign Creation**: Admin creates campaigns through dashboard interface
2. **Public Access**: Customers access campaigns via unique URLs
3. **Photo Submission**: Customers upload photos with contact information
4. **File Processing**: Images stored locally with metadata in database
5. **Review Workflow**: Admin reviews and approves/rejects submissions
6. **Status Updates**: Real-time updates via React Query invalidation

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL connection driver
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components foundation
- **react-hook-form**: Form state management
- **zod**: Schema validation
- **multer**: File upload handling

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast bundling for production

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev` starts both frontend and backend
- **Port**: Application runs on port 5000
- **Hot Reload**: Vite provides instant updates for frontend changes
- **File Watching**: tsx provides backend restart on changes

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: ESBuild compiles TypeScript server to `dist/index.js`
- **Static Serving**: Express serves built frontend assets
- **Database**: PostgreSQL connection via environment variables

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Auto-deployment**: Configured for autoscale deployment target
- **Port Mapping**: Internal port 5000 mapped to external port 80

## Recent Changes

**June 16, 2025** - Added customer management system and PostgreSQL database:
- Migrated from in-memory storage to PostgreSQL database using Drizzle ORM
- New customers database table with name, phone, email fields
- Customer API endpoints for CRUD operations and bulk CSV import
- Customers tab in admin dashboard with manual entry form
- CSV import functionality with duplicate handling
- Customer search and management interface
- Updated dashboard stats to include customer count
- All data now persists in PostgreSQL for production reliability

## Architecture Updates

### Database Schema
Added `customers` table:
```typescript
customers: { id, name, phone (unique), email, createdAt }
```

### API Endpoints
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create single customer
- `POST /api/customers/bulk` - Bulk import from CSV
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Frontend Features
- Customer management tab with form and CSV upload
- Search functionality across customer database
- Automatic duplicate prevention by phone number
- Clear CSV format instructions for users

## Changelog

Changelog:
- June 16, 2025. Initial setup with customer management system

## User Preferences

Preferred communication style: Simple, everyday language.