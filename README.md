# BILLING_PD_TP

## Project Overview

Billing Tracker is a full-stack billing and expense management application deployed across two VirtualBox VMs and automated with Jenkins and Ansible.

This repository is the final project source for:
```text
https://github.com/Dragneel277/billing-pd-ruben-devops.git
```

## Final Architecture

- App VM: `billing-app-vm` at host-only `192.168.56.101` and NAT `10.0.2.3`
- DB VM: `billing-db-vm` at host-only `192.168.56.102` and NAT `10.0.2.4`
- Jenkins: `http://localhost:8080`
- Frontend: `http://192.168.56.101/login`
- Public API through Nginx: `http://192.168.56.101/api`
- Backend health endpoint: `http://192.168.56.101/api/health`

## Runtime Exposure

- `billing-frontend` is published as `0.0.0.0:80->80/tcp`
- `billing-backend` is attached to `billing-net` and exposes `3000/tcp` only internally
- Direct backend access on `http://192.168.56.101:3000` is intentionally blocked and should return connection refused or timeout

## Internal Network

- Internal Docker network on app VM: `billing-net`
- Containers attached to `billing-net`:
  - `billing-frontend`
  - `billing-backend`
- PostgreSQL persistent volume: `billing_pgdata`
- Ansible applies schema from: `backend/src/db/init.sql`

## Final Access

- Frontend: `http://192.168.56.101/login`
- API base: `http://192.168.56.101/api`
- Health endpoint: `http://192.168.56.101/api/health`
- Jenkins: `http://localhost:8080`

## Key Notes

- The backend is reached only through Nginx reverse proxy under `/api`
- The backend is not publicly exposed on port `3000`
- Jenkins and Ansible use host-only IPs for the VMs
- The backend connects to PostgreSQL at `10.0.2.4:5432`

## Project Components

- Frontend: React + Vite + Nginx
- Backend: Node.js + Express
- Database: PostgreSQL
- Containerization: Docker
- CI/CD: Jenkins
- Deployment: Ansible
- Virtualization: Oracle VirtualBox

## Smoke Test URLs

- `http://192.168.56.101/api/health`
- `http://192.168.56.101/api/auth/register`
- `http://192.168.56.101/api/auth/login`
