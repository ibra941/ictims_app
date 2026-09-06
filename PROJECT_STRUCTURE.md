# ICT Inventory Management System: Project Structure

This repository is a Laravel application with a React, TypeScript, and Vite
frontend. The frontend and backend live in the same project and communicate
through the Laravel API routes.

## Directory tree

```text
myapp/
├── app/                              # Laravel application code
│   ├── Http/Controllers/             # API, auth, web, and diagnostic controllers
│   ├── Http/Middleware/              # HTTP middleware
│   ├── Models/                       # Eloquent models
│   └── Providers/                    # Laravel service providers
├── bootstrap/                        # Application bootstrap and cache
├── config/                           # Laravel configuration
├── database/
│   ├── factories/                    # Model factories
│   ├── migrations/                   # Database schema migrations
│   └── seeders/                      # Seed and test data
├── public/                           # Web server entry point and public files
├── resources/
│   ├── css/                          # Laravel view styles
│   ├── js/                           # Laravel view entry point
│   └── views/                        # Blade templates
├── routes/                           # API, web, and console routes
├── src/                              # React frontend
│   ├── components/                   # Reusable UI components
│   ├── config/                       # Navigation and role configuration
│   ├── context/                      # Auth and toast state
│   ├── mocks/                        # Mock API adapter and data
│   ├── pages/                        # Feature pages and screens
│   ├── routes/                       # Protected route handling
│   ├── services/                     # API and feature service modules
│   ├── styles/                       # Design tokens
│   ├── types/                        # Shared TypeScript types
│   ├── utils/                        # Formatting and export helpers
│   ├── App.tsx                       # Root React component
│   └── main.tsx                      # React entry point
├── storage/                          # Runtime files, cache, sessions, and logs
├── tests/                            # Feature and unit tests
├── artisan                           # Laravel CLI
├── composer.json                     # PHP dependencies and scripts
├── package.json                      # JavaScript dependencies and scripts
├── vite.config.ts                    # Vite configuration
├── tailwind.config.js                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── phpunit.xml                       # PHPUnit configuration
├── .env.example                      # Environment variable template
└── README.md                         # Project documentation
```

## Main responsibilities

- **Backend:** `app/`, `routes/`, `config/`, and `database/` provide the
  Laravel API, authentication, business models, migrations, and seeders.
- **Frontend:** `src/` provides the React interface. Feature screens are in
  `src/pages/`, reusable UI is in `src/components/`, and API calls are in
  `src/services/`.
- **Views and public entry points:** `resources/views/` contains Blade views;
  `public/index.php` is Laravel's HTTP entry point.
- **Testing:** `tests/Feature/` covers application behavior and API flows;
  `tests/Unit/` contains isolated unit tests.
- **Generated or local-only content:** `vendor/`, `node_modules/`, and most of
  `storage/` are intentionally omitted from the tree because they are installed
  or generated rather than source structure.
