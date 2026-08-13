# Team 3 — Full-Stack Development Project

Full-stack application developed by Team 3 for the Full-Stack Development course.

## Team Member

- Huynh Tan Phuc - s4103131
- Dao Tien Dung - s4088577
- Lam Vi Tin - s4116601
- Nguyen Nhat Minh - s4112692 

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Documentation:** SRS, diagrams, reports

## Project Structure

```text
Team3/
├── frontend/       # React + Vite
├── backend/        # Node.js + Express
├── docs/            # Documentation
├── .gitignore
├── README.md
└── package.json
```

## Prerequisites

- Node.js 24 LTS
- pnpm
- Git

Check your versions:

```bash
node -v
pnpm -v
```

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/2026B-FullStackDevelopment/Team3.git
cd Team3
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Do not commit `.env` files.

## Run the Application

Run both frontend and backend:

```bash
pnpm dev
```

The applications will run at:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3000
```

Backend health check:

```bash
curl http://localhost:3000/api/health
```

## Git Branch Strategy

```text
main        # Production-ready
production  # Stable/production code
dev         # Daily development
```

- `dev` is the default branch.
- Do not push directly to `main` or `production`.
- All changes should go through Pull Requests.

## Branch Naming

Feature:

```text
feature/<module>-<short-desc>
```

Example:

```text
feature/donor-create-listing
```

Bug fix:

```text
fix/<module>-<short-desc>
```

Example:

```text
fix/auth-login
```

Create a feature branch from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/<module>-<short-desc>
```

## Useful Commands

```bash
# Install dependencies
pnpm install

# Run frontend + backend
pnpm dev

# Run frontend only
pnpm dev:frontend

# Run backend only
pnpm dev:backend

# Build frontend
pnpm build:frontend

# Build backend
pnpm build:backend
```

## Documentation

Project documentation is stored in:

```text
docs/
├── diagrams/
├── SRS/
└── report/
```

## Team Collaboration

1. Create a feature branch from `dev`.
2. Develop and test locally.
3. Push your feature branch.
4. Create a Pull Request to `dev`.
5. Get the required review before merging.
6. Keep your branch updated with `dev`.
