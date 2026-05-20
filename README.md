# BILLING_PD_TP

## Project Overview

Billing Tracker is a full-stack billing and expense management application deployed across two VirtualBox VMs and automated with a complete DevOps workflow.

The project demonstrates the full delivery cycle:

```text
GitHub → Jenkins → Docker Build → Docker Hub → Ansible Deploy → Smoke Tests → Email Notification
```

This repository is the final/main project source:

```text
https://github.com/Dragneel277/billing-pd-ruben-devops.git
```

Final working branch:

```text
ruben-devops-fixes
```

A shared copy was also sent to the teammate repository for review:

```text
https://github.com/RicardoDR14/BILLING_PD_TP/tree/final-updates-ui
```

---

## Application Summary

The application allows users to manage personal bills and expenses.

Main features:

- User registration and login
- Create, edit and delete bills
- Categories and statuses
- Search and filters
- Automatic overdue detection
- Analytics dashboard with charts

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Nginx |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Containerization | Docker |
| CI/CD | Jenkins |
| Deployment | Ansible |
| Image Registry | Docker Hub |
| Virtualization | Oracle VirtualBox |
| Local CI Environment | JenkinsWSL |

---

## Final Architecture

The project uses two Ubuntu VMs:

| VM | Host-only IP | NAT IP | Role |
|---|---|---|---|
| `billing-app-vm` | `192.168.56.101` | `10.0.2.3` | Frontend + Backend |
| `billing-db-vm` | `192.168.56.102` | `10.0.2.4` | PostgreSQL |

Jenkins runs locally in `JenkinsWSL`:

```text
http://localhost:8080
```

---

## Network Rules

Jenkins and Ansible access the VMs through the Host-only network:

```text
Jenkins/Ansible → billing-app-vm: 192.168.56.101
Jenkins/Ansible → billing-db-vm: 192.168.56.102
```

The backend connects to PostgreSQL through the NAT network:

```text
Backend → PostgreSQL: 10.0.2.4:5432
```

On the application VM, frontend and backend communicate through an internal Docker network:

```text
billing-net
```

Containers attached to `billing-net`:

```text
billing-frontend
billing-backend
```

---

## Runtime Exposure

Final container exposure on `billing-app-vm`:

```text
billing-frontend   0.0.0.0:80->80/tcp
billing-backend    3000/tcp
```

Important:

- The frontend is exposed publicly on port `80`
- The backend is not exposed directly on port `3000`
- API requests go through Nginx using `/api`
- Direct backend access on `http://192.168.56.101:3000` should return connection refused or timeout

---

## Final Access URLs

Frontend:

```text
http://192.168.56.101/login
```

API base through Nginx:

```text
http://192.168.56.101/api
```

Health endpoint:

```text
http://192.168.56.101/api/health
```

Jenkins:

```text
http://localhost:8080
```

---

## CI/CD Pipeline

The Jenkins pipeline performs:

1. Checkout from GitHub
2. Build backend Docker image
3. Build frontend Docker image
4. Push images to Docker Hub
5. Deploy to VMs using Ansible
6. Run smoke tests
7. Clean temporary test data
8. Send email notification

Docker images are pushed with:

```text
BUILD_NUMBER
latest
```

---

## Ansible Deployment

Ansible deploys the system using:

```text
ansible/inventory.ini
ansible/playbook.yml
```

Deployment responsibilities:

- Deploy PostgreSQL on `billing-db-vm`
- Deploy backend and frontend on `billing-app-vm`
- Create Docker network `billing-net`
- Apply database schema from `backend/src/db/init.sql`
- Use persistent PostgreSQL volume `billing_pgdata`

---

## Smoke Tests

After deployment, Jenkins validates:

```text
http://192.168.56.101
http://192.168.56.101/api/health
http://192.168.56.101/api/auth/register
http://192.168.56.101/api/auth/login
```

These tests confirm that the frontend, backend, reverse proxy, database connection and authentication routes are working.

---

## Documentation

Additional documentation:

| File | Purpose |
|---|---|
| `quickstart.md` | Fast startup and validation guide |
| `guide.md` | Complete recovery, export/import and troubleshooting guide |
| `billing-app-project.md` | Detailed academic/technical project documentation |

---

## Final Note

The final architecture follows this rule:

```text
Expose only the frontend.
Keep the backend private inside billing-net.
Access the API through Nginx /api.
Keep PostgreSQL on a separate VM with persistent storage.
```