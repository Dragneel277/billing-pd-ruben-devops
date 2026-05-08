# BILLING PROJECT - FINAL RECOVERY AND STARTUP GUIDE

# IMPORTANT

This project uses the WSL distribution:

```powershell
wsl -d JenkinsWSL
```

DO NOT use:

```powershell
wsl -d Ubuntu
```

DO NOT use:

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

| Purpose | Correct IP |
|---|---|
| Jenkins/Ansible to app VM | 192.168.56.101 |
| Jenkins/Ansible to db VM | 192.168.56.102 |
| backend container to PostgreSQL/db VM | 10.0.2.4 |
| app VM internal NAT address | 10.0.2.3 |

IMPORTANT:

The Jenkins pipeline smoke tests must use:

```text
192.168.56.101
```

The backend database host must use:

```text
10.0.2.4
```

---

# FINAL WORKING URLS

## Frontend

```text
http://192.168.56.101/login
```

## Backend API

```text
http://192.168.56.101:3000
```

## Jenkins

```text
http://localhost:8080
```

---

# EXPORTING THE PROJECT

# STEP A — Export VirtualBox VMs

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
- shutdown the VM before exporting
- do not export while the VM is suspended
- do not export while the VM is running

---

# STEP B — Export JenkinsWSL

Open PowerShell as normal user or administrator.

First shutdown WSL:

```powershell
wsl --shutdown
```

Then export:

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

# STEP 0 — Install Required Software

The other computer should have:

- Oracle VirtualBox
- WSL enabled
- Docker available inside JenkinsWSL after import
- Git
- Windows Terminal

---

# STEP 0.1 — Import JenkinsWSL

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

# STEP 0.2 — Import Virtual Machines

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

After importing, verify that both VMs exist:

```text
billing-app-vm
billing-db-vm
```

---

# VM SHUTDOWN BEFORE SLEEPING

Always shutdown the VMs correctly.

Inside VirtualBox:

```text
Close → Enviar pedido para desligar → OK
```

Do NOT use:

- Desligar a máquina
- Guardar o estado da máquina

Correct option:

```text
Enviar pedido para desligar
```

---

# VM CREDENTIALS

## Username

```text
ruben
```

## Password

```text
12345
```

---

# STEP 1 — Open Correct WSL

Open:

```text
Windows Terminal
```

Then execute:

```powershell
wsl -d JenkinsWSL
```

Expected:

```bash
ruben@RubenBentosa:~
```

Verify current distro:

```bash
pwd
```

---

# STEP 2 — Open Project Folder

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

Verify files:

```bash
ls
```

Expected:

```text
ansible
backend
frontend
jenkins
README.md
guide.md
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

Open:

```text
Oracle VirtualBox
```

Start in this order:

## 1. billing-db-vm

Login:

```text
user: ruben
password: 12345
```

## 2. billing-app-vm

Login:

```text
user: ruben
password: 12345
```

---

# STEP 4 — Verify VM IP Addresses

Inside EACH VM:

```bash
ip a
```

or:

```bash
hostname -I
```

Expected:

## DB VM

```text
NAT: 10.0.2.4
HOST-ONLY: 192.168.56.102
```

## APP VM

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
```

IMPORTANT:

Do not use `10.0.2.x` in Ansible inventory.

Ansible/Jenkins must access the VMs through Host-only IPs:

```text
192.168.56.101
192.168.56.102
```

---

# STEP 5 — Verify Docker

Inside JenkinsWSL:

```bash
docker ps
```

Expected containers may include:

```text
jenkins
billing-frontend
billing-backend
billing-db
```

If only Jenkins is running, that is also acceptable before deployment.

---

# QUICK FIX — If Containers Are Missing

Show all containers:

```bash
docker ps -a
```

Start manually if needed:

```bash
docker start billing-db
docker start billing-backend
docker start billing-frontend
```

---

# STEP 6 — Start Jenkins

Verify Jenkins exists:

```bash
docker ps -a
```

Expected:

```text
jenkins
```

Start Jenkins:

```bash
docker start jenkins
```

Verify:

```bash
docker ps
```

Expected:

```text
jenkins
```

with:

```text
0.0.0.0:8080->8080
```

---

# STEP 7 — FIX JENKINS DOCKER PERMISSION

IMPORTANT:

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

Verify Docker works INSIDE Jenkins:

```bash
docker exec -it jenkins docker ps
```

Expected:
- list of containers appears
- no permission denied error

---

# STEP 8 — Open Jenkins

Open browser:

```text
http://localhost:8080
```

Expected:
- old Jenkins dashboard
- billing-pipeline
- previous builds
- email config
- credentials

---

# Jenkins Login

If Jenkins asks for login credentials:

## Username

```text
Ruben
```

## Password

```text
Ruben12345
```

---

# STEP 9 — Verify Frontend

Open:

```text
http://192.168.56.101/login
```

If login page appears:
- frontend is working

---

# STEP 10 — Verify Backend

Run:

```bash
curl http://192.168.56.101:3000
```

Expected result:

```text
404 Not Found
```

IMPORTANT:

This is expected because the backend does not expose a root route `/`.

The backend is still working if the API endpoints work, for example:

```text
/auth/register
/auth/login
```

---

# STEP 11 — Verify SSH Connectivity

Test DB VM:

```bash
ssh ruben@192.168.56.102
```

Then:

```bash
exit
```

Test APP VM:

```bash
ssh ruben@192.168.56.101
```

Then:

```bash
exit
```

Password if asked:

```text
12345
```

---

# QUICK FIX — If SSH Asks Password

Generate SSH key:

```bash
ssh-keygen
```

Copy SSH key to DB VM:

```bash
ssh-copy-id ruben@192.168.56.102
```

Copy SSH key to APP VM:

```bash
ssh-copy-id ruben@192.168.56.101
```

Password:

```text
12345
```

---

# QUICK FIX — If Host Key Verification Failed

This can happen after changing IPs, reimporting VMs, or recreating network adapters.

Inside JenkinsWSL:

```bash
docker exec -it jenkins bash
```

Inside Jenkins container:

```bash
ssh-keygen -R 192.168.56.101
ssh-keygen -R 192.168.56.102
```

Reconnect manually:

```bash
ssh ruben@192.168.56.101
```

Answer:

```text
yes
```

Exit:

```bash
exit
```

Then test DB:

```bash
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

Exit Jenkins container:

```bash
exit
```

---

# STEP 12 — Verify Ansible

Run inside the project folder:

```bash
ansible -i ansible/inventory.ini all -m ping
```

Expected:

```text
app-vm | SUCCESS
db-vm | SUCCESS
```

If Ansible fails with SSH timeout:
- verify VMs are running
- verify Host-only adapter is enabled
- verify IPs are correct
- verify inventory uses `192.168.56.x`

---

# STEP 13 — Run Manual Deployment

Run inside the project folder:

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml \
--extra-vars image_tag=latest \
--extra-vars dockerhub_user=dragneel277 \
--extra-vars db_password=billing_pass \
--extra-vars jwt_secret=mysecret123 \
--extra-vars app_port=80 \
--extra-vars db_host=10.0.2.4
```

IMPORTANT:

The database host must be:

```text
10.0.2.4
```

because the backend communicates with the database through the NAT Network.

---

# STEP 14 — Open Jenkins Pipeline

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
Email Notification
SUCCESS
```

---

# EXPECTED FINAL RESULT

Successful pipeline should:

- checkout the GitHub repository
- build backend Docker image
- build frontend Docker image
- push backend image to Docker Hub
- push frontend image to Docker Hub
- deploy PostgreSQL container on db-vm
- deploy backend container on app-vm
- deploy frontend container on app-vm
- run smoke tests through Host-only IP
- send success email notification

Expected Jenkins status:

```text
SUCCESS
```

---

# STEP 15 — Verify Email Notification

Check:

```text
rubenkiler@gmail.com
```

Expected:

```text
SUCCESS: Billing Pipeline #...
```

or:

```text
FAILURE: Billing Pipeline #...
```

---

# JENKINSFILE NETWORK VALUES

The Jenkinsfile should use:

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

Used by backend to connect to PostgreSQL.

```text
FRONTEND_URL = 192.168.56.101
BACKEND_URL = 192.168.56.101:3000
```

Used by Jenkins smoke tests.

---

# USEFUL COMMANDS

## Open correct WSL

```powershell
wsl -d JenkinsWSL
```

---

## Shutdown WSL

```powershell
wsl --shutdown
```

---

## Go to project

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

---

## Check branch

```bash
git branch
```

---

## Pull latest changes

```bash
git pull
```

---

## Show running containers

```bash
docker ps
```

---

## Show all containers

```bash
docker ps -a
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

## Jenkins logs

```bash
docker logs jenkins
```

---

## Jenkins logs live

```bash
docker logs -f jenkins
```

---

## Start application containers

```bash
docker start billing-db
docker start billing-backend
docker start billing-frontend
```

---

## Restart application containers

```bash
docker restart billing-db
docker restart billing-backend
docker restart billing-frontend
```

---

## Verify frontend

```text
http://192.168.56.101/login
```

---

## Verify Jenkins

```text
http://localhost:8080
```

---

## Verify backend API

```bash
curl http://192.168.56.101:3000
```

Expected:

```text
404 Not Found
```

This is normal because `/` is not an API route.

---

## Verify Ansible

```bash
ansible -i ansible/inventory.ini all -m ping
```

---

## Verify Docker on VMs

```bash
ansible -i ansible/inventory.ini all -m shell -a "docker ps"
```

---

## Verify VM IPs through Ansible

```bash
ansible -i ansible/inventory.ini all -m shell -a "hostname -I"
```

---

# COMMON QUICK FIXES

# Docker daemon not running

Inside the relevant Linux environment:

```bash
sudo systemctl start docker
```

---

# Jenkins missing Docker permission

```bash
docker exec -u root -it jenkins bash
chmod 666 /var/run/docker.sock
exit
```

---

# Jenkins container missing

Recreate:

```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

IMPORTANT:

If the original Jenkins volume exists, this should recover the old Jenkins configuration.

---

# Ansible sudo error

Inside each VM:

```bash
sudo visudo
```

Add:

```text
ruben ALL=(ALL) NOPASSWD:ALL
```

---

# SSH timeout from Jenkins to VM

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

# Host key verification failed

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

# Frontend not loading

Check container on app VM:

```bash
ssh ruben@192.168.56.101
docker ps
docker logs billing-frontend
exit
```

Restart container:

```bash
ssh ruben@192.168.56.101
docker restart billing-frontend
exit
```

---

# Backend not responding

Check backend on app VM:

```bash
ssh ruben@192.168.56.101
docker ps
docker logs billing-backend
exit
```

Restart backend:

```bash
ssh ruben@192.168.56.101
docker restart billing-backend
exit
```

---

# Database not responding

Check PostgreSQL on db VM:

```bash
ssh ruben@192.168.56.102
docker ps
docker logs billing-db
exit
```

Restart database:

```bash
ssh ruben@192.168.56.102
docker restart billing-db
exit
```

---

# Docker Hub login problem

Inside Jenkins pipeline this uses Jenkins credentials:

```text
dockerhub-creds
```

If login fails, verify in Jenkins:

```text
Manage Jenkins → Credentials
```

Expected credential:

```text
dockerhub-creds
```

---

# Jenkins DB password and JWT secret

The pipeline uses these Jenkins credentials:

```text
db-password
jwt-secret
```

If missing, create them in:

```text
Manage Jenkins → Credentials
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
billing-db-vm → PostgreSQL
billing-app-vm → Backend + Frontend
   ↓
Smoke Tests
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
- [ ] frontend opens at `http://192.168.56.101/login`
- [ ] Ansible ping works
- [ ] Jenkins pipeline finishes with `SUCCESS`
- [ ] Docker Hub images are visible
- [ ] success email notification is received

---

# FINAL NOTES

The most important rule is:

```text
Use Host-only IPs for Jenkins and Ansible.
Use NAT IPs for internal VM-to-VM communication.
```

Therefore:

```text
Jenkins/Ansible → 192.168.56.101 and 192.168.56.102
Backend → PostgreSQL → 10.0.2.4
```

This configuration is the final working version of the project.