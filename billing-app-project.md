# BILLING PD TP — Academic Project Documentation

## 1. Project Overview

**Billing Tracker** is an academic full-stack project developed to demonstrate both application development and DevOps delivery practices.

The project consists of a billing and expense management application deployed across two VirtualBox virtual machines and automated with Jenkins, Docker, Docker Hub and Ansible.

The final goal was to create a system where a code change can be transformed into a running application version through an automated pipeline:

```text
GitHub → Jenkins → Docker Build → Docker Hub → Ansible Deploy → Smoke Tests → Email Notification
```

Final/main repository:

```text
https://github.com/Dragneel277/billing-pd-ruben-devops.git
```

Final branch:

```text
ruben-devops-fixes
```

A shared copy was also sent to the teammate repository for review:

```text
https://github.com/RicardoDR14/BILLING_PD_TP/tree/final-updates-ui
```

---

## 2. Project Objectives

The main objectives of this project were:

- Develop a functional full-stack billing application
- Containerize frontend, backend and database services
- Build a complete CI/CD pipeline with Jenkins
- Publish Docker images to Docker Hub
- Automate deployment to multiple VMs using Ansible
- Validate the deployment with smoke tests
- Improve runtime architecture with network isolation
- Keep PostgreSQL data persistent across redeployments

---

## 3. Application Description

The application allows users to manage personal bills and expenses.

Main application features:

- User registration
- User login with JWT authentication
- Create bills
- Edit bills
- Delete bills
- Search by title, entity or description
- Filter by category, status and date range
- Categorize bills
- Manage bill statuses
- Automatic overdue detection
- Analytics dashboard with charts

Bill categories:

```text
rent
utilities
internet
services
food
transport
other
```

Bill statuses:

```text
pending
paid
overdue
cancelled
```

Automatic overdue behavior:

```text
If status = pending and due_date < current date,
the application displays the bill as overdue.
```

---

## 4. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Nginx |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Authentication | JWT |
| Containers | Docker |
| Image Registry | Docker Hub |
| CI/CD | Jenkins |
| Deployment Automation | Ansible |
| Virtualization | Oracle VirtualBox |
| Local CI Environment | JenkinsWSL |
| Version Control | Git + GitHub |

---

## 5. Repository Structure

```text
billing-pd-ruben-devops/
├── ansible/
│   ├── inventory.ini
│   └── playbook.yml
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── index.js
│       ├── routes/
│       ├── middleware/
│       └── db/
│           ├── client.js
│           └── init.sql
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── jenkins/
│   └── Jenkinsfile
├── README.md
├── quickstart.md
├── guide.md
└── billing-app-project.md
```

---

## 6. Final Deployment Architecture

The final system is deployed across two Ubuntu virtual machines.

| VM | Host-only IP | NAT IP | Role |
|---|---|---|---|
| `billing-app-vm` | `192.168.56.101` | `10.0.2.3` | Frontend + Backend |
| `billing-db-vm` | `192.168.56.102` | `10.0.2.4` | PostgreSQL |

Jenkins runs locally inside the `JenkinsWSL` environment and is accessible at:

```text
http://localhost:8080
```

Final access URLs:

| Component | URL |
|---|---|
| Frontend | `http://192.168.56.101/login` |
| Public API | `http://192.168.56.101/api` |
| Health endpoint | `http://192.168.56.101/api/health` |
| Jenkins | `http://localhost:8080` |

---

## 7. Network Architecture

The project uses two types of VirtualBox networking.

### Host-only network

Used by Jenkins and Ansible to access the VMs through SSH:

```text
Jenkins/Ansible → billing-app-vm: 192.168.56.101
Jenkins/Ansible → billing-db-vm: 192.168.56.102
```

### NAT network

Used for internal VM-to-VM communication:

```text
Backend → PostgreSQL: 10.0.2.4:5432
```

The backend connects to the database using:

```text
DB_HOST=10.0.2.4
```

---

## 8. Internal Docker Network

On `billing-app-vm`, the final deployment uses an internal Docker network:

```text
billing-net
```

Containers attached to this network:

```text
billing-frontend
billing-backend
```

Final container exposure on `billing-app-vm`:

```text
billing-frontend   0.0.0.0:80->80/tcp
billing-backend    3000/tcp
```

This means:

- The frontend is exposed externally on port `80`
- The backend is not exposed directly on port `3000`
- API requests are routed through Nginx using `/api`
- Frontend and backend communicate internally using Docker DNS

Final request flow:

```text
Browser
   ↓
http://192.168.56.101
   ↓
billing-frontend / Nginx
   ↓
/api/*
   ↓
billing-backend:3000
   ↓
PostgreSQL on 10.0.2.4:5432
```

Direct backend access is intentionally blocked:

```text
http://192.168.56.101:3000
```

Expected result:

```text
Connection refused
```

or timeout.

---

## 9. Docker Usage

Docker is used to package each application component into isolated containers.

Main containers:

| Container | Role |
|---|---|
| `billing-frontend` | React frontend served by Nginx |
| `billing-backend` | Node.js/Express API |
| `billing-db` | PostgreSQL database |
| `jenkins` | CI/CD server |

Docker provides:

- Isolated execution environments
- Consistent application runtime
- Reproducible deployment
- Easier integration with Jenkins and Ansible

The same Docker images built by Jenkins are later pulled and executed by Ansible on the target VMs.

---

## 10. Docker Hub Usage

Docker Hub is used as the image registry.

Images published by Jenkins:

```text
dragneel277/billing-backend:<BUILD_NUMBER>
dragneel277/billing-backend:latest
dragneel277/billing-frontend:<BUILD_NUMBER>
dragneel277/billing-frontend:latest
```

The `BUILD_NUMBER` tag provides traceability.

Example:

```text
dragneel277/billing-backend:56
dragneel277/billing-frontend:56
```

The `latest` tag points to the most recent version.

Docker Hub connects the build phase to the deployment phase:

```text
Jenkins builds and pushes images.
Ansible pulls and deploys those images.
```

---

## 11. Jenkins Pipeline

The pipeline is defined in:

```text
jenkins/Jenkinsfile
```

Pipeline stages:

```text
Checkout
Build images
Push to Docker Hub
Deploy via Ansible to VMs
Smoke Test Multi-VM
Cleanup test data
Email notification
```

Jenkins responsibilities:

- Fetch source code from GitHub
- Build backend Docker image
- Build frontend Docker image
- Authenticate with Docker Hub
- Push images with `BUILD_NUMBER` and `latest`
- Execute Ansible deployment
- Run smoke tests
- Clean temporary test data
- Send success/failure email notification

Sensitive values such as Docker Hub credentials, database password and JWT secret are stored in Jenkins Credentials Store.

---

## 12. Ansible Deployment

Ansible is responsible for the deployment automation.

Main files:

```text
ansible/inventory.ini
ansible/playbook.yml
```

The inventory defines the target VMs:

```ini
[db_servers]
db-vm ansible_host=192.168.56.102 ansible_user=ruben

[backend_servers]
app-vm ansible_host=192.168.56.101 ansible_user=ruben

[frontend_servers]
app-vm ansible_host=192.168.56.101 ansible_user=ruben
```

The playbook performs tasks such as:

- Install or verify Docker
- Install Python Docker SDK
- Deploy PostgreSQL on `billing-db-vm`
- Create persistent database volume
- Apply database schema
- Create Docker network `billing-net`
- Deploy backend on `billing-app-vm`
- Deploy frontend on `billing-app-vm`
- Validate service availability

Ansible makes the deployment repeatable and reduces manual configuration.

---

## 13. Database and Persistence

PostgreSQL runs on:

```text
billing-db-vm
```

Container:

```text
billing-db
```

Persistent volume:

```text
billing_pgdata
```

The database schema is applied from:

```text
backend/src/db/init.sql
```

Using a persistent Docker volume prevents data loss when the database container is recreated.

This was an important final improvement because without a volume, redeploying the database container could reset the stored application data.

---

## 14. Database Schema

The application uses two main tables:

```text
users
expenses
```

The `users` table stores registered users and password hashes.

The `expenses` table stores bills/expenses associated with a user, including:

```text
title
description
entity
category
amount
status
due_date
created_at
updated_at
```

The schema supports:

- categories
- extended statuses
- due dates
- per-user data ownership
- indexes for filtering by status, category and date

The schema is idempotent, meaning it can be applied multiple times safely.

---

## 15. Nginx Reverse Proxy

The frontend container uses Nginx.

Nginx has two responsibilities:

1. Serve the compiled React frontend
2. Proxy API requests to the backend

API requests use:

```text
/api/*
```

Internally, Nginx forwards those requests to:

```text
billing-backend:3000
```

This allows the browser to use a single public entry point:

```text
http://192.168.56.101
```

while keeping the backend private inside the Docker network.

---

## 16. Authentication Flow

The application uses JWT authentication.

Authentication flow:

```text
1. User sends login credentials
2. Backend validates the credentials
3. Backend generates a JWT token
4. Frontend stores the token
5. Future requests include Authorization: Bearer <token>
6. Backend middleware validates the token
7. Protected routes become accessible
```

Protected routes include:

```text
/api/expenses
/api/analytics
```

This ensures users can access only their own data.

---

## 17. Smoke Tests

After deployment, Jenkins runs smoke tests.

Smoke test endpoints:

```text
http://192.168.56.101
http://192.168.56.101/api/health
http://192.168.56.101/api/auth/register
http://192.168.56.101/api/auth/login
```

The smoke tests validate:

- frontend availability
- backend availability through Nginx
- database connection through `/api/health`
- user registration
- user login
- authentication flow

After the tests, Jenkins removes the temporary test user to keep the database clean.

Smoke tests confirm that the deployment did not only finish without errors, but that the application is actually functional.

---

## 18. Health Endpoint

The backend exposes a health endpoint:

```text
/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "billing-backend",
  "database": "connected"
}
```

This endpoint confirms:

- the backend is running
- the backend can connect to PostgreSQL
- Nginx reverse proxy is correctly forwarding `/api` requests

---

## 19. Security and Isolation Improvements

Final architecture improvements:

| Improvement | Result |
|---|---|
| Backend direct port removed | Backend no longer exposed on `192.168.56.101:3000` |
| Internal Docker network | Frontend and backend communicate through `billing-net` |
| Nginx reverse proxy | Public API access goes through `/api` |
| Persistent DB volume | Data survives redeployments |
| Jenkins credentials | Secrets are not stored in source code |
| Smoke test cleanup | Temporary CI users do not accumulate |

The most important runtime rule:

```text
Expose only the frontend.
Keep the backend private.
Route API traffic through Nginx.
Keep PostgreSQL on a separate VM.
```

---

## 20. Validation Commands

Health check:

```bash
curl http://192.168.56.101/api/health
```

Expected:

```json
{"status":"ok","service":"billing-backend","database":"connected"}
```

Verify backend is private:

```bash
curl http://192.168.56.101:3000/health
```

Expected:

```text
Connection refused
```

or timeout.

Check app VM containers:

```bash
ssh ruben@192.168.56.101
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
exit
```

Expected:

```text
billing-frontend   0.0.0.0:80->80/tcp
billing-backend    3000/tcp
```

Check Docker network:

```bash
ssh ruben@192.168.56.101
docker network inspect billing-net
exit
```

Expected containers:

```text
billing-frontend
billing-backend
```

Check DB VM:

```bash
ssh ruben@192.168.56.102
docker ps
exit
```

Expected:

```text
billing-db
```

---

## 21. Final Application Test Checklist

Manual functional tests:

```text
[ ] Register user
[ ] Login
[ ] Create bill
[ ] Edit bill
[ ] Delete bill
[ ] Change bill category
[ ] Change bill status
[ ] Search bills
[ ] Filter by status
[ ] Filter by category
[ ] Create overdue bill
[ ] Confirm automatic overdue display
[ ] Check analytics dashboard
```

Infrastructure tests:

```text
[ ] Jenkins pipeline finishes with SUCCESS
[ ] Docker Hub receives new image tags
[ ] Ansible deploys containers to VMs
[ ] /api/health returns status ok
[ ] Direct backend port :3000 is blocked
[ ] PostgreSQL data persists after redeploy
[ ] Email notification is received
```

---

## 22. Limitations and Future Improvements

This project was built as an academic local VirtualBox environment.

Possible future improvements:

- Add UFW/firewall rules on the DB VM
- Add HTTPS
- Use a production-grade reverse proxy configuration
- Add unit tests and integration tests
- Add rollback strategy using previous Docker image tags
- Use a secrets manager
- Deploy to cloud infrastructure with private subnets
- Use monitoring and metrics tools

---

## 23. Conclusion

The project demonstrates a complete DevOps delivery flow applied to a real full-stack application.

The final solution includes:

```text
GitHub source control
Jenkins CI/CD pipeline
Dockerized frontend and backend
Docker Hub image registry
Ansible automated deployment
PostgreSQL persistence
Multi-VM runtime architecture
Nginx reverse proxy
Smoke test validation
Email notification
```

The final result is a working, automated and reproducible deployment process where a code change can be built, published, deployed, tested and validated through a complete pipeline.

The application is accessible through:

```text
http://192.168.56.101/login
```

and the API is accessed through:

```text
http://192.168.56.101/api
```