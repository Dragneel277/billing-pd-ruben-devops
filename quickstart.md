# BILLING PROJECT — QUICKSTART

Fast guide to start the project quickly.

---

# 1. Start the Virtual Machines

Open Oracle VirtualBox and start both VMs:

```text
billing-db-vm
billing-app-vm
```

Start order:

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

# 2. Open the Correct WSL

Open PowerShell or Windows Terminal and run:

```powershell
wsl -d JenkinsWSL
```

Expected:

```bash
ruben@RubenBentosa:
```

Do not use:

```powershell
wsl -d Ubuntu
```

Do not use:

```text
docker-desktop
```

The correct project WSL environment is:

```text
JenkinsWSL
```

---

# 3. Go to the Project Folder

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

Check files:

```bash
ls
```

Expected main folders/files:

```text
ansible
backend
frontend
jenkins
README.md
guide.md
quickstart.md
billing-app-project.md
```

---

# 4. Check Running Containers

```bash
docker ps
```

If Jenkins is not running, check all containers:

```bash
docker ps -a
```

Start Jenkins:

```bash
docker start jenkins
```

---

# 5. Fix Jenkins Docker Permission

This is usually needed after reboot.

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

If the container list appears, Docker permission is fixed.

---

# 6. Open Jenkins

Open in browser:

```text
http://localhost:8080
```

Login if needed:

```text
Username: Ruben
Password: Ruben12345
```

---

# 7. Run the Pipeline

In Jenkins:

```text
billing-pipeline → Build Now
```

Expected flow:

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

# 8. Access the Application

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

Important:

The backend direct port is no longer publicly exposed:

```text
http://192.168.56.101:3000
```

A connection refused or timeout on port `3000` is expected in the final version.

---

# 8.1 Application Features to Test

After opening the frontend, test the main application features.

The current version supports:

- User registration and login
- Bill creation
- Bill editing through an edit modal
- Bill deletion
- Categories:
  - Rent
  - Utilities
  - Internet
  - Services
  - Food
  - Transport
  - Other
- Statuses:
  - Pending
  - Paid
  - Overdue
  - Cancelled
- Automatic overdue detection
- Search by title, entity or description
- Filters by status, category and date range
- Analytics dashboard:
  - Monthly spending chart
  - Yearly spending chart
  - Spending by category
  - Top spending days
  - Summary cards

Recommended manual test:

```text
1. Login
2. Create a new bill
3. Create a bill with a past due date and pending status
4. Confirm it appears as overdue
5. Edit a bill
6. Change category and status
7. Test filters
8. Check if charts update
9. Delete a test bill
```

---

# 9. Useful Checks

Check containers from JenkinsWSL:

```bash
docker ps
```

Check Ansible connectivity:

```bash
ansible -i ansible/inventory.ini all -m ping
```

Check Docker on the VMs:

```bash
ansible -i ansible/inventory.ini all -m shell -a "docker ps"
```

Check VM IPs:

```bash
ansible -i ansible/inventory.ini all -m shell -a "hostname -I"
```

Check backend through Nginx:

```bash
curl http://192.168.56.101/api/health
```

Expected:

```json
{"status":"ok","service":"billing-backend","database":"connected"}
```

Check that backend is private:

```bash
curl http://192.168.56.101:3000/health
```

Expected:

```text
Connection refused
```

or timeout.

Check internal Docker network on app VM:

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

# 10. If SSH Host Key Fails

If Jenkins/Ansible gives:

```text
Host key verification failed
```

Run:

```bash
docker exec -it jenkins bash
```

Inside Jenkins container:

```bash
ssh-keygen -R 192.168.56.101
ssh-keygen -R 192.168.56.102
ssh ruben@192.168.56.101
ssh ruben@192.168.56.102
exit
```

When asked, type:

```text
yes
```

VM password:

```text
12345
```

---

# Final Network Values

| Purpose | IP / Value |
|---|---|
| App VM Host-only | 192.168.56.101 |
| DB VM Host-only | 192.168.56.102 |
| App VM NAT | 10.0.2.3 |
| DB VM NAT | 10.0.2.4 |
| Internal Docker network | billing-net |
| Backend API public access | http://192.168.56.101/api |
| Backend direct port | Not publicly exposed |
| Frontend public access | http://192.168.56.101/login |

Important rule:

```text
Jenkins/Ansible uses Host-only IPs.
Backend uses DB NAT IP 10.0.2.4.
Frontend and backend communicate internally through billing-net.
Only frontend port 80 is exposed externally.
```

---

# Fast Command Sequence

Use this when everything is already configured:

```bash
wsl -d JenkinsWSL
```

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

```bash
docker ps -a
```

```bash
docker start jenkins
```

```bash
docker exec -u root -it jenkins bash
```

```bash
chmod 666 /var/run/docker.sock
exit
```

```bash
docker exec -it jenkins docker ps
```

Then open:

```text
http://localhost:8080
```

Run:

```text
billing-pipeline → Build Now
```

After Jenkins passes, open:

```text
http://192.168.56.101/login
```

And test:

```bash
curl http://192.168.56.101/api/health
```