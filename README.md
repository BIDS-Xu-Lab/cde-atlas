# CDE Atlas

An interactive visualization tool for exploring Common Data Elements (CDEs). Browse CDEs across organizations and years through a 3D point cloud map, a network graph, or a searchable table.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open http://localhost:5173 in your browser.

## Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

## Views

- **Map** (`/`) — 3D point cloud of CDEs, colored by organization
- **Network** (`/network`) — Network graph of CDE relationships
- **Table** (`/table`) — Searchable, filterable table of all CDEs

Use the header controls to filter by year range, search by keyword, or toggle organizations on/off.
