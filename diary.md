# Project Diary

#### Name : Risan Gnanasegaram

#### Topic : Advanced Web Development

#### Supervisor : Christos Dexiades

_TERM 2_

### [2026-04-10] Friday

- Finalised Chapters 7 and 8 of the technical report.
- Mapped out the asset requirements and script for the final demonstration video.

### [2026-04-09] Thursday

- Implemented curated playlist publishing. Developed a workaround for Spotify's strict API deprecation by allowing users to selectively cache up to four playlists directly into the Supabase database.
- Integrated background caching for "Top Artists" on the user profile to improve page load speeds.
- Drafted the final chapter revisions for the technical report.

### [2026-04-08] Wednesday

- Resolved Optimistic UI state bugs within The Wall where vote decrements were improperly calculated.
- Outlined the visual assets required for the final technical report.
- Began drafting the Professional Issues report focusing on Spotify API dependency and data licensing.

### [2026-04-07] Tuesday

- Drafted Chapters 1 through 4 of the technical report, formally documenting the transition from SPA architecture to Next.js Server Components.
- Debugged further async rendering issues within The Wall.

### [2026-04-06] Monday

- Designed and deployed the relational schema for The Wall in Supabase.
- Implemented an Adjacency List pattern in the `comments` table to natively handle infinitely nested reply threads.
- Developed the core React UI to map the flat database arrays into a nested component tree.

### [2026-04-05] Sunday

- Paused external Spotify metadata integration to focus development efforts entirely on the community engagement architecture (The Wall).

### [2026-04-03] Friday

- Strengthened profile privacy controls by introducing granular visibility toggles for the "Currently Playing" UI widget.
- Implemented fallback logic to display the "Last Played" track when the active Spotify broadcast ends.
- Finalised the database schema design and UI interaction workflows for the upcoming "Wall" feature.
- Reviewed the Interim Report feedback to incorporate into the final Software Engineering chapter.

### [2026-04-02] Thursday

- Resolved an OAuth token caching issue, ensuring recurring Spotify link connections persist correctly across sessions.
- Enhanced the Integrations settings tab to display the currently linked Spotify email address for better UX transparency.
- Deployed the "Live Playback Broadcasting" module to user profiles, enforcing strict RLS visibility rules based on the multi-state Sync graph (Public vs. Private constraints).
- Outlined plans to surface live playing statuses directly on the global home feed.

### [2026-04-01] Wednesday

- Investigated external API integrations for sample tracking metadata (SongDNA, MusicBrainz, Genius API).

### [2026-03-31] Tuesday

- Successfully implemented Spotify OAuth linking over existing authenticated accounts using the Supabase `linkIdentity` flow.
- Diagnosed February 2026 Spotify API restrictions; adjusted the development approach to explicitly declare developer emails in the Spotify Dashboard to bypass the new proxy limits.

### [2026-03-30] Monday

- Performed Git repository maintenance. Merged the `settings-and-privacy` feature branch into `term2-dev` after successful local testing. 
- Initialised a clean `t2-feature/spotify-connect` branch to rebuild the OAuth integration following initial failures.

### [2026-03-29] Sunday

- First attempt at the Spotify Identity Linking flow on the `spotify-link-ii` branch; identified structural issues with the callback routing.
- Deployed the multi-tab Settings dashboard providing isolated interfaces for Account, Security, and Privacy management.

### [2026-03-26] Thursday

- Implemented boolean privacy toggles across user profiles. 
- Integrated a protective React UI guard component to block unauthorised access to private listening activity.

### [2026-03-24] Tuesday

- Drafted retrospective methodologies for the technical report.

### [2026-03-17] Tuesday

- Addressed a date-parsing logic error within the Hottest Albums trending algorithm.
- Resolved a constraint failure in the user rotations table.

### [2026-03-15] Sunday

- Corrected string-manipulation edge cases for artist-specific UI Easter eggs ensuring button text mirrors the custom casing explicitly (ScHoolboy Q, MF DOOM).
- Enhanced the Hottest Albums sidebar with a dynamic timeframe selector (24H / WEEK / MONTH / YEAR / ALL) supported by an auto-fallback indexing algorithm.

### [2026-03-12] Thursday

- Overhauled the global search architecture; implemented concurrent data fetching via `Promise.all` to query both internal Supabase users and external Spotify endpoints simultaneously.
- Added frontend string-formatting Easter eggs for specific artists to align with the brutalist aesthetic.
- Completed the high-contrast redesign of the Sign-In and Sign-Up authentication flows.

### [2026-03-08] Sunday

- Upgraded the developer Spotify account to Premium to ensure uninterrupted access to the Web API and active playback endpoints during aggressive local testing.

### [2026-03-06] Friday

- Applied the Brutalist design language system-wide, standardising the harsh drop shadows, monochromatic filtering, and typography across the rating sliders, user profiles, and global navigation bar.

### [2026-03-05] Thursday

- Initiated the platform's visual overhaul originating at the Homepage. 
- Restructured the layout to introduce the live Global/Synced activity feeds, the Hottest Albums trend aggregator, and the Taste-Match Sync suggestions algorithm.

### [2026-03-03] Tuesday

- Final Supervisor meeting to review the Term 1 deliverables. 
- Received structured feedback outlining clear requirements for the final technical report and potential areas of engineering expansion.

### [2026-03-02] Monday

- Programmed the two-stage notification architecture. Built the interactive dropdown and the corresponding 'Sync Requests' list array.
- Verified the multi-state logic where accepting a request safely triggers the RLS clearance by updating the relational `follows` table status to accepted.

### [2026-02-02] Monday

- Online Supervisor meeting to discuss the Term 2 pivot towards the relational community architecture.

### [2026-01-30] Friday

- Finalised the UI modules mapping the user's active social connections (Syncs) and their heavy rotation artists directly onto their public profile grid.

### [2026-01-28] Wednesday

- Engineered the "Heavy Rotation" system. Integrated the frontend button to trigger a Server Action that writes the Spotify Artist ID into the `artist_follows` table.
- Designed structural wireframes for the relationship-mapping UI.

### [2026-01-27] Tuesday

- Successfully deployed the multi-state Sync relationship engine. 
- Tested the bidirectional flow ("Pending" to "Sync Back" to "Synced") and confirmed proper status updates within the database across isolated incognito browser sessions.

### [2026-01-21] Wednesday

- Interim Report officially graded (82/100). 
- Formally committed to pivoting the project scope from a pure logging application to a sophisticated social graph and community engagement platform.

### [2025-12-30] Tuesday

- Restructured the React frontend to communicate with the unified `reviews` table. 
- Refactored the numerical 0-100 logic and the text review submissions into a single unified transaction payload.
- Repaired profile page components impacted by the new schema, correctly mapping review counts.

### [2025-12-28] Sunday

- Executed a hard reset of the backend infrastructure. Initialised a fresh Supabase project and established the `profiles` table to manage stable user identities. 
- Streamlined the authentication architecture to an "Email-First" model, eliminating redundant passwords checks and integrating an active username-availability listener. 
- Deployed avatar upload capabilities via Supabase Storage buckets.

___________________________________________________TERM 1_______________________________________________________

### [2025-12-12] Friday

- Finalised the draft for Section 3.1 (Scope of the Web) for the technical report; completed the full draft for Chapter 3.
- Completed the draft for Section 2.2 (Technology Comparison), evaluating frontend and backend stacks.

### [2025-12-11] Thursday

- Drafted Section 3.3 (Implementation Details), focusing on the technical execution of core features.

### [2025-12-10] Wednesday

- Refined the Artist Page UI to include dynamic profile pictures fetched via the Spotify API.

### [2025-12-09] Tuesday

- Enhanced the Homepage by replacing the generic New Releases section with a curated Featured Albums (top picks) section.

### [2025-12-08] Monday

- Delivered the project presentation to the session chair (DongGyun) in Bedford 0-003.

### [2025-12-07] Sunday

- Finalised the visual presentation slides and completed the accompanying speech script.

### [2025-12-05] Friday

- Standardised the presentation aesthetics using a dark theme and Segoe UI typography.
- Produced high-fidelity GIFs demonstrating the review submission workflow and user profile interface.
- Commenced drafting the presentation script.

### [2025-12-04] Thursday

- Structured the 9-slide presentation deck.
- Developed first drafts for the Title, Tech Stack, Rating Slider, and Review components.
- Created GIFs showcasing the interactive functionality of the rating slider.

### [2025-12-02] Tuesday

- Initialised the PowerPoint presentation; planned for a total of 9 slides with an 8-minute delivery window.

### [2025-11-27] Thursday

- Commenced Homepage development, structuring the layout into Hero, New Releases, and Live Activity sections.
- Integrated Spotify API to display the 5 most recent global releases.
- Developed the "Live Activity" feed to display the 9 most recent community reviews from the database.

### [2025-11-26] Wednesday

- Implemented a review history section within the User Profile page.
- Integrated server-side pagination for both ratings and reviews to ensure optimal performance.

### [2025-11-25] Tuesday

- Designed the architectural layout for the User Profile page.
- Attended Supervisor Meeting #3: Received a detailed explanation of the required structure for the Interim Submission, including the specific requirements for the technical and retrospective components.
- Discussed final Term 1 refinements and confirmed the roadmap for the remaining development weeks.

### [2025-11-24] Monday

- Completed the "Web Frameworks & State of the Art" chapter for the Interim Report.
- Finalised the review submission logic, enforcing a "one review per user per album" constraint with edit capabilities.

### [2025-11-21] Friday

- Conducted literature review for the "State of the Art" section of the technical report.

### [2025-11-20] Thursday

- Formulated the strategy for the Interim Submission, prioritising the technical and retrospective reports.

### [2025-11-16] Sunday

- Implemented the database "Save" functionality for the 0-100 rating system.
- Deferred the text-review component to focus on stabilising the quantitative rating logic.

### [2025-11-15] Saturday

- Adopted a "Vertical Slicing" strategy to focus on component-level stability.
- Replaced the placeholder rating input with a custom interactive "Fader" component.
- Refactored the Album Page layout to accommodate the updated UI and connected the components to Supabase for live data.

### [2025-11-14] Friday

- Created a new feature branch to iterate on the combined rating and review system.
- Developed the underlying foundations for the interactive review components.

### [2025-11-05] Wednesday

- Attended Supervisor Meeting #2; received guidance on report structure and LaTeX usage.
- Received formal approval for the Term 1 MVP scope (core review functionality).
- Discussed the postponement of mobile optimization to Term 2.
- Justified the strategic pivot to Supabase following implementation issues with NextAuth.

### [2025-11-04] Tuesday

- Wireframed the Album Page UI to integrate the planned rating and review components.
- Implemented a basic numeric input for ratings as a temporary placeholder for the upcoming supervisor demo.

### [2025-11-03] Monday

- Developed the `profiles` table in Supabase to link authenticated User IDs to public usernames.
- Updated the Navigation Bar to dynamically reflect authentication states.
- Implemented a basic Profile page and dropdown navigation for authenticated users.

### [2025-11-02] Sunday

- Configured the Supabase client-side and server-side middleware.
- Successfully implemented the Email Sign-Up and Sign-In flows.

### [2025-11-01] Saturday

- Redesigned the Navigation Bar layout, including the brand identity, centralised search, and profile status indicators.

### [2025-10-29] Wednesday

- Conducted technical research into Supabase as a Backend-as-a-Service (BaaS) alternative to NextAuth and custom Express.js setups.

### [2025-10-28] Tuesday

- Defined the user onboarding flows (Sign-in/Sign-up).
- Attempted NextAuth implementation; encountered configuration blockers leading to a search for alternatives.

### [2025-10-24] Friday

- Expanded the Spotify search functionality to include albums and singles alongside artists.

### [2025-10-22] Wednesday

- Attended a lecture on Web Application Testing, focusing on Integration and E2E strategies.

### [2025-10-21] Tuesday

- Optimised the discography layout by implementing a "Show All" toggle, limiting the initial view to the five most recent releases.

### [2025-10-20] Monday

- Integrated deep linking functionality allowing users to navigate from Artist to Album and Tracklist views.
- Refined the discography page by removing Featured On sections to reduce UI clutter.

### [2025-10-19] Sunday

- Synchronised the digital project diary with physical handwritten notes taken during initial development.

### [2025-10-18] Saturday

- Successfully integrated the Spotify Web API.
- Implemented a real-time "search-as-you-type" suggestion feature.
- Developed the logic to fetch and categorize discography data (albums, singles, ep, compilations) upon selecting an artist.

### [2025-10-17] Friday

- Developed a prototype search interface to prepare for backend API integration.
- Restricted initial search scope to artists to simplify initial testing.

### [2025-10-15] Wednesday

- Initialised the Next.js project repository.
- Populated the GitLab issue board with initial feature requirements.

### [2025-10-14] Tuesday

- Formulated the feature implementation sequence and drafted core User Stories for the MVP.

### [2025-10-03] Friday

- Attended the initial supervisor meeting to define the project scope.
- Presented the project concept; received feedback on potential AI-driven future work.
- Clarified deliverables for the Project Plan, including the Timeline, Risk Assessment, and Bibliography requirements.
