# BILLING PROJECT - FINAL RECOVERY AND STARTUP GUIDE

# IMPORTANT

This project uses the WSL distribution:

```powershell
wsl -d JenkinsWSL
```

Do not use:

```powershell
wsl -d Ubuntu
```

Do not use:

```text
docker-desktop
```

All Docker containers, Jenkins data, Jenkins pipeline configuration, Docker volumes and project infrastructure are inside:

```text
JenkinsWSL
```

---

# PROJECT EXPORT FILES

The complete backup/export package should contain:

```text
billing-app-vm.ova
billing-db-vm.ova
JenkinsWSL.tar
```

These files allow another person to recreate most of the working environment.

---

# PROJECT REPOSITORY

GitHub repository:

```text
https://github.com/Dragneel277/billing-pd-ruben-devops.git
```

Main working branch:

```text
ruben-devops-fixes
```

---

# FINAL NETWORK ARCHITECTURE

The final working network uses two adapters per VM:

1. NAT Network
2. Host-only Adapter

## Final IP addresses

| Machine | NAT Network IP | Host-only IP |
|---|---|---|
| billing-app-vm | 10.0.2.3 | 192.168.56.101 |
| billing-db-vm | 10.0.2.4 | 192.168.56.102 |

## Purpose of each network

| Purpose | Correct IP / Value |
|---|---|
| Jenkins/Ansible to app VM | 192.168.56.101 |
| Jenkins/Ansible to db VM | 192.168.56.102 |
| Backend container to PostgreSQL/db VM | 10.0.2.4 |
| App VM internal NAT address | 10.0.2.3 |
| Frontend/backend Docker network | billing-net |

Important:

The Jenkins pipeline smoke tests must use:

```text
192.168.56.101
```

The backend database host must use:

```text
10.0.2.4
```

The public backend API must be accessed through Nginx:

```text
http://192.168.56.101/api
```

---

# FINAL NETWORK ISOLATION

The final deployment uses an internal Docker network on `billing-app-vm`:

```text
billing-net
```

The frontend and backend containers are connected to this network:

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

- Only the frontend is exposed externally on port `80`
- The backend is no longer exposed externally on port `3000`
- Nginx proxies `/api/*` requests to `billing-backend:3000`
- The backend connects to PostgreSQL on the DB VM through `10.0.2.4:5432`

Final flow:

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

# FINAL WORKING URLS

Frontend:

```text
http://192.168.56.101/login
```

Backend API through Nginx:

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

Direct backend access is intentionally disabled:

```text
http://192.168.56.101:3000
```

A connection refused or timeout on port `3000` is expected.

---

# VM CREDENTIALS

Username:

```text
ruben
```

Password:

```text
12345
```

---

# JENKINS LOGIN

Username:

```text
Ruben
```

Password:

```text
Ruben12345
```

---

# EXPORTING THE PROJECT

## Step A — Export VirtualBox VMs

Open:

```text
Oracle VirtualBox
```

For each VM:

```text
billing-app-vm
billing-db-vm
```

Do:

```text
File → Export Appliance
```

Export each VM as:

```text
billing-app-vm.ova
billing-db-vm.ova
```

Recommended:

- Shutdown the VM before exporting
- Do not export while the VM is suspended
- Do not export while the VM is running

---

## Step B — Export JenkinsWSL

Open PowerShell.

Shutdown WSL:

```powershell
wsl --shutdown
```

Export:

```powershell
wsl --export JenkinsWSL JenkinsWSL.tar
```

Expected output file:

```text
JenkinsWSL.tar
```

This file contains:

- Jenkins container
- Jenkins jobs
- Jenkins credentials
- Jenkins volume
- Docker state
- Docker containers
- Jenkins pipeline configuration
- Ansible environment

---

# IMPORTING THE PROJECT ON ANOTHER COMPUTER

## Step 0 — Install Required Software

The other computer should have:

- Oracle VirtualBox
- WSL enabled
- Docker available inside JenkinsWSL after import
- Git
- Windows Terminal

---

## Step 0.1 — Import JenkinsWSL

Place this file somewhere accessible:

```text
JenkinsWSL.tar
```

Open PowerShell and run:

```powershell
wsl --import JenkinsWSL C:\WSL\JenkinsWSL .\JenkinsWSL.tar
```

Verify:

```powershell
wsl -l -v
```

Expected:

```text
JenkinsWSL
```

Open it:

```powershell
wsl -d JenkinsWSL
```

---

## Step 0.2 — Import Virtual Machines

Open:

```text
Oracle VirtualBox
```

Go to:

```text
File → Import Appliance
```

Import:

```text
billing-app-vm.ova
billing-db-vm.ova
```

---

# VM SHUTDOWN BEFORE SLEEPING

Always shutdown the VMs correctly.

Inside VirtualBox:

```text
Close → Enviar pedido para desligar → OK
```

Do not use:

- Desligar a máquina
- Guardar o estado da máquina

Correct option:

```text
Enviar pedido para desligar
```

---

# STEP 1 — Open Correct WSL

Open Windows Terminal:

```powershell
wsl -d JenkinsWSL
```

---

# STEP 2 — Open Project Folder

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

If the folder does not exist, clone the repository:

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD"
git clone https://github.com/Dragneel277/billing-pd-ruben-devops.git
cd billing-pd-ruben-devops
git checkout ruben-devops-fixes
```

---

# STEP 3 — Start Virtual Machines

Open Oracle VirtualBox.

Start in this order:

```text
1. billing-db-vm
2. billing-app-vm
```

Login:

```text
user: ruben
password: 12345
```

---

# STEP 4 — Verify VM IP Addresses

Inside each VM:

```bash
hostname -I
```

Expected:

DB VM:

```text
NAT: 10.0.2.4
HOST-ONLY: 192.168.56.102
```

APP VM:

```text
NAT: 10.0.2.3
HOST-ONLY: 192.168.56.101
```

---

# QUICK FIX — If IP Changed

Update:

```text
ansible/inventory.ini
```

The inventory should use Host-only IPs, not NAT IPs.

Correct example:

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

Do not use `10.0.2.x` in Ansible inventory.

---

# STEP 5 — Verify Docker

Inside JenkinsWSL:

```bash
docker ps
```

If Jenkins is not running:

```bash
docker ps -a
docker start jenkins
```

---

# STEP 6 — Fix Jenkins Docker Permission

After reboot, Jenkins usually loses Docker socket permission.

Run:

```bash
docker exec -u root -it jenkins bash
```

Inside container:

```bash
chmod 666 /var/run/docker.sock
exit
```

Verify Docker works inside Jenkins:

```bash
docker exec -it jenkins docker ps
```

---

# STEP 7 — Open Jenkins

Open:

```text
http://localhost:8080
```

Go to:

```text
billing-pipeline
```

Click:

```text
Build Now
```

---

# EXPECTED PIPELINE FLOW

```text
Checkout
Build images
Push to Docker Hub
Deploy via Ansible to VMs
Smoke Test Multi-VM
Cleanup Smoke Test Data
Email Notification
SUCCESS
```

---

# STEP 8 — Verify Frontend

Open:

```text
http://192.168.56.101/login
```

If the login page appears, the frontend is working.

---

# STEP 9 — Verify Backend Through Nginx

Run:

```bash
curl http://192.168.56.101/api/health
```

Expected:

```json
{"status":"ok","service":"billing-backend","database":"connected"}
```

---

# STEP 10 — Verify Backend Is Private

Run:

```bash
curl http://192.168.56.101:3000/health
```

Expected:

```text
Connection refused
```

or timeout.

This confirms the backend is no longer publicly exposed and is only reachable through Nginx `/api`.

---

# STEP 11 — Verify Docker Network on App VM

Connect to app VM:

```bash
ssh ruben@192.168.56.101
```

Inspect the network:

```bash
docker network inspect billing-net
```

Expected containers inside `billing-net`:

```text
billing-frontend
billing-backend
```

Expected app VM containers:

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
```

Expected:

```text
billing-frontend   ...   0.0.0.0:80->80/tcp
billing-backend    ...   3000/tcp
```

Exit:

```bash
exit
```

---

# STEP 12 — Verify SSH Connectivity

Test DB VM:

```bash
ssh ruben@192.168.56.102
exit
```

Test APP VM:

```bash
ssh ruben@192.168.56.101
exit
```

Password:

```text
12345
```

---

# STEP 13 — Verify Ansible

Run inside the project folder:

```bash
ansible -i ansible/inventory.ini all -m ping
```

Expected:

```text
app-vm | SUCCESS
db-vm | SUCCESS
```

---

# STEP 14 — Run Manual Deployment

Run inside the project folder:

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

---

# APPLICATION FEATURE CHECKLIST

The final deployed application includes a complete billing management interface.

## Main Features

- Register user
- Login user
- Create bill
- Edit bill
- Delete bill
- Toggle paid/pending status
- Categorize bills
- Filter bills
- Search bills
- View analytics charts

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

## Bill Statuses

```text
pending
paid
overdue
cancelled
```

## Automatic Overdue Detection

If a bill has:

```text
status = pending
due_date < current date
```

then the backend dynamically returns it as:

```text
overdue
```

This means the database may still store the bill as `pending`, but the application displays it as `overdue`.

## Analytics Dashboard

The dashboard includes:

- Summary cards for paid, pending, overdue and cancelled bills
- Monthly spending chart
- Yearly spending chart
- Spending by category chart
- Top spending days chart

## Manual App Test Before Presentation

Open:

```text
http://192.168.56.101/login
```

Then test:

```text
1. Login
2. Create a bill with category Utilities
3. Create a paid bill
4. Create a pending bill with a past due date
5. Confirm it appears as overdue
6. Edit a bill
7. Change category and status
8. Use status filter
9. Use category filter
10. Use search
11. Confirm charts update
12. Delete test bills
```

---

# JENKINSFILE NETWORK VALUES

The Jenkinsfile should use:

```groovy
DB_HOST = '10.0.2.4'
APP_VM_HOST = '192.168.56.101'
DB_VM_HOST = '192.168.56.102'
FRONTEND_URL = 'http://192.168.56.101'
API_URL = 'http://192.168.56.101/api'
```

Smoke tests should use:

```text
http://192.168.56.101/api/health
http://192.168.56.101/api/auth/register
http://192.168.56.101/api/auth/login
```

---

# USEFUL COMMANDS

Open correct WSL:

```powershell
wsl -d JenkinsWSL
```

Shutdown WSL:

```powershell
wsl --shutdown
```

Go to project:

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

Check branch:

```bash
git branch
```

Pull latest changes:

```bash
git pull
```

Show running containers:

```bash
docker ps
```

Show all containers:

```bash
docker ps -a
```

Start Jenkins:

```bash
docker start jenkins
```

Restart Jenkins:

```bash
docker restart jenkins
```

Jenkins logs:

```bash
docker logs jenkins
```

Jenkins logs live:

```bash
docker logs -f jenkins
```

Verify frontend:

```text
http://192.168.56.101/login
```

Verify Jenkins:

```text
http://localhost:8080
```

Verify backend API through Nginx:

```bash
curl http://192.168.56.101/api/health
```

Verify backend direct port is blocked:

```bash
curl http://192.168.56.101:3000/health
```

Verify Ansible:

```bash
ansible -i ansible/inventory.ini all -m ping
```

Verify Docker on VMs:

```bash
ansible -i ansible/inventory.ini all -m shell -a "docker ps"
```

Verify VM IPs:

```bash
ansible -i ansible/inventory.ini all -m shell -a "hostname -I"
```

---

# COMMON QUICK FIXES

## Docker daemon not running

```bash
sudo systemctl start docker
```

---

## Jenkins missing Docker permission

```bash
docker exec -u root -it jenkins bash
chmod 666 /var/run/docker.sock
exit
```

---

## Ansible sudo error

Inside each VM:

```bash
sudo visudo
```

Add:

```text
ruben ALL=(ALL) NOPASSWD:ALL
```

---

## SSH timeout from Jenkins to VM

Check:

- VM is running
- Host-only adapter is enabled
- IP is correct
- inventory uses Host-only IP
- SSH server is running inside VM

Inside VM:

```bash
sudo systemctl status ssh
```

If SSH is stopped:

```bash
sudo systemctl start ssh
```

Enable SSH at boot:

```bash
sudo systemctl enable ssh
```

---

## Host key verification failed

Inside Jenkins container:

```bash
docker exec -it jenkins bash
ssh-keygen -R 192.168.56.101
ssh-keygen -R 192.168.56.102
ssh ruben@192.168.56.101
ssh ruben@192.168.56.102
exit
```

---

## Frontend not loading

```bash
ssh ruben@192.168.56.101
docker ps
docker logs billing-frontend
docker restart billing-frontend
exit
```

---

## Backend not responding through Nginx

```bash
ssh ruben@192.168.56.101
docker ps
docker logs billing-backend
docker logs billing-frontend
docker network inspect billing-net
exit
```

---

## Database not responding

```bash
ssh ruben@192.168.56.102
docker ps
docker logs billing-db
docker restart billing-db
exit
```

---

# FINAL ARCHITECTURE

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
billing-db-vm → PostgreSQL + billing_pgdata volume
billing-app-vm → billing-net → billing-frontend + billing-backend
   ↓
Smoke Tests through Nginx /api
   ↓
Email Notifications
```

---

# FINAL CHECKLIST BEFORE PRESENTATION OR HANDOFF

Before giving the project to another person, verify:

- [ ] `billing-app-vm.ova` exported
- [ ] `billing-db-vm.ova` exported
- [ ] `JenkinsWSL.tar` exported
- [ ] GitHub repository updated
- [ ] Jenkinsfile committed and pushed
- [ ] `ansible/inventory.ini` uses Host-only IPs
- [ ] Jenkins opens at `http://localhost:8080`
- [ ] Frontend opens at `http://192.168.56.101/login`
- [ ] Backend health works at `http://192.168.56.101/api/health`
- [ ] Direct backend port `3000` is not exposed
- [ ] `billing-net` contains `billing-frontend` and `billing-backend`
- [ ] DB only runs on `billing-db-vm`
- [ ] Ansible ping works
- [ ] Jenkins pipeline finishes with `SUCCESS`
- [ ] Docker Hub images are visible
- [ ] Success email notification is received
- [ ] App login works
- [ ] Create bill works
- [ ] Edit bill works
- [ ] Delete bill works
- [ ] Analytics dashboard updates

---

# FINAL NOTES

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

This configuration is the final working version of the project.