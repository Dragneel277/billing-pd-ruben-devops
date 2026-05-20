# Billing PD — Recovery, Startup and Troubleshooting Guide

## 1. Overview

This guide documents how to restart, recover, validate and troubleshoot the final Billing Tracker DevOps environment.

The project is deployed with:

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

## 2. Final Architecture Summary

| Component | Final value |
|---|---|
| Frontend URL | `http://192.168.56.101/login` |
| Public API through Nginx | `http://192.168.56.101/api` |
| Health endpoint | `http://192.168.56.101/api/health` |
| Backend direct access | intentionally blocked on `http://192.168.56.101:3000` |
| App VM Host-only IP | `192.168.56.101` |
| App VM NAT IP | `10.0.2.3` |
| DB VM Host-only IP | `192.168.56.102` |
| DB VM NAT IP | `10.0.2.4` |
| Jenkins URL | `http://localhost:8080` |
| Internal Docker network | `billing-net` |
| PostgreSQL volume | `billing_pgdata` |
| WSL distro | `JenkinsWSL` |

---

## 3. VM Roles

| VM | Host-only IP | NAT IP | Role |
|---|---|---|---|
| `billing-app-vm` | `192.168.56.101` | `10.0.2.3` | Frontend + Backend |
| `billing-db-vm` | `192.168.56.102` | `10.0.2.4` | PostgreSQL |

---

## 4. Network Rules

Jenkins and Ansible use Host-only IPs:

```text
Jenkins/Ansible → billing-app-vm: 192.168.56.101
Jenkins/Ansible → billing-db-vm: 192.168.56.102
```

The backend connects to PostgreSQL through the NAT network:

```text
Backend → PostgreSQL: 10.0.2.4:5432
```

Frontend and backend communicate inside the Docker network:

```text
billing-net
```

Final exposure rule:

```text
Expose only the frontend.
Keep the backend private inside billing-net.
Access the API through Nginx /api.
```

---

## 5. Credentials

### VM credentials

```text
user: ruben
password: 12345
```

### Jenkins login

```text
Username: Ruben
Password: Ruben12345
```

### Jenkins required credentials

| Credential ID | Type | Purpose |
|---|---|---|
| `dockerhub-creds` | Username + Password | Docker Hub login |
| `db-password` | Secret text | PostgreSQL password |
| `jwt-secret` | Secret text | JWT secret |

Location:

```text
Manage Jenkins → Credentials → System → Global credentials
```

---

## 6. Required Environments

The host machine should have:

```text
Oracle VirtualBox
WSL
Docker available inside JenkinsWSL
Git
Windows Terminal or PowerShell
```

Use this WSL distro:

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

---

## 7. Project Export Files

The complete handoff/recovery package should include:

```text
billing-app-vm.ova
billing-db-vm.ova
JenkinsWSL.tar
```

These files allow the working environment to be recreated on another machine.

---

## 8. Exporting the Project

### 8.1 Export VirtualBox VMs

Open Oracle VirtualBox.

For each VM:

```text
billing-app-vm
billing-db-vm
```

Use:

```text
File → Export Appliance
```

Export as:

```text
billing-app-vm.ova
billing-db-vm.ova
```

Recommended:

```text
- Shut down the VM before exporting
- Do not export while the VM is running
- Do not export while the VM is suspended
```

---

### 8.2 Export JenkinsWSL

Open PowerShell.

Shutdown WSL:

```powershell
wsl --shutdown
```

Export:

```powershell
wsl --export JenkinsWSL JenkinsWSL.tar
```

Expected file:

```text
JenkinsWSL.tar
```

This export contains:

```text
Jenkins container
Jenkins jobs
Jenkins credentials
Jenkins volume
Docker state
Ansible environment
Pipeline configuration
```

---

## 9. Importing the Project on Another Computer

### 9.1 Import JenkinsWSL

Place `JenkinsWSL.tar` in an accessible folder.

Run:

```powershell
wsl --import JenkinsWSL C:\WSL\JenkinsWSL .\JenkinsWSL.tar
```

Verify:

```powershell
wsl -l -v
```

Open:

```powershell
wsl -d JenkinsWSL
```

---

### 9.2 Import VirtualBox VMs

Open VirtualBox:

```text
File → Import Appliance
```

Import:

```text
billing-app-vm.ova
billing-db-vm.ova
```

After importing, verify both VMs exist:

```text
billing-app-vm
billing-db-vm
```

---

## 10. Correct VM Shutdown

Before sleeping, moving or exporting, shut down the VMs correctly.

Inside VirtualBox, use:

```text
Close → Enviar pedido para desligar → OK
```

Do not use:

```text
Desligar a máquina
Guardar o estado da máquina
```

---

## 11. Startup Procedure

### Step 1 — Start VMs

Open VirtualBox and start in this order:

```text
1. billing-db-vm
2. billing-app-vm
```

---

### Step 2 — Verify VM IPs

Inside each VM:

```bash
hostname -I
```

Expected:

```text
billing-app-vm → NAT 10.0.2.3 / Host-only 192.168.56.101
billing-db-vm  → NAT 10.0.2.4 / Host-only 192.168.56.102
```

---

### Step 3 — Open JenkinsWSL

```powershell
wsl -d JenkinsWSL
```

---

### Step 4 — Navigate to the repository

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

Check branch:

```bash
git branch
```

Expected:

```text
ruben-devops-fixes
```

---

## 12. Jenkins and Docker Checks

### Verify Jenkins container

```bash
docker ps -a
```

Start Jenkins if needed:

```bash
docker start jenkins
```

Verify it is running:

```bash
docker ps
```

Expected:

```text
jenkins
0.0.0.0:8080->8080/tcp
```

---

### Fix Docker socket permissions

After reboot, Jenkins may lose Docker socket permission.

Run:

```bash
docker exec -u root -it jenkins bash
```

Inside the container:

```bash
chmod 666 /var/run/docker.sock
exit
```

Confirm Docker works inside Jenkins:

```bash
docker exec -it jenkins docker ps
```

---

## 13. Ansible Checks

From the project folder:

```bash
ansible -i ansible/inventory.ini all -m ping
```

Expected:

```text
app-vm | SUCCESS
db-vm  | SUCCESS
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

## 14. Inventory Requirements

`ansible/inventory.ini` must use Host-only IPs:

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

Do not use NAT IPs in `ansible_host`.

---

## 15. Running the Jenkins Pipeline

Open:

```text
http://localhost:8080
```

Open job:

```text
billing-pipeline
```

Click:

```text
Build Now
```

Expected pipeline stages:

```text
Checkout
Build images
Push to Docker Hub
Deploy via Ansible to VMs
Smoke Test Multi-VM
Cleanup test data
Email notification
SUCCESS
```

---

## 16. Manual Deployment Command

From the project folder:

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

Use Jenkins for the final deployment whenever possible.

---

## 17. Final Verification

### Frontend

Open:

```text
http://192.168.56.101/login
```

---

### Backend health through Nginx

```bash
curl http://192.168.56.101/api/health
```

Expected:

```json
{"status":"ok","service":"billing-backend","database":"connected"}
```

---

### Backend direct port

```bash
curl http://192.168.56.101:3000/health
```

Expected:

```text
Connection refused
```

or timeout.

This confirms the backend is not publicly exposed.

---

### Smoke test endpoints

```text
http://192.168.56.101/api/health
http://192.168.56.101/api/auth/register
http://192.168.56.101/api/auth/login
```

---

## 18. Database Deployment

PostgreSQL is deployed on:

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

Ansible applies schema from:

```text
backend/src/db/init.sql
```

This ensures the deployed database uses the same schema as the application source.

Check DB container:

```bash
ssh ruben@192.168.56.102
docker ps
docker logs billing-db
exit
```

---

## 19. Docker Network

On `billing-app-vm`, the internal Docker network is:

```text
billing-net
```

Containers attached:

```text
billing-frontend
billing-backend
```

Check:

```bash
ssh ruben@192.168.56.101
docker network inspect billing-net
exit
```

Expected app VM exposure:

```text
billing-frontend   0.0.0.0:80->80/tcp
billing-backend    3000/tcp
```

---

## 20. Docker Hub Verification

Docker Hub repositories:

```text
dragneel277/billing-backend
dragneel277/billing-frontend
```

Expected tags:

```text
BUILD_NUMBER
latest
```

Example:

```text
dragneel277/billing-backend:56
dragneel277/billing-backend:latest
dragneel277/billing-frontend:56
dragneel277/billing-frontend:latest
```

---

## 21. Troubleshooting

### 21.1 Host key verification failed

Inside Jenkins container:

```bash
docker exec -it jenkins bash
```

Remove old host keys:

```bash
ssh-keygen -R 192.168.56.101
ssh-keygen -R 192.168.56.102
```

Reconnect:

```bash
ssh ruben@192.168.56.101
ssh ruben@192.168.56.102
```

Accept the host keys.

Exit:

```bash
exit
```

---

### 21.2 SSH access problem

Test manually:

```bash
ssh ruben@192.168.56.101
ssh ruben@192.168.56.102
```

Password:

```text
12345
```

If SSH is stopped inside a VM:

```bash
sudo systemctl start ssh
sudo systemctl enable ssh
```

---

### 21.3 Docker daemon not running on VM

Inside the affected VM:

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

---

### 21.4 Jenkins cannot run Docker

Fix socket permissions:

```bash
docker exec -u root -it jenkins bash
chmod 666 /var/run/docker.sock
exit
```

Then verify:

```bash
docker exec -it jenkins docker ps
```

---

### 21.5 Frontend not loading

```bash
ssh ruben@192.168.56.101
docker ps
docker logs billing-frontend
docker restart billing-frontend
exit
```

Then open:

```text
http://192.168.56.101/login
```

---

### 21.6 API not responding through Nginx

```bash
ssh ruben@192.168.56.101
docker ps
docker logs billing-backend
docker logs billing-frontend
docker network inspect billing-net
exit
```

Then test:

```bash
curl http://192.168.56.101/api/health
```

---

### 21.7 Database not responding

```bash
ssh ruben@192.168.56.102
docker ps
docker logs billing-db
docker restart billing-db
exit
```

---

## 22. Useful Commands

Open JenkinsWSL:

```powershell
wsl -d JenkinsWSL
```

Go to project:

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

Check Git status:

```bash
git status
```

Pull latest changes:

```bash
git pull
```

Check Jenkins logs:

```bash
docker logs jenkins
```

Live Jenkins logs:

```bash
docker logs -f jenkins
```

Check containers from JenkinsWSL:

```bash
docker ps -a
```

Check Docker inside Jenkins:

```bash
docker exec -it jenkins docker ps
```

---

## 23. Application Feature Checklist

Before presentation, test:

```text
[ ] Login
[ ] Register
[ ] Create bill
[ ] Edit bill
[ ] Delete bill
[ ] Change category
[ ] Change status
[ ] Filter by status
[ ] Filter by category
[ ] Search by title/entity/description
[ ] Check analytics dashboard
[ ] Create overdue bill
[ ] Confirm overdue is displayed
```

---

## 24. Final Checklist Before Presentation or Handoff

```text
[ ] billing-app-vm is running
[ ] billing-db-vm is running
[ ] Jenkins opens at http://localhost:8080
[ ] Jenkins Docker permission is fixed
[ ] Ansible ping works
[ ] Jenkins pipeline finishes with SUCCESS
[ ] Docker Hub images are visible
[ ] Frontend opens at http://192.168.56.101/login
[ ] /api/health returns status ok
[ ] Direct backend port :3000 is blocked
[ ] billing-net contains billing-frontend and billing-backend
[ ] PostgreSQL runs only on billing-db-vm
[ ] PostgreSQL uses billing_pgdata
[ ] Email notification is received
[ ] Export files are available if needed
```

---

## 25. Final Notes

The most important rule is:

```text
Use Host-only IPs for Jenkins and Ansible.
Use NAT IPs for internal VM-to-VM communication.
Expose only frontend port 80.
Keep backend private inside billing-net.
Access the API through Nginx /api.
Keep PostgreSQL on a separate VM with persistent storage.
```

Final access:

```text
Frontend → http://192.168.56.101/login
API      → http://192.168.56.101/api
Health   → http://192.168.56.101/api/health
Jenkins  → http://localhost:8080
```