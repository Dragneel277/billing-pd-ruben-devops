# DevOps Contribution - Ruben

## What was improved

- Configured Jenkins to use Pipeline from SCM.
- Improved Jenkinsfile structure.
- Added safer Docker Hub login using --password-stdin.
- Fixed Ansible deployment.
- Added Docker network `billing-net`.
- Fixed backend database connection using `billing-db`.
- Added automatic database schema creation.
- Added health checks after deployment.
- Added smoke tests for register/login.

## Final CI/CD Flow

GitHub → Jenkins → Docker build → Docker Hub push → Ansible deploy → Health checks → Smoke tests

## Services

- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- Jenkins: http://localhost:8080
- Database: PostgreSQL container `billing-db`

## Validation

The pipeline succeeds and the app supports:

- Register
- Login
- Expense management
