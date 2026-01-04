# EVzone Rides Admin (Vite + React + TypeScript + MUI + Tailwind)

This project is a plug-and-play Admin Portal for EVzone Rides & Logistics.

## Tech stack
- Vite + React + TypeScript
- MUI (Material UI)
- Tailwind CSS
- React Router v6

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

### Login
This project uses a **demo localStorage auth** so the team can run the UI immediately.

- Visit `/admin/login`
- Enter any valid email + any password
- The app will mark you as authenticated and route you to `/admin/home`

To sign out, use the **Sign out** button in the top bar.

## Routing
All UI pages come from the attached canvases and are wired in `src/App.tsx`.

Admin area is under `/admin/*` and is protected by a simple `RequireAuth` gate.

## Audit log wiring (demo)
Many pages log actions with:

```js
console.log('AuditLog:', { event: '...', at: new Date().toISOString(), ... })
```

`src/main.tsx` includes a console bridge that captures those events and stores them into
`localStorage` so the **Audit Log** page can show real events from your session.

## Notes
- Mobile responsiveness: the navigation drawer becomes **temporary** on small screens.
- Theme: global light/dark theme is controlled from the shell, stored in localStorage.
- Some attached pages include their own local theme toggles. They still work, but the
  recommended next step is to centralize page theming onto the global provider.

