# Database Schema & Row Level Security (RLS)

This document breaks down the PostgreSQL tables, column types, relationship references, and storage policies configured inside Supabase.

---

## 📊 Database Schema

While `schema.sql` bootstrap script initializes core structures, the runtime application references extended columns to support package logic, custom fields, and profile customization.

### 1. `events` Table
Stores high-level configurations, customization preferences, and administrative state for individual events.

| Column Name | Data Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `primary key`, `default gen_random_uuid()` | Unique event identifier. |
| `name` | `text` | `not null` | Name of the event. |
| `created_at` | `timestamptz` | `default now()` | Timestamp when the event record was created. |
| `event_date` | `timestamptz` | `nullable` | Scheduled date of the event. |
| `event_end` | `timestamptz` | `nullable` | Scheduled ending time of the event. |
| `registration_deadline`| `timestamptz` | `nullable` | Cutoff timestamp for registrations. |
| `location` | `text` | `nullable` | Physical or virtual location details. |
| `expected_participants`| `integer` | `nullable` | Participant ceiling count (based on purchased tier). |
| `banner_url` | `text` | `nullable` | URL pointing to the event banner image in storage. |
| `field_config` | `jsonb` | `nullable` | Toggles for phone, institution, and position fields. |
| `custom_fields` | `jsonb` | `nullable` | Custom questionnaire configurations. |
| `package_type` | `text` | `nullable` | Tier package ('starter', 'standard', 'pro', etc.). |
| `package_status` | `text` | `nullable` | Status of validation ('active', 'pending_payment'). |
| `owner_id` | `uuid` | `nullable` | Links to the user ID of the event organizer. |
| `slug` | `text` | `unique`, `nullable` | Custom URL registration path. |
| `whatsapp_group_url` | `text` | `nullable` | WhatsApp group link for registered attendees. |
| `tos_enabled` | `boolean` | `default false` | Enforces Terms of Service agreement checkbox. |
| `tos_text` | `text` | `nullable` | Custom Terms of Service markdown or text content. |
| `doc_slug` | `text` | `nullable` | Unique slug used to forward files/assets. |
| `doc_url` | `text` | `nullable` | Redirection target URL for document forwarders. |
| `email_required` | `boolean` | `default false` | Determines if email input is mandatory. |
| `status` | `text` | `default 'active'` | Operational status of the event ('active', 'closed'). |
| `scanner_token` | `text` | `nullable` | Access token for validation scanners. |
| `scanner_token_expires_at`| `timestamptz`| `nullable` | Scanner access token expiration. |

---

### 2. `participants` Table
Houses all registered user listings, check-in data, signatures, and input answers.

| Column Name | Data Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `primary key`, `default gen_random_uuid()` | Unique participant identifier. |
| `event_id` | `uuid` | `references events(id) on delete cascade` | Foreign key referencing the parent event. |
| `name` | `text` | `not null` | Real name of the attendee. |
| `email` | `text` | `nullable` | Email address of the attendee. |
| `signature_url` | `text` | `nullable` | **JPEG Base64 string** (quality 0.3) containing the digitised sign (saved directly as text). |
| `qr_token` | `text` | `unique`, `default gen_random_uuid()::text` | Unique text-cast UUID representing the QR ticket. |
| `is_checked_in` | `boolean` | `default false` | Boolean status indicating checked-in/absent state. |
| `check_in_time` | `timestamptz` | `nullable` | Specific time the ticket was validated on-site. |
| `custom_data` | `jsonb` | `nullable` | Key-value mapping of answers to custom questions. |
| `extra_data` | `jsonb` | `nullable` | Key-value mapping of preset answers (e.g. phone). |
| `user_id` | `uuid` | `nullable` | Link to `auth.users.id` if attendee is registered. |

#### Schema Indices
*   **`idx_participants_qr_token`**
    *   **SQL Definition:** `create index if not exists idx_participants_qr_token on participants(qr_token);`
    *   **Purpose:** Crucial index for server-side lookup speeds and matching QR scanner inputs quickly.

---

### 3. `profiles` Table
Manages custom user information linked with their authenticated credentials.

| Column Name | Data Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `primary key` | Unique key mapped 1-to-1 with `auth.users.id`. |
| `full_name` | `text` | `nullable` | User's full name. |
| `username` | `text` | `unique`, `nullable` | Chosen custom username handle. |
| `avatar_url` | `text` | `nullable` | Public URL pointing to their avatar thumbnail. |

> *Status: The table creation query is not defined inside the project's SQL files, but columns are altered in `migrations/add-avatar-support.sql`.*

---

## 🔒 Row Level Security (RLS) Policies

### Table-Level Security
As per development preferences stated in the codebase and `schema.sql`:
*   **Table `events`:** RLS is **disabled** (`alter table events disable row level security;`).
*   **Table `participants`:** RLS is **disabled** (`alter table participants disable row level security;`).
*   **Table `profiles`:**
    > *Status: Not yet implemented in current codebase SQL files. Operations are run directly via client-side libraries.*

---

### Storage Bucket Policies

#### 1. `qr-temp` Bucket (Public QR ticket image distribution)
*   **Select Policy ("Allow anon read qr-temp"):** Allows public access to look up QR codes.
    ```sql
    create policy "Allow anon read qr-temp" on storage.objects
    for select to anon using (bucket_id = 'qr-temp');
    ```
*   **Insert Policy ("Allow anon upload qr-temp"):** Allows anonymous users to upload generated tickets.
    ```sql
    create policy "Allow anon upload qr-temp" on storage.objects
    for insert to anon with check (bucket_id = 'qr-temp');
    ```

#### 2. `avatars` Bucket (User Profile Avatars)
*   **Select Policy ("Anyone can view avatars"):** Anyone can fetch profile pictures.
    ```sql
    create policy "Anyone can view avatars" on storage.objects
    for select to public using (bucket_id = 'avatars');
    ```
*   **Insert Policy ("Users can upload own avatar"):** Authenticated accounts can only insert inside their owned folder.
    ```sql
    create policy "Users can upload own avatar" on storage.objects
    for insert to authenticated with check (
      bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
    );
    ```
*   **Update Policy ("Users can update own avatar"):** Authenticated accounts can only update objects inside their folder.
    ```sql
    create policy "Users can update own avatar" on storage.objects
    for update to authenticated using (
      bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
    );
    ```
*   **Delete Policy ("Users can delete own avatar"):** Authenticated accounts can only delete files inside their folder.
    ```sql
    create policy "Users can delete own avatar" on storage.objects
    for delete to authenticated using (
      bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
    );
    ```
