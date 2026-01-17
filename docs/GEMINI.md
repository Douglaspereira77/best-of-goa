# GEMINI.md - Best of Goa Project

This document provides a comprehensive overview of the Best of Goa project, designed to give an AI assistant the necessary context to understand and contribute to the project.

## Project Overview

Best of Goa is a Next.js application that serves as a comprehensive directory of restaurants in Goa. The platform is highly optimized for search engines (both traditional and LLM-based) and provides rich, structured data for each restaurant. It features an advanced neighborhood system, multi-source data extraction, and a modern technology stack.

## Technologies Used

-   **Framework:** Next.js 14 (with App Router)
-   **Language:** TypeScript
-   **Database:** Supabase (PostgreSQL)
-   **Styling:** Tailwind CSS with shadcn/ui components
-   **AI:** Anthropic Claude for content generation
-   **Linting:** ESLint
-   **Formatting:** Prettier

## How to Run the Project

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set up Environment Variables:**
    Create a `.env.local` file and populate it with the necessary credentials for Supabase and other services.

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Key Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the application for production.
-   `npm run start`: Starts a production server.
-   `npm run lint`: Lints the codebase for errors.
-   `npm run format`: Formats the code using Prettier.
-   `npm run type-check`: Runs the TypeScript compiler to check for type errors.

## Project Structure

```
src/
â”œâ”€â”€ app/                    # Next.js App Router
â”‚   â”œâ”€â”€ api/               # API routes
â”‚   â”œâ”€â”€ admin/             # Admin interface
â”‚   â””â”€â”€ (public)/          # Public pages
â”œâ”€â”€ lib/                   # Shared utilities
â”‚   â”œâ”€â”€ services/          # Business logic
â”‚   â”œâ”€â”€ schema/            # Database types
â”‚   â””â”€â”€ utils/             # Helper functions
â””â”€â”€ components/            # React components
    â”œâ”€â”€ ui/                # shadcn/ui components
    â””â”€â”€ custom/            # Custom components
```

## Key Files

-   `src/lib/services/extraction-orchestrator.ts`: Contains the main logic for data extraction.
-   `src/lib/services/anthropic-client.ts`: Handles interactions with the Anthropic Claude API.
-   `src/lib/utils/slug-generator.ts`: Generates SEO-friendly URLs for restaurants.
-   `src/lib/schema/types.ts`: Defines TypeScript interfaces for the database schema.
-   `docs/PROJECT_README.md`: The main project documentation with in-depth details.
-   `docs/SLUG_GENERATION.md`: Detailed documentation on how restaurant slugs are generated.
-   `docs/GOA_NEIGHBORHOODS_REFERENCE.md`: A reference for the neighborhood system.

## Database

The project uses a Supabase (PostgreSQL) database. The schema is designed to store comprehensive information about restaurants, including their location, cuisine, and other features.

A notable pattern used in the database is "Omar's Pattern," which involves storing many-to-many relationships as integer arrays (`int4[]`) in the main table (e.g., `restaurant_cuisine_ids`).

## Data Extraction

The data extraction process is a multi-step pipeline that uses different sources to gather information:

1.  **Apify (Google Places):** For basic restaurant data, reviews, and photos.
2.  **Firecrawl:** For website content, menus, and social media links.
3.  **Anthropic Claude:** For generating AI-powered SEO content and descriptions.

## API Endpoints

The application exposes several API endpoints for managing restaurants and neighborhoods:

-   `GET /api/restaurants`: Lists restaurants with filtering options.
-   `GET /api/restaurants/[slug]`: Retrieves the details of a specific restaurant.
-   `POST /api/admin/start-extraction`: Initiates the data extraction process for a new restaurant.
-   `GET /api/admin/extraction-status/[jobId]`: Checks the status of an extraction job.
-   `GET /api/neighborhoods`: Lists all available neighborhoods.
-   `GET /api/neighborhoods/[slug]/restaurants`: Retrieves all restaurants within a specific neighborhood.

## SEO

The project has a strong focus on SEO, with features like:

-   **Optimized URL Structure:** Clean and descriptive URLs for restaurants, neighborhoods, cuisines, and categories.
-   **Schema.org Markup:** Structured data for restaurants, FAQs, and local businesses.
-   **AI-Generated Content:** Unique and keyword-rich descriptions and FAQs.
-   **Advanced Slug Generation:** A robust system for creating unique and SEO-friendly slugs for restaurants.

## Testing

The project includes a suite of tests for key functionalities, especially for the neighborhood system. These tests can be run using Node.js:

```bash
node bin/test-neighborhood-linking.js
node bin/test-mall-neighborhoods.js
```
