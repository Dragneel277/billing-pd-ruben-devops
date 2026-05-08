# BILLING_PD_TP

## Project Overview

Billing Tracker is a full-stack web application for expense management and billing tracking.

The project implements a complete DevOps workflow using Docker, Jenkins, Ansible, Docker Hub and multiple virtual machines.

The application stack is composed of:

- Frontend: React + Vite + Nginx
- Backend: Node.js + Express
- Database: PostgreSQL
- Containers: Docker
- CI/CD: Jenkins
- Deployment Automation: Ansible
- Container Registry: Docker Hub
- Virtualization: Oracle VirtualBox
- WSL Environment: JenkinsWSL

---

# Repository

```text
https://github.com/Dragneel277/billing-pd-ruben-devops.git
```

Main working branch:

```text
ruben-devops-fixes
```

---

# Current Infrastructure

## Virtual Machines

The project uses two Ubuntu virtual machines in Oracle VirtualBox.

Each VM uses two network adapters:

1. NAT Network  
2. Host-only Adapter  

| VM | NAT Network IP | Host-only IP | Purpose |
|---|---|---|---|
| billing-db-vm | 10.0.2.4 | 192.168.56.102 | PostgreSQL Database |
| billing-app-vm | 10.0.2.3 | 192.168.56.101 | Backend + Frontend |
| Jenkins Host | localhost | localhost:8080 | CI/CD Server |

---

# Network Explanation

The project uses different IPs for different purposes.

## Host-only IPs

Host-only IPs are used by Jenkins and Ansible to access the VMs through SSH.

```text
Jenkins/Ansible → billing-app-vm: 192.168.56.101
Jenkins/Ansible → billing-db-vm: 192.168.56.102
```

## NAT Network IPs

NAT Network IPs are used for communication between the VMs.

```text
billing-app-vm → billing-db-vm: 10.0.2.4
```

The backend connects to PostgreSQL using:

```text
DB_HOST=10.0.2.4
```

---

# Application Access

## Frontend

```text
http://192.168.56.101/login
```

## Backend API

```text
http://192.168.56.101:3000
```

Important:

The backend root route `/` may return:

```text
404 Not Found
```

This is expected because the backend does not expose a root route. The real API endpoints are used for authentication and application operations.

## Jenkins

```text
http://localhost:8080
```

---

# VM Credentials

## Username

```text
ruben
```

## Password

```text
12345
```

---

# Jenkins Credentials

If Jenkins asks for login:

## Username

```text
Ruben
```

## Password

```text
Ruben12345
```

---

# Implemented DevOps Features

## Docker

The application is containerized using Docker.

Main containers:

- PostgreSQL container
- Backend container
- Frontend container
- Jenkins container

Docker is used to package each component and ensure that deployment is reproducible.

---

# Docker Images

The Jenkins pipeline automatically builds Docker images for:

```text
billing-backend
billing-frontend
```

The images are tagged using:

- Jenkins build number
- latest

Example:

```text
dragneel277/billing-backend:34
dragneel277/billing-backend:latest
dragneel277/billing-frontend:34
dragneel277/billing-frontend:latest
```

---

# Docker Hub Integration

Docker Hub is used as the external container registry.

Repositories:

```text
dragneel277/billing-backend
dragneel277/billing-frontend
```

During pipeline execution Jenkins:

1. Builds the backend image
2. Builds the frontend image
3. Logs into Docker Hub
4. Tags the images
5. Pushes the images to Docker Hub

---

# Jenkins CI/CD Pipeline

The Jenkins pipeline is stored in:

```text
jenkins/Jenkinsfile
```

Pipeline stages:

1. Checkout source code
2. Build backend Docker image
3. Build frontend Docker image
4. Push backend image to Docker Hub
5. Push frontend image to Docker Hub
6. Deploy PostgreSQL to the database VM using Ansible
7. Deploy backend to the application VM using Ansible
8. Deploy frontend to the application VM using Ansible
9. Execute smoke tests
10. Send email notification

---

# Jenkinsfile Network Configuration

The final Jenkinsfile uses the following important values:

```groovy
DB_HOST = '10.0.2.4'
APP_VM_HOST = '192.168.56.101'
BACKEND_URL = 'http://192.168.56.101:3000'
FRONTEND_URL = 'http://192.168.56.101'
```

Explanation:

```text
DB_HOST = 10.0.2.4
```

This is used by the backend container to connect to PostgreSQL on the database VM.

```text
BACKEND_URL = http://192.168.56.101:3000
FRONTEND_URL = http://192.168.56.101
```

These are used by Jenkins smoke tests because Jenkins reaches the app VM through the Host-only network.

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

Ansible performs:

- Docker installation verification
- Python Docker SDK installation
- PostgreSQL container deployment on db-vm
- Database schema initialization
- Backend container deployment on app-vm
- Frontend container deployment on app-vm
- Container recreation when new images are available
- Health checks after deployment

---

# Current Inventory Configuration

The inventory should use Host-only IPs.

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
```

Important:

- `ansible_host` uses Host-only IPs.
- `db_host` uses the NAT Network IP of the database VM.

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

A Google App Password is used instead of the normal Gmail password.

---

# Smoke Tests

After deployment, Jenkins automatically tests:

- Frontend availability
- User registration endpoint
- User login endpoint

Smoke test URLs:

```text
http://192.168.56.101
http://192.168.56.101:3000/auth/register
http://192.168.56.101:3000/auth/login
```

The backend root route is not used as a required health check because it can return:

```text
404 Not Found
```

That behavior is expected.

---

# Manual Ansible Commands

## Test VM connectivity

```bash
ansible -i ansible/inventory.ini all -m ping
```

Expected result:

```text
app-vm | SUCCESS
db-vm | SUCCESS
```

---

## Check Docker on VMs

```bash
ansible -i ansible/inventory.ini all -m shell -a "docker ps"
```

---

## Check VM IPs

```bash
ansible -i ansible/inventory.ini all -m shell -a "hostname -I"
```

---

## Manual deployment

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml \
--extra-vars image_tag=latest \
--extra-vars dockerhub_user=dragneel277 \
--extra-vars db_password=billing_pass \
--extra-vars jwt_secret=mysecret123 \
--extra-vars app_port=80 \
--extra-vars db_host=10.0.2.4
```

---

# Useful Docker Commands

## View running containers

```bash
docker ps
```

---

## View all containers

```bash
docker ps -a
```

---

## View Jenkins logs

```bash
docker logs jenkins
```

---

## View Jenkins logs live

```bash
docker logs -f jenkins
```

---

## Start Jenkins

```bash
docker start jenkins
```

---

## Restart Jenkins

```bash
docker restart jenkins
```

---

## Fix Jenkins Docker socket permission

After reboot, Jenkins may lose permission to access Docker.

Run:

```bash
docker exec -u root -it jenkins bash
chmod 666 /var/run/docker.sock
exit
```

Verify:

```bash
docker exec -it jenkins docker ps
```

---

# SSH Configuration

SSH is used by Jenkins and Ansible to deploy to the VMs.

VM access examples:

```bash
ssh ruben@192.168.56.102
ssh ruben@192.168.56.101
```

Password:

```text
12345
```

---

# SSH Host Key Fix

If Jenkins or Ansible shows:

```text
Host key verification failed
```

Enter the Jenkins container:

```bash
docker exec -it jenkins bash
```

Remove old host keys:

```bash
ssh-keygen -R 192.168.56.101
ssh-keygen -R 192.168.56.102
```

Reconnect manually:

```bash
ssh ruben@192.168.56.101
ssh ruben@192.168.56.102
```

Answer:

```text
yes
```

Exit:

```bash
exit
```

---

# Export and Handoff Files

For another person to test the project, the exported package should include:

```text
billing-app-vm.ova
billing-db-vm.ova
JenkinsWSL.tar
```

The GitHub repository should also be updated with:

- latest Jenkinsfile
- latest Ansible inventory
- latest Ansible playbook
- updated README.md
- updated guide.md

---

# Importing the Project on Another Computer

## Import JenkinsWSL

PowerShell:

```powershell
wsl --import JenkinsWSL C:\WSL\JenkinsWSL .\JenkinsWSL.tar
```

Open it:

```powershell
wsl -d JenkinsWSL
```

---

## Import VirtualBox VMs

Open Oracle VirtualBox:

```text
File → Import Appliance
```

Import:

```text
billing-app-vm.ova
billing-db-vm.ova
```

---

# Expected Pipeline Flow

```text
GitHub Checkout
   ↓
Build backend Docker image
   ↓
Build frontend Docker image
   ↓
Push images to Docker Hub
   ↓
Deploy with Ansible
   ↓
Run smoke tests
   ↓
Send email notification
```

---

# Final Architecture

```text
GitHub Repository
   ↓
Jenkins Pipeline
   ↓
Docker Build
   ↓
Docker Hub
   ↓
Ansible Deployment
   ↓
billing-db-vm → PostgreSQL
billing-app-vm → Backend + Frontend
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
- Backend deployment
- Frontend deployment
- Smoke testing
- Email notifications
- SSH-based VM deployment
- Exportable VirtualBox VM infrastructure
- Exportable JenkinsWSL environment

---

# Final Working Configuration Summary

| Component | Final Value |
|---|---|
| WSL distro | JenkinsWSL |
| Jenkins URL | http://localhost:8080 |
| Frontend URL | http://192.168.56.101/login |
| Backend URL | http://192.168.56.101:3000 |
| App VM Host-only IP | 192.168.56.101 |
| DB VM Host-only IP | 192.168.56.102 |
| App VM NAT IP | 10.0.2.3 |
| DB VM NAT IP | 10.0.2.4 |
| Backend DB host | 10.0.2.4 |
| Docker Hub user | dragneel277 |
| VM username | ruben |
| VM password | 12345 |

---

# Final Notes

The most important network rule is:

```text
Use Host-only IPs for Jenkins and Ansible.
Use NAT IPs for internal VM-to-VM communication.
```

Therefore:

```text
Jenkins/Ansible → 192.168.56.101 and 192.168.56.102
Backend → PostgreSQL → 10.0.2.4
```

This is the final working version of the DevOps infrastructure.