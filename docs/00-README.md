# bdForms Internal Technical Documentation

Welcome to the internal technical documentation of **bdForms** (Fast-Track Registration Platform SaaS). This documentation is structured for developers and system administrators working on the codebase.

## 📌 Document Index

- **[00-README.md](file:///home/nblauliadka/02_Work/Today/bdForms.id/docs/00-README.md)** (This File)
  High-level overview, architecture index, and developer entry point.
- **[01-architecture.md](file:///home/nblauliadka/02_Work/Today/bdForms.id/docs/01-architecture.md)**
  Framework stack, Next.js App Router directory structure, client-server data flow, and runtime state mapping.
- **[02-database-and-rls.md](file:///home/nblauliadka/02_Work/Today/bdForms.id/docs/02-database-and-rls.md)**
  Database schema design, relationships between tables, indices, Row Level Security (RLS) details, and storage buckets.
- **[03-offline-scanner.md](file:///home/nblauliadka/02_Work/Today/bdForms.id/docs/03-offline-scanner.md)**
  Zustand store-based offline-first architecture, `html5-qrcode` integration, conflict validation, queue retry strategy, camera standby/resume guards, and sub-3-second check-in mechanism.
- **[04-integrations.md](file:///home/nblauliadka/02_Work/Today/bdForms.id/docs/04-integrations.md)**
  Third-party mail integrations (Resend & Brevo), Sentry error monitoring pipeline, and Canvas-based Digital Signature capture.
- **[05-changelog.md](file:///home/nblauliadka/02_Work/Today/bdForms.id/docs/05-changelog.md)**
  Changelog documenting platform changes, feature updates, security patches, and structural modifications.

---

## 🌟 High-Level Technical Summary

**bdForms** is an offline-first event registration and fast-track check-in platform. Designed as a SaaS solution, it empowers organizers to easily create events, customize landing slugs, collect registrations (including custom field data and signatures), and execute high-speed check-ins on-site.

### Core Systems

```
                     ┌──────────────────┐
                     │   bdForms Client │
                     └────────┬─────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │ Supabase Auth│  │ Zustand Store│  │ HTML5 Canvas │
     │  & Database  │  │  (Offline    │  │  Signature   │
     │   (Postgres) │  │   Scanner)   │  │    Capture   │
     └──────────────┘  └──────────────┘  └──────────────┘
            ▲                 ▲                 ▲
            │                 │                 │
            └─────────┬───────┴─────────────────┘
                      ▼
             ┌─────────────────┐
             │ API Routes / TLS│
             └────────┬────────┘
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
    ┌───────────────┐   ┌───────────────┐
    │  Resend/Brevo │   │ Sentry Error  │
    │  Email APIs   │   │  Monitoring   │
    └───────────────┘   └───────────────┘
```

1. **Authentication (Supabase Auth & HTTP-only Cookies):** Handles secure signups and logins using synchronized client/server helpers. Eliminates client-side JWT persistence in localStorage and synchronizes state updates to server session endpoints using secure HTTP-only cookies.
2. **Offline-First Scan Engine (Zustand + HTML5-QR):** Optimizes QR code check-ins by fetching participant records to a local client-side memory store with durable IndexedDB rehydration. Scan analysis occurs locally in $\mathcal{O}(1)$ time. Sync queues handle writes in the background, recovering gracefully from connectivity interruptions using batch check-in RPCs and safe local state merging.
3. **Flexible Event Configurations:** Event organizers can configure customized questionnaires (`custom_fields`), terms of service requirements (`tos_enabled`), document forwarding redirections (`doc_slug` / `doc_url`), and participant quotas.
4. **Third-Party Service Layer:** Transactions are supported by Resend (organizer dashboard details), Brevo (SMTP endpoint for participant tickets with attached QR images), and Sentry (capturing server, edge, and client failures).
