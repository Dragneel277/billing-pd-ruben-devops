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

All Docker containers, Jenkins data and project infrastructure are inside:

```text
JenkinsWSL
```

---

# VM Shutdown Before Sleeping

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

---

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

Expected:

## DB VM

```text
192.168.1.243
```

## APP VM

```text
192.168.1.245
```

---

# QUICK FIX — If IP Changed

Update:

```text
ansible/inventory.ini
```

Replace old IPs with new ones.

Example:

```ini
[db_servers]
db-vm ansible_host=NEW_IP ansible_user=ruben

[backend_servers]
app-vm ansible_host=NEW_IP ansible_user=ruben
```

---

# STEP 5 — Verify Docker

Inside JenkinsWSL:

```bash
docker ps
```

Expected containers:

```text
billing-frontend
billing-backend
billing-db
```

---

# QUICK FIX — If Containers Are Missing

Show all containers:

```bash
docker ps -a
```

Start manually:

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
http://192.168.1.245/login
```

If login page appears:
- frontend is working

---

# STEP 10 — Verify Backend

Open:

```text
http://192.168.1.245:3000
```

---

# STEP 11 — Verify SSH Connectivity

Test DB VM:

```bash
ssh ruben@192.168.1.243
```

Then:

```bash
exit
```

Test APP VM:

```bash
ssh ruben@192.168.1.245
```

Then:

```bash
exit
```

---

# QUICK FIX — If SSH Asks Password

Generate SSH key:

```bash
ssh-keygen
```

Copy SSH key:

```bash
ssh-copy-id ruben@192.168.1.243
```

and:

```bash
ssh-copy-id ruben@192.168.1.245
```

Password:

```text
12345
```

---

# QUICK FIX — If Host Key Verification Failed

Run:

```bash
ssh-keygen -R 192.168.1.243
ssh-keygen -R 192.168.1.245
```

Reconnect:

```bash
ssh ruben@192.168.1.243
ssh ruben@192.168.1.245
```

Answer:

```text
yes
```

---

# STEP 12 — Verify Ansible

Run:

```bash
ansible -i ansible/inventory.ini all -m ping
```

Expected:

```text
app-vm | SUCCESS
db-vm | SUCCESS
```

---

# STEP 13 — Run Manual Deployment

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml \
--extra-vars image_tag=latest \
--extra-vars dockerhub_user=dragneel277 \
--extra-vars db_password=billing_pass \
--extra-vars jwt_secret=mysecret123
```

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

# Expected Pipeline Flow

```text
Checkout
Build images
Push to Docker Hub
Deploy via Ansible
Smoke Test Multi-VM
Email Notification
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

# USEFUL COMMANDS

## Open correct WSL

```powershell
wsl -d JenkinsWSL
```

---

## Go to project

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
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
http://192.168.1.245/login
```

---

## Verify Jenkins

```text
http://localhost:8080
```

---

## Verify backend

```text
http://192.168.1.245:3000
```

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

# COMMON QUICK FIXES

# Docker daemon not running

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

---

# Ansible sudo error

Inside VM:

```bash
sudo visudo
```

Add:

```text
ruben ALL=(ALL) NOPASSWD:ALL
```

---

# Final Architecture

```text
GitHub
   ↓
Jenkins
   ↓
Docker Build
   ↓
Docker Hub
   ↓
Ansible
   ↓
db-vm → PostgreSQL
app-vm → Backend + Frontend
   ↓
Smoke Tests
   ↓
Email Notifications
```
