I have an existing SANKALP'26 Certificate Generator web application deployed on Vercel.

IMPORTANT:
Do NOT rebuild the application from scratch.
Do NOT remove or break any existing functionality.
First inspect the existing codebase and understand how the current certificate designer, participant Excel upload, certificate generation, live preview, and admin panel work.

CURRENT PROBLEM:
The certificate generator currently works correctly on my own system, but the customization/settings are stored locally in the browser or application state.

For example:
- I customize the certificate template.
- I move the participant name position.
- I change font, size, alignment, etc.
- I upload/import participant Excel data.
- Everything works perfectly on my computer.

However, when I open the same deployed Vercel URL on another laptop/browser/device, the application goes back to the original/default state.

I need to convert this into a proper shared, persistent web application.

==================================================
CORE REQUIREMENT
==================================================

The Admin Panel must become the single source of truth.

Any change made from the Admin Panel must be saved centrally and must be visible to every device/browser that opens the Vercel deployment.

Example:

Admin Laptop
→ changes certificate design
→ clicks SAVE
→ configuration is stored in central database
→ another laptop opens the same Vercel URL
→ it automatically loads the latest saved configuration.

There must NOT be device-specific certificate configurations.

Do NOT use localStorage as the primary storage for shared application data.

==================================================
RECOMMENDED ARCHITECTURE
==================================================

Frontend:
- Keep the existing frontend/framework.
- Keep Vercel deployment.

Backend / Database:
- Use Supabase with PostgreSQL unless the existing project already has a suitable backend/database.
- If the project already uses another database/backend, evaluate whether it can be reused instead of unnecessarily replacing it.

The architecture should be:

Admin Panel
      ↓
Backend/API
      ↓
Supabase Database
      ↓
All users/devices

The Vercel frontend should retrieve the latest configuration from the database when the application loads.

==================================================
CERTIFICATE DESIGN SETTINGS
==================================================

All editable certificate settings must be persisted centrally.

Depending on the existing implementation, store things such as:

- Certificate template/background
- Certificate dimensions
- Participant name X position
- Participant name Y position
- Roll number X position
- Roll number Y position
- Department X position
- Department Y position
- Other participant-field positions
- Font family
- Font size
- Font weight
- Text color
- Text alignment
- Letter spacing
- Line height
- Any other existing certificate customization options

Do NOT hard-code these values.

The Admin Panel should:

1. Load the current configuration from the database.
2. Allow the admin to modify it.
3. Show the live preview.
4. Save the configuration to the database.
5. Show a clear "Saved successfully" confirmation.
6. Reload the saved configuration when the page is refreshed.
7. Ensure another device receives the same saved configuration.

==================================================
PARTICIPANT DATA
==================================================

The existing Excel upload/import functionality must continue working.

If participant data is currently stored only in browser memory/localStorage, move it to the central database as well.

Create an appropriate participants table containing fields based on the existing Excel structure, for example:

- id
- name
- roll_number
- department
- year
- email (if currently used)
- certificate_status
- certificate_generated_at
- created_at

Do NOT assume these are the only fields.
Inspect the existing Excel import implementation and preserve all fields currently supported.

When the admin uploads an Excel file:

Excel
→ parse
→ validate
→ save participant records to database

All authorized devices should then be able to access the same participant data.

==================================================
CERTIFICATE GENERATION
==================================================

The certificate generator must always use the latest saved certificate configuration from the database.

Example:

If Admin changes:

Name position:
X = 450
Y = 320

Then every subsequently generated certificate must use:

X = 450
Y = 320

Do NOT allow one browser to silently use an old local configuration.

If local caching is used for performance, it must never override the server/database source of truth.

==================================================
ADMIN PANEL
==================================================

Keep the existing Admin Panel UI wherever possible.

Add/modify the following:

- Load current settings from database
- Edit certificate
- Live preview
- Save Changes
- Reset to Default
- Last Updated timestamp
- Clear success/error messages

Optional but useful:

"Last updated by"
"Last updated at"

Do NOT add unnecessary features.

This is a temporary event system for SANKALP'26, so keep the implementation simple, reliable and easy to maintain.

==================================================
MULTI-DEVICE REQUIREMENT
==================================================

This is critical.

Test the application conceptually for:

- Admin laptop
- Another laptop
- Different browser
- Incognito/private browser
- Mobile browser

All devices must receive the same saved certificate configuration.

Example test:

1. Open Admin Panel on Laptop A.
2. Change name position.
3. Save.
4. Open participant/certificate generator on Laptop B.
5. Refresh.
6. The new position must appear.
7. Generate a certificate on Laptop B.
8. The certificate must use the new position.

Repeat this for participant data.

==================================================
AUTHENTICATION & SECURITY
==================================================

Do not expose database credentials or service-role keys in frontend code.

Use proper environment variables.

If an admin login already exists, preserve it.

If authentication is missing, implement a simple secure admin authentication mechanism appropriate for this temporary event application.

Participants should NOT be able to modify certificate configuration.

Only authorized administrators can:

- Change certificate design
- Upload/update participant data
- Modify system settings

==================================================
IMPORTANT VERCEL REQUIREMENT
==================================================

The application must work correctly in a serverless/Vercel environment.

Do NOT depend on:

- local filesystem persistence
- server memory
- browser localStorage for shared state
- temporary in-memory variables
- files stored inside the Vercel deployment

Persistent data must live in the external database/storage.

If certificate template images or uploaded assets need persistent storage, use Supabase Storage or another proper persistent storage solution.

==================================================
BACKWARD COMPATIBILITY
==================================================

Do not remove existing functionality.

Preserve:

- Current certificate design UI
- Current drag/drop or positioning functionality
- Current live preview
- Current Excel upload
- Current certificate generation
- Current download functionality
- Current UI/UX wherever possible
- Existing responsive behavior

Only change the underlying persistence architecture where required.

==================================================
ERROR HANDLING
==================================================

Handle:

- Database unavailable
- Failed save
- Failed load
- Invalid Excel file
- Duplicate participant records
- Missing participant fields
- Missing certificate template
- Unauthorized admin access

Display clear user-friendly error messages.

Do not silently fall back to default settings when the database request fails.

If loading fails, clearly indicate that the latest configuration could not be retrieved.

==================================================
DELIVERABLE
==================================================

First inspect the existing project.

Then:

1. Identify where certificate settings are currently stored.
2. Identify where participant data is currently stored.
3. Identify all places relying on localStorage/browser state/in-memory state.
4. Design the minimal database schema required.
5. Implement Supabase integration.
6. Move shared persistent data to the database.
7. Update the Admin Panel.
8. Update certificate generation to use database configuration.
9. Preserve the existing UI and functionality.
10. Add required environment variables/configuration.
11. Make the application Vercel-compatible.
12. Test the complete multi-device workflow.

Do NOT simply give me instructions.
Actually modify the existing project/code.

At the end, provide:

- Files changed
- Database tables created
- Environment variables required
- Supabase setup steps
- Vercel deployment steps
- How to test the multi-device synchronization

MOST IMPORTANT:
The final behavior must be:

ADMIN CHANGES
→ SAVE
→ CENTRAL DATABASE
→ ALL DEVICES SEE THE SAME UPDATED STATE

The browser/device must never be the source of truth for shared event data.