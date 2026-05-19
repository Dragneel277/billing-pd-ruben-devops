# Billing PD — Recovery, Startup and Troubleshooting Guide

## Overview

This guide documents the final deployment architecture for the billing application and explains how to recover, restart, and troubleshoot the environment.

## Final Architecture Summary

- Frontend URL: `http://192.168.56.101/login`
- Public API: `http://192.168.56.101/api`
- Health endpoint: `http://192.168.56.101/api/health`
- Backend direct access: intentionally blocked on `http://192.168.56.101:3000`
- App VM host-only IP: `192.168.56.101`
- App VM NAT IP: `10.0.2.3`
- DB VM host-only IP: `192.168.56.102`
- DB VM NAT IP: `10.0.2.4`
- Jenkins: `http://localhost:8080`
- Internal Docker network: `billing-net`
- PostgreSQL volume: `billing_pgdata`

## Required Environments

- Oracle VirtualBox
- WSL distro: `JenkinsWSL`
- Docker available inside `JenkinsWSL`
- Git
- Windows Terminal or PowerShell

## VM Roles

| VM | Host-only IP | NAT IP | Role |
|---|---|---|---|
| billing-app-vm | 192.168.56.101 | 10.0.2.3 | Frontend + Backend |
| billing-db-vm | 192.168.56.102 | 10.0.2.4 | PostgreSQL |

## Network Rules

- Jenkins and Ansible use Host-only IPs.
- The backend connects to the DB using NAT IP `10.0.2.4`.
- The frontend and backend communicate inside `billing-net`.
- Only the frontend port `80` is exposed externally.
- The backend port `3000` is internal only.

## Startup

### Step 1 — Start VMs

Open VirtualBox and start:

1. `billing-db-vm`
2. `billing-app-vm`

### Step 2 — Open WSL

```powershell
wsl -d JenkinsWSL
```

### Step 3 — Navigate to the repo

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

### Step 4 — Verify inventory and network

Ensure `ansible/inventory.ini` uses host-only IPs:

```ini
[db_servers]
db-vm ansible_host=192.168.56.102 ansible_user=ruben

[backend_servers]
app-vm ansible_host=192.168.56.101 ansible_user=ruben

[frontend_servers]
app-vm ansible_host=192.168.56.101 ansible_user=ruben
```

Do not use NAT IPs in Ansible inventory.

## Jenkins & Docker Checks

### Verify Jenkins container

```bash
docker ps
```

If Jenkins is stopped:

```bash
docker start jenkins
```

### Fix Docker socket permissions

```bash
docker exec -u root -it jenkins bash
chmod 666 /var/run/docker.sock
exit
```

Confirm:

```bash
docker exec -it jenkins docker ps
```

## Running the pipeline

Open:

```text
http://localhost:8080
```

Run the Jenkins pipeline and confirm it completes successfully.

## Verification

### Frontend

Open:

```text
http://192.168.56.101/login
```

### Backend health

```bash
curl http://192.168.56.101/api/health
```

Expected successful health response.

### Backend direct port

```bash
curl http://192.168.56.101:3000/health
```

Expected:

- `Connection refused`
- or timeout

This confirms the backend is no longer publicly exposed.

### Smoke test endpoints

- `http://192.168.56.101/api/health`
- `http://192.168.56.101/api/auth/register`
- `http://192.168.56.101/api/auth/login`

## Database deployment

PostgreSQL is deployed on `billing-db-vm` and persists data using volume `billing_pgdata`.

Ansible applies schema from:

```text
backend/src/db/init.sql
```

This ensures the same schema is used in the deployed DB as in the application source.

## Docker network

On `billing-app-vm`, the final internal network is:

```text
billing-net
```

Containers attached:

- `billing-frontend`
- `billing-backend`

Final container exposure:

- `billing-frontend`: `0.0.0.0:80->80/tcp`
- `billing-backend`: `3000/tcp`

## Troubleshooting

### Host key verification failed

Inside Jenkins container:

```bash
docker exec -it jenkins bash
ssh-keygen -R 192.168.56.101
ssh-keygen -R 192.168.56.102
ssh ruben@192.168.56.101
ssh ruben@192.168.56.102
exit
```

Accept the host keys when prompted.

### SSH access

```bash
ssh ruben@192.168.56.101
ssh ruben@192.168.56.102
```

Password:

```text
12345
```

### Docker network check

```bash
ssh ruben@192.168.56.101
docker network inspect billing-net
exit
```

Expect `billing-frontend` and `billing-backend` inside `billing-net`.

### Verify DB connection

```bash
ssh ruben@192.168.56.102
docker ps
docker logs billing-db
exit
```

## Deployment details

The final deployment uses:

- `billing-net` internal Docker network
- `billing_pgdata` persistent PostgreSQL volume
- frontend served on port `80`
- backend internal on port `3000`
- Nginx proxy for `/api` requests
- schema init from `backend/src/db/init.sql`

## Final URLs

- Frontend: `http://192.168.56.101/login`
- API: `http://192.168.56.101/api`
- Health: `http://192.168.56.101/api/health`
- Jenkins: `http://localhost:8080`

## Final checklist

- [ ] Start `billing-db-vm`
- [ ] Start `billing-app-vm`
- [ ] Open `JenkinsWSL`
- [ ] Run Jenkins pipeline
- [ ] Verify frontend URL
- [ ] Verify health endpoint
- [ ] Verify direct backend port is blocked
- [ ] Confirm `billing-net` includes frontend and backend
- [ ] Confirm PostgreSQL persists with `billing_pgdata`
