# Billing Tracker — Documentação de Projeto CI/CD

> **UC:** Plataformas de Desenvolvimento / DevOps  
> **Projeto:** BILLING_PD_TP  
> **Tema:** Billing System — Gestor de despesas e faturação pessoal  
> **Stack:** React · Node.js/Express · PostgreSQL · Docker · Jenkins · Ansible · GitHub · Docker Hub

---

## Índice

1. [Visão geral do projeto](#1-visão-geral-do-projeto)
2. [Arquitetura da aplicação](#2-arquitetura-da-aplicação)
3. [Modelo de dados](#3-modelo-de-dados)
4. [API REST](#4-api-rest)
5. [Estrutura do repositório](#5-estrutura-do-repositório)
6. [Docker e containerização](#6-docker-e-containerização)
7. [Pipeline Jenkins](#7-pipeline-jenkins)
8. [Deploy com Ansible](#8-deploy-com-ansible)
9. [Variáveis de ambiente e secrets](#9-variáveis-de-ambiente-e-secrets)
10. [Funcionalidades finais da aplicação](#10-funcionalidades-finais-da-aplicação)
11. [Testes e validação](#11-testes-e-validação)
12. [Checklist de entrega](#12-checklist-de-entrega)

---

## 1. Visão geral do projeto

O Billing Tracker é uma aplicação web full-stack para gestão de despesas, faturas e pagamentos.

O objetivo principal do projeto é demonstrar um fluxo DevOps completo, desde o desenvolvimento da aplicação até à sua entrega automática em múltiplas máquinas virtuais.

O sistema inclui:

- Frontend React servido por Nginx
- Backend Node.js/Express
- Base de dados PostgreSQL
- Containers Docker
- Pipeline Jenkins
- Publicação de imagens no Docker Hub
- Deploy automático com Ansible
- Smoke tests
- Notificações por email

---

## Funcionalidades principais

| Funcionalidade | Descrição |
|---|---|
| Registo e login | Autenticação simples por nome e password, com JWT |
| Criar despesa/fatura | Título, valor, entidade, descrição, data de vencimento, categoria e estado |
| Listar despesas | Lista todas as despesas do utilizador autenticado |
| Pesquisar despesas | Pesquisa por título, entidade ou descrição |
| Filtrar despesas | Filtros por estado, categoria e período |
| Categorizar despesas | Rent, Utilities, Internet, Services, Food, Transport e Other |
| Estados da despesa | Pending, Paid, Overdue e Cancelled |
| Deteção automática de atraso | Despesas pendentes com data vencida são apresentadas como overdue |
| Editar despesa | Modal para atualizar qualquer campo da despesa |
| Eliminar despesa | Remoção de registos |
| Dashboard analítico | Cards de resumo e gráficos de gastos |
| Gráfico mensal | Total gasto por mês |
| Gráfico anual | Total gasto por ano |
| Gráfico por categoria | Total gasto por categoria |
| Top dias de gasto | Dias com maior volume de despesas |

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + Nginx |
| Backend | Node.js + Express |
| Base de dados | PostgreSQL 16 |
| Containerização | Docker |
| CI/CD | Jenkins |
| Deploy | Ansible |
| Registo de imagens | Docker Hub |
| Virtualização | Oracle VirtualBox |
| Ambiente WSL | JenkinsWSL |

---

## 2. Arquitetura da aplicação

### Arquitetura final

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

## Infraestrutura de rede

| Máquina | NAT Network IP | Host-only IP | Função |
|---|---|---|---|
| billing-app-vm | 10.0.2.3 | 192.168.56.101 | Backend + Frontend |
| billing-db-vm | 10.0.2.4 | 192.168.56.102 | PostgreSQL |
| Jenkins | localhost | localhost:8080 | CI/CD |

Regra principal:

```text
Jenkins/Ansible usa Host-only IPs.
Backend usa NAT IP para comunicar com PostgreSQL.
```

Assim:

```text
Jenkins/Ansible → 192.168.56.101 / 192.168.56.102
Backend → PostgreSQL → 10.0.2.4
```

---

## Fluxo de autenticação

```text
1. POST /api/auth/login
2. Backend valida password
3. Backend devolve JWT
4. Frontend guarda token no localStorage
5. Frontend envia Authorization: Bearer <token>
6. Middleware auth.js valida o token
7. Rotas protegidas ficam acessíveis
```

---

## 3. Modelo de dados

### Tabela `users`

```sql
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

---

### Tabela `expenses`

```sql
CREATE TABLE IF NOT EXISTS expenses (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  entity      VARCHAR(150),
  category    VARCHAR(50) NOT NULL DEFAULT 'other',
  amount      NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'other';

ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_status_check;

ALTER TABLE expenses
ALTER COLUMN status TYPE VARCHAR(20);

ALTER TABLE expenses
ADD CONSTRAINT expenses_status_check
CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(user_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(user_id, due_date);
```

O `init.sql` é idempotente e pode ser executado várias vezes. Isto é importante porque volumes PostgreSQL já existentes não recriam automaticamente a tabela.

---

## 4. API REST

### Auth

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Regista utilizador |
| POST | `/api/auth/login` | Autentica utilizador e devolve JWT |

---

### Expenses

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/expenses` | Lista despesas do utilizador autenticado |
| GET | `/api/expenses?status=pending` | Filtra por estado |
| GET | `/api/expenses?category=utilities` | Filtra por categoria |
| GET | `/api/expenses?search=edp` | Pesquisa por título, entidade ou descrição |
| GET | `/api/expenses?from=2026-01-01&to=2026-12-31` | Filtra por período |
| POST | `/api/expenses` | Cria nova despesa |
| PATCH | `/api/expenses/:id` | Atualiza campos da despesa |
| DELETE | `/api/expenses/:id` | Elimina despesa |

---

### Analytics

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/analytics/summary` | Totais por estado |
| GET | `/api/analytics/monthly` | Total gasto por mês |
| GET | `/api/analytics/yearly` | Total gasto por ano |
| GET | `/api/analytics/categories` | Total gasto por categoria |
| GET | `/api/analytics/top-days` | Dias com maior gasto |
| GET | `/api/analytics/status-summary` | Resumo por estado |

---

### Exemplo POST `/api/expenses`

```json
{
  "title": "Electricity May",
  "amount": 45.90,
  "entity": "EDP",
  "description": "Monthly electricity bill",
  "due_date": "2026-05-20",
  "status": "pending",
  "category": "utilities"
}
```

---

### Exemplo PATCH `/api/expenses/:id`

```json
{
  "amount": 50.00,
  "status": "paid",
  "category": "utilities"
}
```

---

## 5. Estrutura do repositório

```text
billing-pd-ruben-devops/
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       │   └── client.js
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   └── Dashboard.jsx
│       └── components/
│           ├── ExpenseList.jsx
│           ├── ExpenseForm.jsx
│           ├── ExpenseFilters.jsx
│           ├── EditExpenseModal.jsx
│           └── AnalyticsDashboard.jsx
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── expenses.js
│       │   └── analytics.js
│       ├── middleware/
│       │   └── auth.js
│       └── db/
│           ├── client.js
│           └── init.sql
│
├── ansible/
│   ├── inventory.ini
│   ├── playbook.yml
│   └── group_vars/
│
├── jenkins/
│   └── Jenkinsfile
│
├── README.md
├── quickstart.md
├── guide.md
└── billing-app-project.md
```

---

## 6. Docker e containerização

O projeto usa Docker para empacotar:

- PostgreSQL
- Backend
- Frontend
- Jenkins

### Backend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
```

---

## 7. Pipeline Jenkins

A pipeline está definida em:

```text
jenkins/Jenkinsfile
```

Fluxo:

```text
Checkout
Build images
Push to Docker Hub
Deploy via Ansible to VMs
Smoke Test Multi-VM
Email Notification
```

A pipeline:

1. Faz checkout do código no GitHub
2. Constrói imagem backend
3. Constrói imagem frontend
4. Publica imagens no Docker Hub
5. Executa Ansible
6. Faz deploy nas VMs
7. Executa smoke tests
8. Envia email de sucesso ou falha

---

## 8. Deploy com Ansible

O Ansible usa:

```text
ansible/inventory.ini
ansible/playbook.yml
```

Inventário final:

```ini
[db_servers]
db-vm ansible_host=192.168.56.102 ansible_user=ruben

[backend_servers]
app-vm ansible_host=192.168.56.101 ansible_user=ruben

[frontend_servers]
app-vm ansible_host=192.168.56.101 ansible_user=ruben
```

O backend recebe:

```text
DB_HOST=10.0.2.4
```

porque a comunicação app-vm → db-vm usa NAT Network.

---

## 9. Variáveis de ambiente e secrets

Nenhum secret deve ser commitado no GitHub.

Jenkins Credentials:

| ID | Tipo | Utilização |
|---|---|---|
| dockerhub-creds | Username + Password | Login Docker Hub |
| db-password | Secret text | Password PostgreSQL |
| jwt-secret | Secret text | JWT Secret |

---

## 10. Funcionalidades finais da aplicação

A versão final inclui:

- Login/Register
- CRUD de bills
- Categorias
- Estados extendedidos
- Deteção automática de overdue
- Filtros
- Search
- Dashboard analítico
- Modal de edição
- Gráficos

---

## 11. Testes e validação

Testes manuais finais:

```text
1. Login
2. Criar uma bill
3. Criar uma bill com data vencida
4. Confirmar que aparece como overdue
5. Editar bill
6. Alterar categoria
7. Alterar status
8. Filtrar por categoria
9. Filtrar por status
10. Pesquisar por entidade/título
11. Confirmar gráficos
12. Eliminar teste
```

Smoke tests automáticos:

- Frontend disponível
- Register endpoint
- Login endpoint

---

## 12. Checklist de entrega

### GitHub

- [x] Código frontend
- [x] Código backend
- [x] Jenkinsfile
- [x] Ansible inventory
- [x] Ansible playbook
- [x] README.md
- [x] quickstart.md
- [x] guide.md
- [x] billing-app-project.md

### Docker Hub

- [x] Imagem backend publicada
- [x] Imagem frontend publicada
- [x] Tags com BUILD_NUMBER
- [x] Tag latest

### Jenkins

- [x] Pipeline funcional
- [x] Credenciais configuradas
- [x] Email notifications
- [x] Smoke tests

### Aplicação

- [x] Login/Register
- [x] Criar bill
- [x] Editar bill
- [x] Eliminar bill
- [x] Categorias
- [x] Statuses
- [x] Analytics dashboard
- [x] Automatic overdue

### Handoff

- [x] billing-app-vm.ova
- [x] billing-db-vm.ova
- [x] JenkinsWSL.tar

---

## Conclusão

O projeto demonstra um fluxo DevOps completo aplicado a uma aplicação real.

A solução final inclui:

```text
GitHub → Jenkins → Docker Build → Docker Hub → Ansible → Multi-VM Deploy → Smoke Tests → Email
```

Além da infraestrutura DevOps, a aplicação final possui funcionalidades reais de gestão de despesas, edição, filtros, categorias, estados e analytics.