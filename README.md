# SideWidth

SideWidth is a hyper-local, anonymous social consensus engine designed to facilitate community engagement and decision-making without the barriers of identity or broad geography.

## Features

-   **Anonymous Posting**: Share thoughts and questions without attaching your identity.
-   **Consensus Slider**: A unique, interactive way to gauge community sentiment on posts.
-   **Hyper-Local Feed**: Discover content relevant to your immediate surroundings using geolocation.
-   **Glassmorphism UI**: A modern, sleek user interface designed with glassmorphism aesthetics.
-   **Real-time Interaction**: Instant feedback and updates.

## Tech Stack & Resources

This project leverages a modern tech stack to deliver a fast and responsive user experience:

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**:
    -   [Tailwind CSS v4](https://tailwindcss.com/)
    -   [Framer Motion](https://www.framer.com/motion/) (Animations)
    -   Glassmorphism design principles
-   **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Deployment**: Vercel (Recommended)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

Ensure you have the following installed:
-   [Node.js](https://nodejs.org/) (v18+ recommended)
-   npm, yarn, pnpm, or bun

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd sideWith
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    *You can find these keys in your Supabase project settings.*

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Learn More

To learn more about the technologies used in this project:

-   [Next.js Documentation](https://nextjs.org/docs)
-   [Supabase Documentation](https://supabase.com/docs)
-   [Tailwind CSS Documentation](https://tailwindcss.com/docs)
