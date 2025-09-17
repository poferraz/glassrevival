# FitTracker - Glass Morphism Fitness Training App

## Overview

FitTracker is a modern fitness training application that combines beautiful glass morphism design with practical workout tracking functionality. The app allows users to upload CSV workout files, organize exercises by training days, and track their progress through an elegant, mobile-first interface. Built with React, TypeScript, and Express, it features a distinctive glass morphism aesthetic inspired by iOS Health and fitness apps.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Components**: Radix UI primitives with custom shadcn/ui styling for consistent, accessible components
- **State Management**: React Query (TanStack Query) for server state management and local React state for UI interactions
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom glass morphism design system

### Design System
- **Theme**: Glass morphism with dark mode as default, light mode support
- **Layout**: Mobile-first responsive design optimized for iPhone 16 Pro
- **Color Palette**: Deep charcoal backgrounds with translucent glass panels using backdrop blur
- **Typography**: System fonts (SF Pro Display) with weight-based hierarchy for fitness data clarity
- **Components**: Custom glass card system with three opacity variants for visual depth

### Backend Architecture
- **Runtime**: Node.js with Express.js for API endpoints
- **Language**: TypeScript with ES modules for consistency across frontend and backend
- **Architecture Pattern**: Simple REST API with middleware-based request handling
- **Development**: Hot reloading with Vite integration in development mode

### Data Processing
- **CSV Parser**: Custom parser following strict specification for workout data normalization
- **Data Validation**: Zod schemas for type-safe data validation and transformation
- **Exercise Prescription Parser**: Complex parsing logic for reps/time ranges, per-side exercises, and multiple units (reps, seconds, steps)
- **Storage**: Browser localStorage for workout data persistence and completed exercise tracking

### Database Layer
- **ORM**: Drizzle ORM configured for PostgreSQL with type-safe query building
- **Database**: PostgreSQL (Neon serverless) for production data persistence
- **Migrations**: Drizzle Kit for schema management and migrations
- **Development**: In-memory storage implementation for rapid prototyping

## External Dependencies

- **Database**: Neon PostgreSQL serverless database for production data storage
- **UI Library**: Radix UI primitives providing accessible, unstyled components
- **Design System**: shadcn/ui component library built on Radix UI with Tailwind styling
- **Icons**: Lucide React for consistent icon set throughout the application
- **Date Handling**: date-fns for workout date formatting and calculations
- **File Processing**: Native File API and FileReader for CSV upload and parsing
- **Query Management**: TanStack React Query for server state management and caching
- **Form Handling**: React Hook Form with Hookform Resolvers for form validation
- **Development Tools**: 
  - Replit development environment integration
  - Vite plugin for runtime error overlay
  - TypeScript for static type checking