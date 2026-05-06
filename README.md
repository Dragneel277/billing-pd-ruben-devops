# BILLING_PD_TP

## Project Overview

Billing Tracker is a full-stack web application for expense management and billing tracking.

The project uses:

- Frontend: React + Vite + Nginx
- Backend: Node.js + Express
- Database: PostgreSQL
- Containers: Docker
- CI/CD: Jenkins
- Deployment Automation: Ansible
- Container Registry: Docker Hub

---

# Current Infrastructure

## Virtual Machines

| VM | IP Address | Purpose |
|---|---|---|
| db-vm | 192.168.1.243 | PostgreSQL Database |
| app-vm | 192.168.1.245 | Backend + Frontend |
| Jenkins Host | localhost:8080 | CI/CD Server |

---

# Application Access

## Frontend

```text
http://192.168.1.245/login
```

## Backend API

```text
http://192.168.1.245:3000
```

## Jenkins

```text
http://localhost:8080
```

---

# Implemented DevOps Features

## Docker

The application is containerized using Docker.

Containers:

- PostgreSQL
- Backend
- Frontend
- Jenkins

Docker images are automatically built during the pipeline execution.

---

## Docker Hub Integration

The Jenkins pipeline automatically:

- Builds Docker images
- Tags images using:
  - build number
  - latest
- Pushes images to Docker Hub

Repositories:

```text
dragneel277/billing-backend
dragneel277/billing-frontend
```

---

# Jenkins CI/CD Pipeline

The Jenkins pipeline is stored in:

```text
jenkins/Jenkinsfile
```

Pipeline stages:

1. Checkout source code
2. Build backend image
3. Build frontend image
4. Push images to Docker Hub
5. Deploy to VMs using Ansible
6. Execute smoke tests
7. Send email notification

---

# Ansible Deployment

Deployment automation is handled using Ansible.

Inventory file:

```text
ansible/inventory.ini
```

Playbook:

```text
ansible/playbook.yml
```

The deployment performs:

- PostgreSQL deployment on db-vm
- Backend deployment on app-vm
- Frontend deployment on app-vm
- Database schema initialization
- Container recreation when new images are available
- Health checks after deployment

---

# Current Inventory Configuration

```ini
[db_servers]
db-vm ansible_host=192.168.1.243 ansible_user=ruben

[backend_servers]
app-vm ansible_host=192.168.1.245 ansible_user=ruben

[frontend_servers]
app-vm ansible_host=192.168.1.245 ansible_user=ruben

[all:vars]
app_port=80
backend_port=3000
db_port=5432
db_name=billing_db
db_user=billing_user
db_host=192.168.1.243
```

---

# Jenkins Credentials Required

The following Jenkins credentials are required:

| Credential ID | Type | Purpose |
|---|---|---|
| dockerhub-creds | Username + Password | Docker Hub authentication |
| db-password | Secret text | PostgreSQL password |
| jwt-secret | Secret text | JWT secret |

Location:

```text
Manage Jenkins → Credentials → System → Global credentials
```

---

# Jenkins Email Notifications

Jenkins is configured to send automatic email notifications for:

- Successful builds
- Failed builds

SMTP configuration uses Gmail SMTP.

Configuration path:

```text
Manage Jenkins → System → E-mail Notification
```

SMTP settings:

```text
SMTP Server: smtp.gmail.com
Port: 587
TLS: Enabled
Authentication: Enabled
```

Google App Password is used instead of the normal Gmail password.

---

# Smoke Tests

After deployment, Jenkins automatically tests:

- Frontend availability
- User registration endpoint
- User login endpoint

Endpoints tested:

```text
http://192.168.1.245
http://192.168.1.245:3000/auth/register
http://192.168.1.245:3000/auth/login
```

---

# Manual Ansible Commands

## Test VM connectivity

```bash
ansible -i ansible/inventory.ini all -m ping
```

## Check Docker on VMs

```bash
ansible -i ansible/inventory.ini all -m shell -a "docker ps"
```

## Manual deployment

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml \
--extra-vars image_tag=latest \
--extra-vars dockerhub_user=dragneel277 \
--extra-vars db_password=billing_pass \
--extra-vars jwt_secret=mysecret123
```

---

# Useful Docker Commands

## View running containers

```bash
docker ps
```

## View Jenkins logs

```bash
docker logs jenkins
```

## Restart Jenkins

```bash
docker restart jenkins
```

---

# SSH Configuration

SSH keys are configured between the Jenkins host and the VMs to allow passwordless Ansible deployment.

VM access examples:

```bash
ssh ruben@192.168.1.243
ssh ruben@192.168.1.245
```

---

# Final Architecture

```text
GitHub
   ↓
Jenkins Pipeline
   ↓
Docker Build
   ↓
Docker Hub
   ↓
Ansible Deployment
   ↓
db-vm → PostgreSQL
app-vm → Backend + Frontend
   ↓
Smoke Tests
   ↓
Email Notifications
```

---

# Current Status

Implemented and functional:

- Dockerized application
- Docker Hub integration
- Jenkins CI/CD pipeline
- Multi-VM deployment
- Ansible automation
- PostgreSQL deployment
- Backend and frontend deployment
- Smoke testing
- Email notifications
- SSH-based VM deployment
