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

---

## 🛠️ Remote Procedure Calls (RPC)

Custom Postgres functions are configured inside Supabase to handle transactional bulk operations and fast database-side groupings.

### 1. `batch_check_in`
Enables the panitia check-in scanner to submit a batch of participant tokens in a single database transaction, preventing server resource exhaustion.

*   **SQL Definition:**
    ```sql
    create or replace function public.batch_check_in(tokens text[])
    returns table (
      qr_token text,
      is_checked_in boolean,
      check_in_time timestamptz
    )
    language sql
    security definer
    set search_path = public
    as $$
      update participants p
      set
        is_checked_in = true,
        check_in_time = coalesce(p.check_in_time, now())
      where p.qr_token = any(tokens)
      returning p.qr_token, p.is_checked_in, p.check_in_time;
    $$;
    ```
*   **Parameters:**
    *   `tokens` (`text[]`): Array of unique qr_token strings.
*   **Return Type:** Table schema containing the updated check-in records (`qr_token`, `is_checked_in`, `check_in_time`).

---

### 2. `get_event_summary`
Handles database-side aggregation of registrations and attendance ratios grouped dynamically by preset columns or custom questionnaire answers.

*   **SQL Definition:**
    ```sql
    create or replace function public.get_event_summary(
      p_event_id uuid,
      p_group_by_key text,
      p_source_column text
    )
    returns table (
      group_value text,
      total_participants bigint,
      checked_in_count bigint
    )
    language plpgsql
    security definer
    set search_path = public
    as $$
    begin
      return query
      select
        coalesce(nullif(
          case
            when p_source_column = 'custom_data' then p.custom_data ->> p_group_by_key
            when p_source_column = 'extra_data' then p.extra_data ->> p_group_by_key
            when p_source_column = 'institution' then p.extra_data ->> 'institution'
            when p_source_column = 'phone' then p.extra_data ->> 'phone'
            else null
          end, ''
        ), 'Tidak Diketahui') as group_value,
        count(*)::bigint as total_participants,
        count(*) filter (where p.is_checked_in = true)::bigint as checked_in_count
      from participants p
      where p.event_id = p_event_id
      group by 1
      order by total_participants desc, group_value asc;
    end;
    $$;
    ```
*   **Parameters:**
    *   `p_event_id` (`uuid`): Unique identifier of the event.
    *   `p_group_by_key` (`text`): JSONB key value inside custom_data or extra_data.
    *   `p_source_column` (`text`): Source column name (`custom_data` or `extra_data`).
*   **Return Type:** Table structure returning categorized keys (`group_value`), enrollment size (`total_participants`), and checked-in attendees (`checked_in_count`).
