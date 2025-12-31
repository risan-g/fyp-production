# Project Diary

#### Name : Risan Gnanasegaram

#### Topic : Advanced Web Development

#### Supervisor : Christos Dexiades

_TERM 2_

### [2025-12-30] tuesDAY

- Queried the new 'reviews' table in Supabase. Handles both the reviews and ratings of an album.
- Redone the rating and review components in website to accomade for the new reviews table.
- Fixed profile pages components for new table and also fixed issue with the review and ratings count.

### [2025-12-28] sunDAY

- Created new Supaase Project. Restarting database/authentication side.
- Created 'profiles' table that handles user authentication information.
- Redone the authentication flow. Only email sign in possible now, removed confirm password, and also checks if username is available.
- Added show password logic.
- Users can now upload profile pic for their account and can change/delete it. Update in the nav bar as well.

_TERM 1_

### [2025-12-12] friDAY

- Finalised the draft for Section 3.1 (Scope of the Web) for the technical report; completed the full draft for Chapter 3.
- Completed the draft for Section 2.2 (Technology Comparison), evaluating frontend and backend stacks.

### [2025-12-11] thursDAY

- Drafted Section 3.3 (Implementation Details), focusing on the technical execution of core features.

### [2025-12-10] wednesDAY

- Refined the Artist Page UI to include dynamic profile pictures fetched via the Spotify API.

### [2025-12-09] tueDAY

- Enhanced the Homepage by replacing the generic New Releases section with a curated Featured Albums (top picks) section.

### [2025-12-08] monDAY

- Delivered the project presentation to the session chair (DongGyun) in Bedford 0-003.

### [2025-12-07] sunDAY

- Finalised the visual presentation slides and completed the accompanying speech script.

### [2025-12-05] friDAY

- Standardised the presentation aesthetics using a dark theme and Segoe UI typography.
- Produced high-fidelity GIFs demonstrating the review submission workflow and user profile interface.
- Commenced drafting the presentation script.

### [2025-12-04] thursDAY

- Structured the 9-slide presentation deck.
- Developed first drafts for the Title, Tech Stack, Rating Slider, and Review components.
- Created an GIFs showcasing the interactive functionality of the rating slider.

### [2025-12-02] tuesDAY

- Initialised the PowerPoint presentation; planned for a total of 9 slides with an 8-minute delivery window.

### [2025-11-27] thursDAY

- Commenced Homepage development, structuring the layout into Hero, New Releases, and Live Activity sections.
- Integrated Spotify API to display the 5 most recent global releases.
- Developed the "Live Activity" feed to display the 9 most recent community reviews from the database.

### [2025-11-26] wednesDAY

- Implemented a review history section within the User Profile page.
- Integrated server-side pagination for both ratings and reviews to ensure optimal performance.

### [2025-11-25] tuesDAY

- Designed the architectural layout for the User Profile page.
- Attended Supervisor Meeting #3: Received a detailed explanation of the required structure for the Interim Submission, including the specific requirements for the technical and retrospective components.
- Discussed final Term 1 refinements and confirmed the roadmap for the remaining development weeks.

### [2025-11-24] monDAY

- Completed the "Web Frameworks & State of the Art" chapter for the Interim Report.
- Finalised the review submission logic, enforcing a "one review per user per album" constraint with edit capabilities.

### [2025-11-21] friDAY

- Conducted literature review for the "State of the Art" section of the technical report.

### [2025-11-20] thursDAY

- Formulated the strategy for the Interim Submission, prioritising the technical and retrospective reports.

### [2025-11-16] sunDAY

- Implemented the database "Save" functionality for the 0-100 rating system.
- Deferred the text-review component to focus on stabilising the quantitative rating logic.

### [2025-11-15] saturDAY

- Adopted a "Vertical Slicing" strategy to focus on component-level stability.
- Replaced the placeholder rating input with a custom interactive "Fader" component.
- Refactored the Album Page layout to accommodate the updated UI and connected the components to Supabase for live data.

### [2025-11-14] friDAY

- Created a new feature branch to iterate on the combined rating and review system.
- Developed the underlying foundations for the interactive review components.

### [2025-11-05] wednesDAY

- Attended Supervisor Meeting #2; received guidance on report structure and LaTeX usage.
- Received formal approval for the Term 1 MVP scope (core review functionality).
- Discussed the postponement of mobile optimization to Term 2.
- Justified the strategic pivot to Supabase following implementation issues with NextAuth.

### [2025-11-04] tuesDAY

- Wireframed the Album Page UI to integrate the planned rating and review components.
- Implemented a basic numeric input for ratings as a temporary placeholder for the upcoming supervisor demo.

### [2025-11-03] monDAY

- Developed the `profiles` table in Supabase to link authenticated User IDs to public usernames.
- Updated the Navigation Bar to dynamically reflect authentication states.
- Implemented a basic Profile page and dropdown navigation for authenticated users.

### [2025-11-02] sunDAY

- Configured the Supabase client-side and server-side middleware.
- Successfully implemented the Email Sign-Up and Sign-In flows.

### [2025-11-01] saturDAY

- Redesigned the Navigation Bar layout, including the brand identity, centralised search, and profile status indicators.

### [2025-10-29] wednesDAY

- Conducted technical research into Supabase as a Backend-as-a-Service (BaaS) alternative to NextAuth and custom Express.js setups.

### [2025-10-28] tuesDAY

- Defined the user onboarding flows (Sign-in/Sign-up).
- Attempted NextAuth implementation; encountered configuration blockers leading to a search for alternatives.

### [2025-10-24] friDAY

- Expanded the Spotify search functionality to include albums and singles alongside artists.

### [2025-10-22] wednesDAY

- Attended a lecture on Web Application Testing, focusing on Integration and E2E strategies.

### [2025-10-21] tuesDAY

- Optimised the discography layout by implementing a "Show All" toggle, limiting the initial view to the five most recent releases.

### [2025-10-20] monDAY

- Integrated deep linking functionality allowing users to navigate from Artist to Album and Tracklist views.
- Refined the discography page by removing Featured On sections to reduce UI clutter.

### [2025-10-19] sunDAY

- Synchronised the digital project diary with physical handwritten notes taken during initial development.

### [2025-10-18] saturDAY

- Successfully integrated the Spotify Web API.
- Implemented a real-time "search-as-you-type" suggestion feature.
- Developed the logic to fetch and categorize discography data (albums, singles, ep, compilations) upon selecting an artist.

### [2025-10-17] friDAY

- Developed a prototype search interface to prepare for backend API integration.
- Restricted initial search scope to artists to simplify initial testing.

### [2025-10-15] wednesDAY

- Initialised the Next.js project repository.
- Populated the GitLab issue board with initial feature requirements.

### [2025-10-14] tuesDAY

- Formulated the feature implementation sequence and drafted core User Stories for the MVP.

### [2025-10-03] friDAY

- Attended the initial supervisor meeting to define the project scope.
- Presented the project concept; received feedback on potential AI-driven future work.
- Clarified deliverables for the Project Plan, including the Timeline, Risk Assessment, and Bibliography requirements.
