# GAP EE Tracker API

This is the Node.js backend for the GATE EE Tracker capability.

## Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Configuration**:
    -   A `.env` file has been created.
    -   **IMPORTANT**: Update `DATABASE_URL` in `.env` with your actual PostgreSQL connection string.
    -   Example: `DATABASE_URL=postgres://user:password@localhost:5432/your_db_name`

3.  **Database Initialization**:
    Run the migration script to create the tables:
    ```bash
    npm run migrate
    ```

4.  **Start Server**:
    -   Development: `npm run dev`
    -   Production: `npm start`

## API Endpoints

### Authentication
-   `POST /api/auth/register` - Body: `{ "username": "...", "email": "...", "password": "..." }`
-   `POST /api/auth/login` - Body: `{ "email": "...", "password": "..." }`

### Syllabus & Tracking
-   **Headers**: `Authorization: Bearer <token>`
-   `GET /api/syllabus` - Get full syllabus with topics
-   `POST /api/syllabus/subject` - Create subject
-   `POST /api/syllabus/topic` - Create topic
-   `POST /api/syllabus/log` - Log time. Body: `{ "topicId": 1, "minutes": 45 }`

## Architecture
-   **Routes**: `src/routes`
-   **Controllers**: `src/controllers`
-   **Services**: `src/services` (Business Logic & DB Access)
-   **Config**: `src/config/db.js`
