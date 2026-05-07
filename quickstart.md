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

Open PowerShell inside the project folder or open Windows Terminal.

Run:

```powershell
wsl -d JenkinsWSL
```

Expected:

```bash
ruben@RubenBentosa:
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

Expected:

```text
ansible
backend
frontend
jenkins
README.md
guide.md
quickstart.md
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
Email Notification
SUCCESS
```

---

# 8. Access the Application

Frontend:

```text
http://192.168.56.101/login
```

Backend API:

```text
http://192.168.56.101:3000
```

Jenkins:

```text
http://localhost:8080
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

| Purpose | IP |
|---|---|
| App VM Host-only | 192.168.56.101 |
| DB VM Host-only | 192.168.56.102 |
| App VM NAT | 10.0.2.3 |
| DB VM NAT | 10.0.2.4 |

Important rule:

```text
Jenkins/Ansible uses Host-only IPs.
Backend uses DB NAT IP 10.0.2.4.
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