# BILLING_PD_TP

## Project Overview

Billing Tracker is a full-stack billing and expense management web application deployed through a complete DevOps workflow.

The project demonstrates:

- Full-stack application development
- Docker containerization
- Jenkins CI/CD pipeline
- Docker Hub image registry
- Ansible automated deployment
- Multi-VM deployment with Oracle VirtualBox
- PostgreSQL persistence
- Internal Docker network isolation
- Reverse proxy routing with Nginx
- Smoke testing
- Email notifications

---

## Repository

```text
https://github.com/Dragneel277/billing-pd-ruben-devops.git
```

Main working branch:

```text
ruben-devops-fixes
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Nginx |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Containers | Docker |
| CI/CD | Jenkins |
| Deployment | Ansible |
| Registry | Docker Hub |
| Virtualization | Oracle VirtualBox |
| WSL Environment | JenkinsWSL |

---

## Application Features

The current application is not only a basic expense tracker. It includes a more complete billing management interface.

Implemented features:

- User registration and login with JWT authentication
- Bill creation
- Bill editing through an edit modal
- Bill deletion
- Search by title, entity or description
- Filters by status, category and date range
- Automatic overdue detection
- Analytics dashboard
- Summary cards
- Monthly spending chart
- Yearly spending chart
- Spending by category chart
- Top spending days chart

---

## Bill Fields

Each bill can contain:

- Title
- Amount
- Entity
- Description
- Due date
- Category
- Status

---

## Bill Categories

```text
rent
utilities
internet
services
food
transport
other
```

---

## Bill Statuses

```text
pending
paid
overdue
cancelled
```

---

## Automatic Overdue Detection

If a bill has:

```text
status = pending
due_date < current date
```

the backend dynamically returns it as:

```text
overdue
```

This means the database may still store the bill as `pending`, but the application displays it as `overdue`.

---

## Current Infrastructure

The project uses two Ubuntu virtual machines in Oracle VirtualBox.

Each VM uses two network adapters:

1. NAT Network
2. Host-only Adapter

| VM | NAT Network IP | Host-only IP | Purpose |
|---|---|---|---|
| billing-app-vm | 10.0.2.3 | 192.168.56.101 | Frontend + Backend |
| billing-db-vm | 10.0.2.4 | 192.168.56.102 | PostgreSQL Database |
| Jenkins Host | localhost | localhost:8080 | CI/CD Server |

---

## Final Network Rule

Host-only IPs are used by Jenkins and Ansible:

```text
Jenkins/Ansible → billing-app-vm: 192.168.56.101
Jenkins/Ansible → billing-db-vm: 192.168.56.102
```

NAT Network IPs are used for internal VM-to-VM communication:

```text
billing-app-vm backend → billing-db-vm PostgreSQL: 10.0.2.4
```

The backend connects to PostgreSQL using:

```text
DB_HOST=10.0.2.4
```

---

## Final Network Isolation

The final deployment uses an internal Docker bridge network on the application VM:

```text
billing-net
```

On `billing-app-vm`, the frontend and backend containers are attached to the same internal Docker network:

```text
billing-frontend
billing-backend
```

Final app VM container exposure:

```text
billing-frontend   0.0.0.0:80->80/tcp
billing-backend    3000/tcp
```

This means:

- The frontend is externally reachable through port `80`
- The backend is not exposed directly through `192.168.56.101:3000`
- Nginx forwards `/api/*` requests to `billing-backend:3000` internally
- The backend remains reachable only inside the Docker network

Final request flow:

```text
Browser/Jenkins
   ↓
http://192.168.56.101
   ↓
billing-frontend / Nginx
   ↓
Docker network: billing-net
   ↓
billing-backend:3000
   ↓
NAT Network
   ↓
billing-db-vm:10.0.2.4:5432
   ↓
billing-db / PostgreSQL
```

---

## Application Access

Frontend:

```text
http://192.168.56.101/login
```

Backend API through Nginx reverse proxy:

```text
http://192.168.56.101/api
```

Backend health endpoint:

```text
http://192.168.56.101/api/health
```

Jenkins:

```text
http://localhost:8080
```

Important:

The backend direct port is intentionally no longer publicly exposed:

```text
http://192.168.56.101:3000
```

A connection refused or timeout on port `3000` is expected in the final architecture.

---

## VM Credentials

```text
user: ruben
password: 12345
```

---

## Jenkins Credentials

If Jenkins asks for login:

```text
Username: Ruben
Password: Ruben12345
```

---

## Docker Hub Images

The Jenkins pipeline builds and pushes:

```text
dragneel277/billing-backend:<BUILD_NUMBER>
dragneel277/billing-backend:latest
dragneel277/billing-frontend:<BUILD_NUMBER>
dragneel277/billing-frontend:latest
```

---

## Jenkins Pipeline

The Jenkinsfile is located at:

```text
jenkins/Jenkinsfile
```

Pipeline stages:

1. Checkout
2. Build backend Docker image
3. Build frontend Docker image
4. Push backend image to Docker Hub
5. Push frontend image to Docker Hub
6. Deploy PostgreSQL to db-vm using Ansible
7. Deploy backend to app-vm using Ansible
8. Deploy frontend to app-vm using Ansible
9. Run smoke tests through Nginx `/api`
10. Clean CI smoke-test user from database
11. Send email notification

---

## Jenkinsfile Network Configuration

The final Jenkinsfile uses:

```groovy
DB_HOST = '10.0.2.4'
APP_VM_HOST = '192.168.56.101'
DB_VM_HOST = '192.168.56.102'
FRONTEND_URL = 'http://192.168.56.101'
API_URL = 'http://192.168.56.101/api'
```

The smoke tests use the API through Nginx:

```text
http://192.168.56.101/api/health
http://192.168.56.101/api/auth/register
http://192.168.56.101/api/auth/login
```

---

## Ansible Deployment

Inventory file:

```text
ansible/inventory.ini
```

Playbook:

```text
ansible/playbook.yml
```

Ansible deploys:

- PostgreSQL container on `billing-db-vm`
- Backend container on `billing-app-vm`
- Frontend container on `billing-app-vm`
- Internal Docker network `billing-net` on `billing-app-vm`
- Persistent PostgreSQL volume `billing_pgdata`

The inventory must use Host-only IPs for SSH:

```ini
[db_servers]
db-vm ansible_host=192.168.56.102 ansible_user=ruben

[backend_servers]
app-vm ansible_host=192.168.56.101 ansible_user=ruben

[frontend_servers]
app-vm ansible_host=192.168.56.101 ansible_user=ruben

[all:vars]
app_port=80
backend_port=3000
db_port=5432
db_name=billing_db
db_user=billing_user
db_host=10.0.2.4
db_bind_host=10.0.2.4
docker_network_name=billing-net
ansible_python_interpreter=/usr/bin/python3
```

---

## Database Persistence

PostgreSQL uses a named Docker volume:

```text
billing_pgdata:/var/lib/postgresql/data
```

This prevents data from being deleted during redeployment.

The database schema is applied by Ansible from:

```text
backend/src/db/init.sql
```

This avoids schema drift between local development and VM deployment.

---

## Jenkins Credentials Required

| Credential ID | Type | Purpose |
|---|---|---|
| dockerhub-creds | Username + Password | Docker Hub login |
| db-password | Secret text | PostgreSQL password |
| jwt-secret | Secret text | JWT signing secret |

Location:

```text
Manage Jenkins → Credentials → System → Global credentials
```

---

## Smoke Tests

After deployment, Jenkins validates:

- Frontend availability
- Backend health endpoint through Nginx
- User registration through Nginx
- User login through Nginx
- Cleanup of CI test user

Smoke test URLs:

```text
http://192.168.56.101
http://192.168.56.101/api/health
http://192.168.56.101/api/auth/register
http://192.168.56.101/api/auth/login
```

---

## Useful Commands

Check Ansible connectivity:

```bash
ansible -i ansible/inventory.ini all -m ping
```

Check Docker on VMs:

```bash
ansible -i ansible/inventory.ini all -m shell -a "docker ps"
```

Check VM IPs:

```bash
ansible -i ansible/inventory.ini all -m shell -a "hostname -I"
```

Manual deployment:

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml \
--extra-vars image_tag=latest \
--extra-vars dockerhub_user=dragneel277 \
--extra-vars db_password=billing_pass \
--extra-vars jwt_secret=mysecret123 \
--extra-vars app_port=80 \
--extra-vars backend_port=3000 \
--extra-vars db_host=10.0.2.4 \
--extra-vars db_bind_host=10.0.2.4
```

Verify backend through Nginx:

```bash
curl http://192.168.56.101/api/health
```

Verify backend is not publicly exposed:

```bash
curl http://192.168.56.101:3000/health
```

Expected:

```text
Connection refused
```

or timeout.

---

## Export and Handoff Files

For another person to test the project, export:

```text
billing-app-vm.ova
billing-db-vm.ova
JenkinsWSL.tar
```

---

## Final Architecture

```text
GitHub Repository
   ↓
Jenkins Pipeline
   ↓
Docker Build
   ↓
Docker Hub Push
   ↓
Ansible Deployment
   ↓
billing-db-vm → PostgreSQL + persistent volume
billing-app-vm → billing-net → Frontend + Backend
   ↓
Smoke Tests through Nginx /api
   ↓
Email Notifications
```

---

## Final Working Configuration

| Component | Final Value |
|---|---|
| WSL distro | JenkinsWSL |
| Jenkins URL | http://localhost:8080 |
| Frontend URL | http://192.168.56.101/login |
| Backend API URL | http://192.168.56.101/api |
| Backend health URL | http://192.168.56.101/api/health |
| App VM Host-only IP | 192.168.56.101 |
| DB VM Host-only IP | 192.168.56.102 |
| App VM NAT IP | 10.0.2.3 |
| DB VM NAT IP | 10.0.2.4 |
| Backend DB host | 10.0.2.4 |
| Internal Docker network | billing-net |
| PostgreSQL volume | billing_pgdata |
| Docker Hub user | dragneel277 |
| VM username | ruben |
| VM password | 12345 |

---

## Final Note

The most important rule is:

```text
Use Host-only IPs for Jenkins and Ansible.
Use NAT IPs for internal VM-to-VM communication.
Expose only frontend port 80.
Keep backend private inside Docker network billing-net.
```

Therefore:

```text
Jenkins/Ansible → 192.168.56.101 and 192.168.56.102
Browser/Jenkins → Frontend → http://192.168.56.101
API access → http://192.168.56.101/api
Frontend/Nginx → Backend → billing-backend:3000
Backend → PostgreSQL → 10.0.2.4:5432
```