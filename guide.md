# BILLING PROJECT - FULL RECOVERY AND STARTUP GUIDE

# VM Shutdown Before Sleeping

Always shutdown the VMs correctly.

Inside VirtualBox:

```text
Close → Enviar pedido para desligar → OK
```

Do NOT use:

- Desligar a máquina
- Guardar o estado da máquina

The correct option is:

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

# STEP 1 — Open WSL

Open:

```text
Windows Terminal
```

Then execute:

```bash
wsl
```

Expected:

```bash
ruben@RubenBentosa:~
```

If WSL does not open:

```powershell
wsl --install
```

Then restart Windows.

---

# STEP 2 — Start Virtual Machines

Open:

```text
Oracle VirtualBox
```

Start the VMs in this order:

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

# STEP 3 — Verify VM IP Addresses

Inside EACH VM run:

```bash
ip a
```

Expected IPs:

## billing-db-vm

```text
192.168.1.243
```

## billing-app-vm

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

# STEP 4 — Open Project Folder

Inside WSL:

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
```

---

# STEP 5 — Verify Docker

Run:

```bash
docker ps
```

If Docker gives error:

```bash
sudo systemctl start docker
```

Then:

```bash
docker ps
```

---

# STEP 6 — Start Jenkins

Check existing containers:

```bash
docker ps -a
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

with ports:

```text
0.0.0.0:8080->8080
```

---

# STEP 7 — Open Jenkins

Open browser:

```text
http://localhost:8080
```

---

# QUICK FIX — If Jenkins Does Not Open

Restart container:

```bash
docker restart jenkins
```

Check logs:

```bash
docker logs jenkins
```

---

# STEP 8 — Verify Application Containers

Run:

```bash
docker ps
```

Expected containers:

```text
billing-db
billing-backend
billing-frontend
```

---

# QUICK FIX — If Containers Are Stopped

Start manually:

```bash
docker start billing-db
docker start billing-backend
docker start billing-frontend
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

# STEP 10 — Verify SSH Connectivity

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

# STEP 11 — Verify Ansible

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

# QUICK FIX — If Host Key Verification Failed

Run:

```bash
ssh-keygen -R 192.168.1.243
ssh-keygen -R 192.168.1.245
```

Then reconnect:

```bash
ssh ruben@192.168.1.243
ssh ruben@192.168.1.245
```

Answer:

```text
yes
```

---

# STEP 12 — Run Manual Deployment

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml \
--extra-vars image_tag=latest \
--extra-vars dockerhub_user=dragneel277 \
--extra-vars db_password=billing_pass \
--extra-vars jwt_secret=mysecret123
```

---

# STEP 13 — Open Jenkins Pipeline

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

# STEP 14 — Verify Email Notification

Check Gmail inbox:

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

## Open WSL

```bash
wsl
```

---

## Go to project

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

---

## Show containers

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

# Jenkins cannot use Docker

Fix permissions:

```bash
docker exec -u 0 -it jenkins bash
chmod 666 /var/run/docker.sock
exit
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
