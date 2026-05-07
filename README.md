# ??? Election Campaign Tool

A full-stack **India MLA & Ward Election Management System** with a modern Web App and React Native Mobile App.

---

## ??? Tech Stack

| Layer | Technology |
|---|---|
| **Web Backend** | ASP.NET Core 8 — Razor Pages |
| **REST API** | ASP.NET Core 8 — Web API + JWT Auth |
| **Real-time** | SignalR (live election day turnout) |
| **Database** | SQLite via Entity Framework Core 8 |
| **Auth** | ASP.NET Core Identity + JWT Bearer |
| **API Docs** | Swagger / OpenAPI |
| **Mobile** | React Native + Expo SDK 51 (TypeScript) |

---

## ?? Quick Start

### 1. Web App

```bash
# From project root
dotnet restore
dotnet run --launch-profile http
```

| URL | Description |
|---|---|
| http://localhost:5211 | Web Application |
| http://localhost:5211/swagger | Swagger API Explorer |

### 2. Mobile App

```bash
cd mobile
npm install
npx expo start

# Press A ? Android Emulator
# Press I ? iOS Simulator
# Scan QR ? Physical Device (install Expo Go first)
```

> ?? Update `mobile/src/api/client.ts` ? `API_BASE_URL` to your machine's local IP for physical device testing.

---

## ?? Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@election.com | Admin@123 |
| **Campaign Manager** | manager@election.com | Manager@123 |
| **Field Worker** | worker@election.com | Worker@123 |

---

## ?? Mobile App Screens

| Screen | Description |
|---|---|
| **Login** | JWT-secured authentication |
| **Dashboard** | Live stats — voters, turnout, sentiment |
| **Voter List** | Search, filter, paginate 1000s of voters |
| **Voter Detail** | Full profile, sentiment update, log door-to-door visits |
| **Election Day** | Live turnout tracking, mark voter as voted |
| **Booths** | Booth-wise turnout progress bars |
| **Grievances** | Submit & view grievances |

---

## ?? Web App Modules

| Module | Features |
|---|---|
| **Dashboard** | Stats, sentiment chart, booth summary, upcoming events |
| **Voters** | Import CSV, search/filter, sentiment tracking, visit logs |
| **Voter Slips** | Print-ready QR code slips (booth-wise) |
| **Booths** | Manage booths, assign agents |
| **Campaign Events** | Create and track campaign events |
| **Volunteers** | Register, assign tasks, activate/deactivate |
| **Election Day** | Live turnout dashboard with SignalR |
| **Analytics** | Sentiment charts, age/gender breakdown |
| **Grievances** | Track with priority — Open ? In Progress ? Resolved |
| **Expenses** | EC-compliant expense tracking |
| **Admin** | User management, roles, audit logs |

---

## ?? REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/voters` | Paginated voter list (search, filter) |
| GET | `/api/voters/{id}` | Voter detail + visit history |
| PATCH | `/api/voters/{id}/sentiment` | Update voter sentiment |
| POST | `/api/voters/{id}/visit` | Log door-to-door visit |
| GET | `/api/booths` | All booths with turnout |
| GET | `/api/electionday/turnout` | Live booth-wise turnout |
| POST | `/api/electionday/mark-voted` | Mark voter as voted |
| POST | `/api/electionday/mark-absent` | Mark voter as absent |
| GET | `/api/grievances` | List grievances |
| POST | `/api/grievances` | Submit grievance |
| GET | `/api/volunteers` | List volunteers |

---

## ?? Project Structure

```
ElectionCampaignTool/
??? Controllers/              # REST API controllers (JWT)
??? Domain/
?   ??? Entities/             # EF Core entity models
?   ??? Enums/                # Enumerations
??? Hubs/                     # SignalR hubs
??? Infrastructure/
?   ??? Data/                 # DbContext
?   ??? Services/             # Business logic services
??? Models/Api/               # API request/response DTOs
??? Pages/                    # Razor Pages (web UI)
?   ??? Account/
?   ??? Admin/
?   ??? Analytics/
?   ??? Booths/
?   ??? Campaign/
?   ??? Dashboard/
?   ??? ElectionDay/
?   ??? Expenses/
?   ??? Grievances/
?   ??? Shared/
?   ??? VoterSlips/
?   ??? Voters/
??? SampleData/               # Sample CSV for voter import
??? wwwroot/                  # Static files (CSS, JS)
??? mobile/                   # React Native Expo app
?   ??? src/
?   ?   ??? api/              # Axios API client
?   ?   ??? context/          # Auth context
?   ?   ??? navigation/       # React Navigation
?   ?   ??? screens/          # App screens
?   ??? App.tsx
?   ??? package.json
??? Program.cs
??? appsettings.json
```

---

## ??? Security

- **Web**: ASP.NET Core Identity with cookie-based authentication
- **API**: JWT Bearer tokens (24-hour expiry)
- **CORS**: Configured for React Native / Expo dev server
- **Role-based**: Admin, CampaignManager, Candidate, BoothAgent, FieldWorker
- **Audit Logs**: All sensitive actions tracked

---

## ?? Seeded Demo Data

- 1 Constituency (Pune Cantonment)
- 8 Booths pre-configured
- 120 sample voters across booths
- 3 demo users with different roles
