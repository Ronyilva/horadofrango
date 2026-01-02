# Hora do Frango - Gestão Pro

## Overview
A financial management dashboard application built with React, TypeScript, and Vite. The app provides tools for tracking finances including income, expenses, credit management ("fiados"), and cash flow forecasting.

## Project Structure
- `App.tsx` - Main application component with routing
- `Dashboard.tsx` - Main dashboard with financial overview
- `Transactions.tsx` - Transaction management
- `Fiados.tsx` - Credit/fiados management
- `Forecast.tsx` - Financial forecasting
- `Settings.tsx` - Application settings
- `components/` - Reusable UI components (StatCard, Table)
- `store.ts` - State management
- `types.ts` - TypeScript type definitions
- `utils.ts` - Utility functions
- `constants.tsx` - Application constants

## Tech Stack
- React 19
- TypeScript
- Vite
- Recharts (for charts)
- Tailwind CSS (via CDN)

## Development
- Run: `npm run dev` (port 5000)
- Build: `npm run build`

## Deployment
- Static deployment with Vite build
- Output directory: `dist`
