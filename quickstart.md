# Quickstart

## 1. Start the VMs

Open Oracle VirtualBox and start:

1. `billing-db-vm`
2. `billing-app-vm`

Login to the VMs with:

```text
user: ruben
password: 12345
```

## 2. Open JenkinsWSL

In PowerShell or Windows Terminal run:

```powershell
wsl -d JenkinsWSL
```

Do not use `wsl -d Ubuntu` or `docker-desktop`.

## 3. Go to the project folder

```bash
cd "/mnt/c/Users/ruben/Desktop/ISEC/2 Semestre/PD/billing-pd-ruben-devops"
```

## 4. Start Jenkins if needed

```bash
docker ps
```

If Jenkins is stopped:

```bash
docker start jenkins
```

If Docker permissions are blocked inside Jenkins:

```bash
docker exec -u root -it jenkins bash
chmod 666 /var/run/docker.sock
exit
```

## 5. Open Jenkins

Browse to:

```text
http://localhost:8080
```

Login if required:

```text
Username: Ruben
Password: Ruben12345
```

## 6. Run the pipeline

Open the Jenkins job and click `Build Now`.

Expected pipeline flow:

- Checkout
- Build backend image
- Build frontend image
- Push images to Docker Hub
- Deploy via Ansible
- Run smoke tests
- Cleanup test data
- Email notification

## 7. Validate final deployment

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

Important:

```text
http://192.168.56.101:3000
```

should be unreachable.

## 8. Quick checks

```bash
curl http://192.168.56.101/api/health
curl http://192.168.56.101:3000/health
```

Expected:

- first command returns a successful health response
- second command returns connection refused or timeout
