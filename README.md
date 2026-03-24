# Ledger — Full-Stack Budget Tracker

A full-stack budget tracker built with **Angular 19** (frontend) and **NestJS** (backend), backed by **PostgreSQL** via **TypeORM**.

## Project Structure

```
ledger/
├── client/    # Angular 19 frontend (Bootstrap 5)
└── server/    # NestJS REST API (TypeORM + PostgreSQL)
```

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 14
- npm >= 10

---

## Getting Started

### 1. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 2. Configure the server environment

```bash
cd server
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### 3. Start the server

```bash
cd server
npm run start:dev
```

API available at `http://localhost:3000`.

### 4. Start the client

```bash
cd client
npm start
```

App available at `http://localhost:4200`.

---

## API Endpoints

### Auth

| Method | Path             | Description                        |
| ------ | ---------------- | ---------------------------------- |
| POST   | /auth/register   | Register a new user                |
| POST   | /auth/login      | Log in and receive a JWT           |

### Transactions _(requires `Authorization: Bearer <token>`)_

| Method | Path                 | Description                   |
| ------ | -------------------- | ----------------------------- |
| GET    | /transactions        | List all user transactions    |
| POST   | /transactions        | Create a new transaction      |
| GET    | /transactions/:id    | Get a single transaction      |
| PATCH  | /transactions/:id    | Update a transaction          |
| DELETE | /transactions/:id    | Delete a transaction          |

---

## Environment Variables

See [`server/.env.example`](server/.env.example) for all required variables.

---

## Scripts

### Server (`/server`)

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run start:dev`    | Start with file-watch        |
| `npm run build`        | Compile TypeScript           |
| `npm run start:prod`   | Run compiled output          |
| `npm run lint`         | Run ESLint                   |

### Client (`/client`)

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm start`         | Start dev server (port 4200) |
| `npm run build`     | Production build             |
| `npm test`          | Run unit tests               |
