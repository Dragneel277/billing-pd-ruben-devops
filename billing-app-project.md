# BILLING PD TP — Academic Project Documentation

## Project Overview

Billing Tracker is an academic full-stack project that demonstrates a DevOps delivery pipeline, multi-VM deployment, and network isolation.

The final architecture uses:

- App VM `billing-app-vm` with host-only IP `192.168.56.101`
- DB VM `billing-db-vm` with host-only IP `192.168.56.102`
- Jenkins accessible at `http://localhost:8080`
- Frontend accessible at `http://192.168.56.101/login`
- Backend API accessible through Nginx at `http://192.168.56.101/api`
- Backend health endpoint at `http://192.168.56.101/api/health`
- Internal Docker network `billing-net`
- PostgreSQL persistent volume `billing_pgdata`

This document is the final academic project documentation for the repository above.

## Repository

```text
https://github.com/Dragneel277/billing-pd-ruben-devops.git
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Nginx |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Containers | Docker |
| CI/CD | Jenkins |
| Deployment | Ansible |
| Virtualization | Oracle VirtualBox |
| WSL | JenkinsWSL |

## Features

- User registration and login
- Bill creation, editing, deletion
- Search and filtering
- Categories and statuses
- Automatic overdue detection
- Analytics dashboard with charts
- JWT-based authentication
- API routed through Nginx reverse proxy
- Multi-VM deployment with isolated network

## Final Deployment Architecture

### VM roles

| VM | Host-only IP | NAT IP | Role |
|---|---|---|---|
| billing-app-vm | 192.168.56.101 | 10.0.2.3 | Frontend + Backend |
| billing-db-vm | 192.168.56.102 | 10.0.2.4 | PostgreSQL |

### Internal Docker network

On `billing-app-vm`, the final deployment uses the internal network `billing-net`.

Containers attached:

- `billing-frontend`
- `billing-backend`

Final container exposure:

- `billing-frontend`: `0.0.0.0:80->80/tcp`
- `billing-backend`: `3000/tcp`

### Public access

- Frontend: `http://192.168.56.101/login`
- API public access: `http://192.168.56.101/api`
- Health endpoint: `http://192.168.56.101/api/health`

The backend direct port `3000` is intentionally not exposed.

## Network and DB details

- Jenkins and Ansible use host-only IPs
- Backend uses NAT IP `10.0.2.4` to reach PostgreSQL
- PostgreSQL persists data in volume `billing_pgdata`
- Ansible applies schema from `backend/src/db/init.sql`

## Jenkins Smoke Tests

Smoke tests validate the published API through Nginx:

- `http://192.168.56.101/api/health`
- `http://192.168.56.101/api/auth/register`
- `http://192.168.56.101/api/auth/login`

These endpoints prove that the backend is reachable only through the proxy.

## Repository Structure

```text
billing-pd-ruben-devops/
├── ansible/
├── backend/
├── frontend/
├── jenkins/
├── README.md
├── quickstart.md
├── guide.md
└── billing-app-project.md
```

## Database Schema

The final DB schema is applied from:

```text
backend/src/db/init.sql
```

This ensures the deployed database uses the same schema as the application source.

## Key Project Lessons

- Separate frontend and backend exposure improves security
- Use an internal Docker network for service communication
- Persist database state with named Docker volumes
- Keep API access behind Nginx reverse proxy
- Use host-only networking for CI/CD and deployment control
- Document final IPs and endpoints clearly

## Final Access Summary

| Component | URL |
|---|---|
| Frontend | `http://192.168.56.101/login` |
| Public API | `http://192.168.56.101/api` |
| Health | `http://192.168.56.101/api/health` |
| Jenkins | `http://localhost:8080` |

## Final Notes

The final architecture is the current working version of the project. It is designed so that the frontend is the only exposed service, while the backend is reachable only internally via the Docker network on `billing-app-vm`.

Direct backend port access on `http://192.168.56.101:3000` is not part of the final deployment and should not be used.
