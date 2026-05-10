# AGENTS.md

This file provides essential context for AI coding agents working on the Tracker project.

## Project Overview
- **Enterprise Compliance & Certification Management Platform**
- **Frontend:** Next.js 15 (App Router) → `/frontend` (Port: 3000)
- **Backend:** NestJS + TypeScript → `/backend` (Port: 3001)
- **Database:** PostgreSQL via Prisma ORM
- **Security:** JWT + refresh token rotation, Argon2id hashing

## Development Commands
- **Backend Tests:** `cd backend && npm test`
- **Frontend Dev:** `cd frontend && npm run dev`
- **Docker Deployment:** `cd docker && docker-compose up -d`
- **Automated Setup:** `./setup.sh`

## Default Access
- **Admin User:** `admin@tracker.local`
- **Admin Password:** `Admin@123456`

## Architecture Notes
- The backend uses a modular NestJS architecture.
- Frontend uses Tailwind CSS, shadcn/ui, and Framer Motion.
- Data persistence is handled by Prisma Client.
- The `docker/` directory contains all infrastructure configuration.
- Health checks are available at `GET /health` on the backend.
