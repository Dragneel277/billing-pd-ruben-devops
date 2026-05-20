# Quickstart

Fast startup guide for the final Billing Tracker DevOps project.

Main repository:

```text
https://github.com/Dragneel277/billing-pd-ruben-devops.git
```

Final branch:

```text
ruben-devops-fixes
```

---

## 1. Start the VMs

Open Oracle VirtualBox and start the VMs in this order:

```text
1. billing-db-vm
2. billing-app-vm
```

VM login:

```text
user: ruben
password: 12345
```

---

## 2. Verify VM IPs

Inside each VM, run:

```bash
hostname -I
```

Expected final IPs:

| VM | NAT IP | Host-only IP |
|---|---|---|
| `billing-app-vm` | `10.0.2.3` | `192.168.56.101` |
| `billing-db-vm` | `10.0.2.4` | `192.168.56.102` |

Important rule:

```text
Jenkins/Ansible uses Host-only IPs.
Backend uses DB NAT IP 10.0.2.4.
```

---

## 3. Open JenkinsWSL

In PowerShell or Windows Terminal run:

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

## 4. Go to the project folder

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

Check branch:

```bash
git branch
```

Expected active branch:

```text
ruben-devops-fixes
```

---

## 5. Start Jenkins if needed

Check containers:

```bash
docker ps -a
```

Start Jenkins:

```bash
docker start jenkins
```

Verify Jenkins is running:

```bash
docker ps
```

Expected:

```text
jenkins
0.0.0.0:8080->8080/tcp
```

---

## 6. Fix Jenkins Docker permission if needed

After reboot, Jenkins may lose access to the Docker socket.

Run:

```bash
docker exec -u root -it jenkins bash
```

Inside the Jenkins container:

```bash
chmod 666 /var/run/docker.sock
exit
```

Verify Docker works inside Jenkins:

```bash
docker exec -it jenkins docker ps
```

If the container list appears, the permission is fixed.

---

## 7. Verify Ansible connectivity

From the project folder, run:

```bash
ansible -i ansible/inventory.ini all -m ping
```

Expected:

```text
app-vm | SUCCESS
db-vm  | SUCCESS
```

If this fails, check:

```text
- VMs are running
- Host-only adapter is active
- IPs are correct
- SSH is running inside both VMs
```

---

## 8. Open Jenkins

Browse to:

```text
http://localhost:8080
```

Login if required:

```text
Username: Ruben
Password: Ruben12345
```

Open the job:

```text
billing-pipeline
```

---

## 9. Run the pipeline

Click:

```text
Build Now
```

Expected pipeline flow:

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

## 10. Validate final deployment

Frontend:

```text
http://192.168.56.101/login
```

API through Nginx:

```text
http://192.168.56.101/api
```

Health endpoint:

```text
http://192.168.56.101/api/health
```

Jenkins:

```text
http://localhost:8080
```

---

## 11. Quick health checks

Run:

```bash
curl http://192.168.56.101/api/health
```

Expected:

```json
{"status":"ok","service":"billing-backend","database":"connected"}
```

Direct backend access should be blocked:

```bash
curl http://192.168.56.101:3000/health
```

Expected:

```text
Connection refused
```

or timeout.

---

## 12. Verify containers on the VMs

Check application VM:

```bash
ssh ruben@192.168.56.101
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
exit
```

Expected idea:

```text
billing-frontend   0.0.0.0:80->80/tcp
billing-backend    3000/tcp
```

Check database VM:

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

## 13. Verify Docker network on app VM

```bash
ssh ruben@192.168.56.101
docker network inspect billing-net
exit
```

Expected containers inside `billing-net`:

```text
billing-frontend
billing-backend
```

---

## 14. Final pre-presentation checklist

Before presenting, confirm:

```text
[ ] Both VMs are running
[ ] Jenkins is running at http://localhost:8080
[ ] Jenkins Docker permission is fixed
[ ] Ansible ping works
[ ] Last Jenkins pipeline is SUCCESS
[ ] Frontend opens at http://192.168.56.101/login
[ ] /api/health returns status ok
[ ] Direct backend :3000 is blocked
[ ] Docker Hub has backend/frontend image tags
[ ] Success email notification was received
```

---

## Most important rule

```text
Expose only the frontend.
Keep the backend private inside billing-net.
Access the API through Nginx /api.
Keep PostgreSQL on a separate VM with persistent storage.
```