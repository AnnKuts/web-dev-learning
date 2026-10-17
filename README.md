# Web Development Learning

A collection of my web development projects and practical assignments completed during my studies at Empat School and Igor Sikorsky Kyiv Polytechnic Institute

## Table of Contents

- [`project6/`](project6/) — PHP fundamentals, OOP, HTTP requests, sessions, and a simple blog
- [`project7/`](project7/) — Introduction to Laravel, routing, controllers, and Blade templates
- [`project8-9/blog/`](project8-9/blog/) — Laravel Blog/CMS with authentication, CRUD operations, a JSON API, and an interactive frontend
- [`docs/empat/`](docs/empat/) — Empat School assignments and documentation
- [`docs/kpi/`](docs/kpi/) — KPI practical work reports
- 
## Getting Started

The main application is located in [`project8-9/blog/`](project8-9/blog/).

### 1. Clone the repository

```bash
git clone https://github.com/AnnKuts/web-dev-learning.git
cd web-dev-learning
```

To run the version in the `3-course-php` branch:

```bash
git switch 3-course-php
```

### 2. Install dependencies

```bash
cd project8-9/blog
composer install
npm install
```

### 3. Configure the environment

```bash
cp .env.example .env
php artisan key:generate
```

The example environment uses SQLite by default. Create its database file, then run migrations and seed sample data:

```bash
touch database/database.sqlite
php artisan migrate --seed
```

For local development, you can optionally set `DEV_AUTH_BYPASS=true` in `.env` to access protected API routes through the seeded development user without manually providing a token. This bypass works only in the local environment; keep it disabled outside local development.

### 4. Run the application

Start the Laravel server:

```bash
php artisan serve
```

In another terminal, from the same `project8-9/blog/` directory, start Vite:

```bash
npm run dev
```

Open http://127.0.0.1:8000 in your browser.
