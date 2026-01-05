# TaskMaster Pro

## Overview

TaskMaster Pro is a full-stack task management application with focus timer functionality, built using React frontend and Express backend. The app allows users to create, track, and complete tasks with priority scoring, time estimation, and productivity analytics. It supports both anonymous usage with local storage and authenticated users via Firebase Authentication, with data persisted to MongoDB.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Charts**: Recharts for data visualization and analytics dashboards

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with JSON request/response format
- **Session Management**: In-memory session store with express-session
- **Rate Limiting**: Custom middleware to prevent API abuse
- **Logging**: Custom logger with configurable log levels

### Data Storage Solutions
- **Primary Database**: MongoDB Atlas (cloud-hosted) with collections for Tasks, Archive, Later Tasks, and TimeEntries
- **Fallback Storage**: In-memory storage when MongoDB is unavailable
- **Anonymous Users**: localStorage on client-side for task persistence without authentication
- **Schema Definition**: Drizzle ORM schema in `shared/schema.ts` (PostgreSQL compatible, used for type definitions)

### Authentication System
- **Provider**: Firebase Authentication for user management
- **Token Verification**: Server-side JWT verification via Firebase Admin SDK
- **Anonymous Support**: Users can use the app without signing up; tasks stored locally and synced on authentication
- **Middleware**: Custom auth middleware that gracefully handles anonymous users

### Build and Development
- **Development**: `npm run dev` runs the Express server with tsx for TypeScript execution
- **Production Build**: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.js`
- **Database Migrations**: Drizzle Kit for schema management (`npm run db:push`)

### Key Design Patterns
- **Shared Schema**: Types and validation schemas shared between frontend and backend via `@shared/*` path alias
- **Optimistic Updates**: React Query mutations update UI immediately before server confirmation
- **PWA Support**: Service worker for offline capability and app installation
- **Responsive Design**: Mobile-first approach with keyboard-aware input handling

## External Dependencies

### Database
- **MongoDB Atlas**: Primary data storage using the native MongoDB driver
- **Connection String**: Configured via `MONGODB_URI` environment variable
- **Collections**: Tasks, Archive, Later Tasks, TimeEntries

### Authentication
- **Firebase Authentication**: Email/password authentication
- **Firebase Admin SDK**: Server-side token verification
- **Configuration**: Firebase config in `client/src/lib/firebase-config.js`, admin setup in `server/firebase-admin.js`

### Deployment
- **Render.com**: Configured for deployment with `render-build` script
- **Environment Variables Required**:
  - `MONGODB_URI`: MongoDB connection string
  - `DATABASE_URL`: PostgreSQL connection (for Drizzle, may not be actively used)
  - Firebase configuration variables (optional, has defaults)

### Third-Party Libraries
- **UI**: Radix UI primitives, Lucide icons, embla-carousel, vaul (drawer), cmdk (command palette)
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Utilities**: clsx, tailwind-merge for class management