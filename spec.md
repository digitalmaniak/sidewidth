# Software Requirements Specification: SideWidth
**Version:** 1.0.0
**Project Goal:** A hyper-local, anonymous social consensus engine for resolving subjective arguments via a "Sliding Scale" mechanic.

---

## 1. Product Overview
SideWidth is a web application designed to provide quick, crowdsourced resolutions to two-sided debates. It prioritizes local peer engagement and removes the friction of social identity by utilizing an anonymous-first architecture.

## 2. Design Language & UX
* **Theme:** Modern Minimalism / "Airy" Aesthetic.
* **Visual Style:** Glassmorphism (Backdrop blurs, semi-transparent surfaces, thin borders).
* **Primary Interaction:** The "SideWidth Slider" — a tactile, center-aligned slider that users move toward the side they agree with most.
* **Color Palette:** High-contrast accent colors for opposing sides (e.g., Electric Blue vs. Vivid Magenta) set against a soft, dark, or light mesh gradient background.

## 3. Core Feature Set

### 3.1. Post Creation (The Parallel Input)
* **Dual View:** Side-by-side text inputs for "Side A" and "Side B."
* **Categorization:** Mandatory tagging (e.g., Office, Relationships, Tech, Petty).
* **Geolocation:** Automatic tagging of the post's origin (City/Region) for local feed priority.

### 3.2. The Consensus Engine (Sliding Scale)
* **Input:** Users slide from center (0) to either -100 (Total Side A) or +100 (Total Side B).
* **Feedback:** Post-vote, the slider locks and reveals the "SideWidth"—the community distribution shown as a weighted bar.
* **Comments:** Nested, anonymous text threads under each post for nuance.

### 3.3. Peer-First Discovery
* **Geo-Fenced Feed:** Prioritizes arguments happening within a 10–50 mile radius.
* **Category Weighting:** Users can "Star" categories to see them more frequently.
* **Sort Options:** "Hottest Near Me," "Unresolved," and "Newest."

### 3.4. User Dashboard (Private History)
* **My Debates:** A list of posts created by the user (tracked via local storage or anonymous JWT).
* **My Stances:** A history of all arguments the user has voted/slid on.

## 4. Technical Requirements
* **Frontend:** Next.js (React) for performance and routing.
* **Styling:** Tailwind CSS with custom `backdrop-blur` and `glass` utilities.
* **Backend:** Supabase/Firebase for real-time vote updates and geo-queries.
* **State Management:** Lightweight (Zustand or React Context) to handle slider states.

## 5. Success Metrics
* **Speed to Verdict:** Average time from post creation to 10+ votes.
* **Engagement Depth:** Percentage of users who move the slider vs. just scrolling.