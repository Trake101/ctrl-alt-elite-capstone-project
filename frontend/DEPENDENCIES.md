# Frontend Dependencies Checklist

## Required Production Dependencies

### Core Framework
- ✅ `next@^14.2.35` - Next.js framework
- ✅ `react@18.3.1` - React library (Next.js peer dependency)
- ✅ `react-dom@18.3.1` - React DOM (Next.js peer dependency)

### Next.js Runtime Dependencies
These are required by Next.js at runtime but not listed as peer dependencies:
- ✅ `styled-jsx@^5.1.7` - Required for Next.js styled-jsx support
- ✅ `@swc/helpers@^0.5.18` - Required for Next.js SWC compilation

### Authentication
- ✅ `@clerk/nextjs@^6.35.5` - Clerk authentication

### UI Components
- ✅ `@radix-ui/react-dialog@^1.1.15` - Dialog component
- ✅ `class-variance-authority@^0.7.1` - Component variant utilities
- ✅ `clsx@^2.1.1` - Class name utilities
- ✅ `lucide-react@^0.555.0` - Icon library
- ✅ `tailwind-merge@^3.4.0` - Tailwind CSS class merging
- ✅ `tailwindcss-animate@^1.0.7` - Tailwind animations

## Required Development Dependencies

### TypeScript
- ✅ `typescript@5.9.3` - TypeScript compiler
- ✅ `@types/node@24.6.1` - Node.js type definitions
- ✅ `@types/react@19.1.16` - React type definitions

### Styling Tools
- ✅ `tailwindcss@^4.1.17` - Tailwind CSS
- ✅ `@tailwindcss/postcss@^4.1.17` - Tailwind PostCSS plugin
- ✅ `postcss@^8.5.6` - PostCSS processor
- ✅ `autoprefixer@^10.4.22` - CSS autoprefixer

## Optional Dependencies (Not Required)

### Next.js Optional Peer Dependencies
- ⚪ `sass@^1.3.0` - Only needed if using Sass/SCSS
- ⚪ `@playwright/test@^1.41.2` - Only needed for E2E testing
- ⚪ `@opentelemetry/api@^1.1.0` - Only needed for OpenTelemetry integration

## Verification

All required dependencies are present in `package.json`. The build completes successfully with all necessary packages.

## Notes

- `styled-jsx` and `@swc/helpers` are not listed in Next.js peerDependencies but are required at runtime
- These must be explicitly added to `dependencies` for production builds
- `depcheck` may flag these as "unused" but they are required by Next.js internally

