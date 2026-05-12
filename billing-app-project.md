# Billing Tracker — Documentação de Projeto CI/CD

> **UC:** Plataformas de Desenvolvimento / DevOps  
> **Projeto:** BILLING_PD_TP  
> **Tema:** Billing System — Gestor de despesas e faturação pessoal  
> **Stack:** React · Node.js/Express · PostgreSQL · Docker · Jenkins · Ansible · GitHub · Docker Hub

---

## Índice

1. [Visão geral do projeto](#1-visão-geral-do-projeto)
2. [Funcionalidades principais](#2-funcionalidades-principais)
3. [Tecnologias utilizadas](#3-tecnologias-utilizadas)
4. [Arquitetura da aplicação](#4-arquitetura-da-aplicação)
5. [Infraestrutura de rede](#5-infraestrutura-de-rede)
6. [Modelo de dados](#6-modelo-de-dados)
7. [API REST](#7-api-rest)
8. [Estrutura do repositório](#8-estrutura-do-repositório)
9. [Docker e containerização](#9-docker-e-containerização)
10. [Pipeline Jenkins](#10-pipeline-jenkins)
11. [Deploy com Ansible](#11-deploy-com-ansible)
12. [Variáveis de ambiente e secrets](#12-variáveis-de-ambiente-e-secrets)
13. [Persistência da base de dados](#13-persistência-da-base-de-dados)
14. [Isolamento de rede final](#14-isolamento-de-rede-final)
15. [Testes e validação](#15-testes-e-validação)
16. [Melhorias realizadas](#16-melhorias-realizadas)
17. [Limitações e trabalho futuro](#17-limitações-e-trabalho-futuro)
18. [Checklist de entrega](#18-checklist-de-entrega)
19. [Conclusão](#19-conclusão)

---

## 1. Visão geral do projeto

O **Billing Tracker** é uma aplicação web full-stack para gestão de despesas, faturas e pagamentos pessoais.

O objetivo principal do projeto é demonstrar um fluxo DevOps completo, desde o desenvolvimento da aplicação até à sua entrega automática em múltiplas máquinas virtuais.

A solução final inclui:

- Frontend React servido por Nginx
- Backend Node.js/Express
- Base de dados PostgreSQL
- Containers Docker
- Pipeline Jenkins
- Publicação de imagens no Docker Hub
- Deploy automático com Ansible
- Smoke tests automáticos
- Notificações por email
- Persistência da base de dados
- Isolamento de rede entre frontend e backend
- Reverse proxy com Nginx

O projeto foi desenvolvido num ambiente académico, usando VirtualBox, WSL e Jenkins local.

---

## 2. Funcionalidades principais

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

## 3. Tecnologias utilizadas

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
| Controlo de versão | Git + GitHub |

---

## 4. Arquitetura da aplicação

### Arquitetura geral

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
billing-db-vm → PostgreSQL + billing_pgdata volume
billing-app-vm → billing-net → billing-frontend + billing-backend
   ↓
Smoke Tests through Nginx /api
   ↓
Email Notifications
```

### Fluxo de utilização da aplicação

```text
User Browser
   ↓
http://192.168.56.101/login
   ↓
billing-frontend / Nginx
   ↓
/api/*
   ↓
billing-backend:3000
   ↓
PostgreSQL
```

### Fluxo CI/CD

```text
Developer push
   ↓
GitHub repository
   ↓
Jenkins Pipeline
   ↓
Checkout
   ↓
Build backend image
   ↓
Build frontend image
   ↓
Push images to Docker Hub
   ↓
Deploy with Ansible
   ↓
Run smoke tests
   ↓
Clean test user
   ↓
Send email notification
```

---

## 5. Infraestrutura de rede

O projeto usa duas máquinas virtuais Ubuntu no Oracle VirtualBox.

Cada VM usa dois adaptadores de rede:

1. NAT Network
2. Host-only Adapter

| Máquina | NAT Network IP | Host-only IP | Função |
|---|---|---|---|
| billing-app-vm | 10.0.2.3 | 192.168.56.101 | Frontend + Backend |
| billing-db-vm | 10.0.2.4 | 192.168.56.102 | PostgreSQL |
| Jenkins | localhost | localhost:8080 | CI/CD |

### Regra principal de rede

```text
Jenkins/Ansible usa Host-only IPs.
Backend usa NAT IP para comunicar com PostgreSQL.
Frontend e backend comunicam internamente através de Docker network.
```

Assim:

```text
Jenkins/Ansible → 192.168.56.101 / 192.168.56.102
Browser → Frontend → 192.168.56.101:80
Frontend/Nginx → Backend → billing-backend:3000
Backend → PostgreSQL → 10.0.2.4:5432
```

---

## 6. Modelo de dados

### Tabela `users`

```sql
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

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

O ficheiro `backend/src/db/init.sql` é idempotente e pode ser executado várias vezes. Isto é importante porque volumes PostgreSQL já existentes não recriam automaticamente a tabela.

A solução final evita divergência entre desenvolvimento local e deploy por Ansible, porque o Ansible copia e executa o mesmo `init.sql` usado pelo backend.

---

## 7. API REST

Na arquitetura final, a API deve ser acedida através do Nginx:

```text
http://192.168.56.101/api
```

O backend direto em:

```text
http://192.168.56.101:3000
```

não está publicamente exposto.

---

### Health Check

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/health` | Verifica backend e ligação à base de dados |

Resposta esperada:

```json
{
  "status": "ok",
  "service": "billing-backend",
  "database": "connected"
}
```

---

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

## 8. Estrutura do repositório

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
└── billing_app.md
```

---

## 9. Docker e containerização

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

### Nginx reverse proxy

O frontend usa Nginx para servir a aplicação React e encaminhar os pedidos `/api/*` para o backend.

Exemplo conceptual:

```nginx
location /api/ {
    proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT}/;
}
```

Na versão final, as variáveis de ambiente do container frontend são:

```text
BACKEND_HOST=billing-backend
BACKEND_PORT=3000
```

Assim, o Nginx encaminha:

```text
/api/health → billing-backend:3000/health
/api/auth/login → billing-backend:3000/auth/login
/api/expenses → billing-backend:3000/expenses
```

---

## 10. Pipeline Jenkins

A pipeline está definida em:

```text
jenkins/Jenkinsfile
```

Fluxo final:

```text
Checkout
Build images
Push to Docker Hub
Deploy via Ansible to VMs
Smoke Test Multi-VM
Cleanup Smoke Test Data
Email Notification
```

A pipeline:

1. Faz checkout do código no GitHub
2. Constrói imagem backend
3. Constrói imagem frontend
4. Publica imagens no Docker Hub com `BUILD_NUMBER` e `latest`
5. Executa Ansible
6. Faz deploy nas VMs
7. Executa smoke tests através de Nginx `/api`
8. Remove o utilizador de teste criado pelo Jenkins
9. Envia email de sucesso ou falha

### Smoke tests finais

Os smoke tests usam:

```text
http://192.168.56.101
http://192.168.56.101/api/health
http://192.168.56.101/api/auth/register
http://192.168.56.101/api/auth/login
```

Isto valida:

- disponibilidade do frontend
- disponibilidade do backend através do reverse proxy
- ligação do backend à base de dados
- registo de utilizador
- login de utilizador

---

## 11. Deploy com Ansible

O Ansible usa:

```text
ansible/inventory.ini
ansible/playbook.yml
```

### Inventário final

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

### Responsabilidades do playbook

O playbook faz:

- instalação/verificação de Docker
- instalação do Python Docker SDK
- criação do volume persistente da base de dados
- deploy do container PostgreSQL na `billing-db-vm`
- cópia e execução do `backend/src/db/init.sql`
- remoção de containers antigos indevidos na `billing-app-vm`
- criação da Docker network `billing-net`
- deploy do backend na `billing-app-vm`
- deploy do frontend na `billing-app-vm`
- validação do frontend
- validação do backend através de `/api/health`

---

## 12. Variáveis de ambiente e secrets

Nenhum secret deve ser commitado no GitHub.

### Jenkins Credentials

| ID | Tipo | Utilização |
|---|---|---|
| dockerhub-creds | Username + Password | Login Docker Hub |
| db-password | Secret text | Password PostgreSQL |
| jwt-secret | Secret text | JWT Secret |

### Variáveis principais

| Variável | Valor final | Uso |
|---|---|---|
| `DB_HOST` | `10.0.2.4` | Backend liga à DB VM |
| `DB_PORT` | `5432` | Porta PostgreSQL |
| `DB_NAME` | `billing_db` | Nome da base de dados |
| `DB_USER` | `billing_user` | Utilizador PostgreSQL |
| `PORT` | `3000` | Porta interna do backend |
| `BACKEND_HOST` | `billing-backend` | Nginx fala com backend via Docker DNS |
| `BACKEND_PORT` | `3000` | Porta interna do backend |
| `JWT_SECRET` | Jenkins credential | Assinatura de tokens JWT |

---

## 13. Persistência da base de dados

A base de dados usa um volume Docker nomeado:

```text
billing_pgdata:/var/lib/postgresql/data
```

Isto garante que os dados permanecem mesmo quando:

- o container PostgreSQL é recriado
- o Ansible volta a executar o deploy
- a pipeline Jenkins é executada novamente

Este ponto corrige um problema importante: sem volume, a base de dados poderia ser reinicializada a cada deploy.

### Validação realizada

Foi criado um registo na aplicação, executada a pipeline novamente e confirmado que o registo continuava presente depois do redeploy.

---

## 14. Isolamento de rede final

A versão final melhora a arquitetura inicial criando uma Docker network interna no `billing-app-vm`:

```text
billing-net
```

Containers ligados a esta rede:

```text
billing-frontend
billing-backend
```

Estado final esperado no `billing-app-vm`:

```text
billing-frontend   0.0.0.0:80->80/tcp
billing-backend    3000/tcp
```

Isto significa que:

- a porta `80` do frontend está exposta
- a porta `3000` do backend não está exposta publicamente
- o backend só é acessível internamente pelo frontend/Nginx
- o browser e o Jenkins acedem à API através de `/api`

### Testes de isolamento

API através do Nginx:

```bash
curl http://192.168.56.101/api/health
```

Resultado esperado:

```json
{"status":"ok","service":"billing-backend","database":"connected"}
```

Acesso direto ao backend:

```bash
curl http://192.168.56.101:3000/health
```

Resultado esperado:

```text
Connection refused
```

ou timeout.

### Justificação técnica

O Docker network funciona apenas dentro do mesmo host. Como o frontend e backend estão na mesma VM, ambos podem partilhar a rede `billing-net`.

A base de dados está noutra VM, por isso não participa nesta Docker network. A comunicação backend → PostgreSQL é feita pela NAT Network usando:

```text
10.0.2.4:5432
```

---

## 15. Testes e validação

### Testes manuais finais

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

### Testes de infraestrutura

```bash
ansible -i ansible/inventory.ini all -m ping
```

```bash
ansible -i ansible/inventory.ini all -m shell -a "docker ps"
```

```bash
curl http://192.168.56.101/api/health
```

```bash
curl http://192.168.56.101:3000/health
```

### Validações esperadas

| Teste | Resultado esperado |
|---|---|
| Pipeline Jenkins | SUCCESS |
| Frontend | Abre em `http://192.168.56.101/login` |
| Health endpoint | Responde em `/api/health` |
| Porta backend direta | Recusada ou timeout |
| Docker network | `billing-net` contém frontend e backend |
| Database persistence | Dados continuam após redeploy |
| Smoke test cleanup | Utilizadores `ci_test_*` são removidos |
| Email notification | Email recebido após pipeline |

---

## 16. Melhorias realizadas

Durante a fase final foram corrigidos e melhorados vários pontos:

| Problema / melhoria | Solução aplicada |
|---|---|
| Base de dados podia perder dados após deploy | Adicionado volume persistente `billing_pgdata` |
| Schema do Ansible estava incompleto | Ansible passou a executar `backend/src/db/init.sql` |
| Coluna `category` em falta na DB | Corrigida através do schema final |
| Health check podia aceitar erro 500 | Criado endpoint `/health` e validação por HTTP 200 |
| Jenkins acumulava utilizadores de teste | Adicionado cleanup de `ci_test_<BUILD_NUMBER>` |
| Portas inconsistentes entre Jenkins e inventory | Normalizado `app_port=80` |
| Backend exposto publicamente em `3000` | Removido `published_ports` do backend |
| Comunicação FE → BE por IP externo | Substituída por Docker DNS `billing-backend` |
| Container DB antigo na app VM | Removido pelo playbook |
| Arquitetura menos isolada | Criada Docker network interna `billing-net` |

---

## 17. Limitações e trabalho futuro

Como este é um projeto académico em VirtualBox, algumas decisões são aceitáveis para laboratório mas seriam diferentes em produção.

Possíveis melhorias futuras:

- Ativar firewall/UFW na DB VM para permitir PostgreSQL apenas a partir do IP NAT da app VM (`10.0.2.3`)
- Usar HTTPS em vez de HTTP
- Usar cookies HttpOnly em vez de JWT no localStorage
- Usar secrets manager em vez de secrets apenas no Jenkins
- Adicionar testes unitários e de integração
- Criar endpoint dedicado para métricas
- Criar rollback automático para uma imagem anterior
- Usar infraestrutura cloud com subnets privadas e security groups
- Usar runners CI/CD isolados em vez de Docker socket direto

---

## 18. Checklist de entrega

### GitHub

- [x] Código frontend
- [x] Código backend
- [x] Jenkinsfile
- [x] Ansible inventory
- [x] Ansible playbook
- [x] README.md
- [x] quickstart.md
- [x] guide.md
- [x] billing_app.md

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
- [x] Cleanup de dados de teste

### Ansible

- [x] Deploy da DB
- [x] Deploy do backend
- [x] Deploy do frontend
- [x] Execução de `init.sql`
- [x] Criação de `billing-net`
- [x] Health checks

### Aplicação

- [x] Login/Register
- [x] Criar bill
- [x] Editar bill
- [x] Eliminar bill
- [x] Categorias
- [x] Statuses
- [x] Analytics dashboard
- [x] Automatic overdue

### Infraestrutura

- [x] VM da base de dados
- [x] VM da aplicação
- [x] Jenkins no WSL
- [x] Docker Hub
- [x] PostgreSQL persistente
- [x] Backend privado dentro da Docker network
- [x] Frontend exposto por Nginx

### Handoff

- [x] billing-app-vm.ova
- [x] billing-db-vm.ova
- [x] JenkinsWSL.tar

---

## 19. Conclusão

O projeto demonstra um fluxo DevOps completo aplicado a uma aplicação real.

A solução final inclui:

```text
GitHub → Jenkins → Docker Build → Docker Hub → Ansible → Multi-VM Deploy → Smoke Tests → Cleanup → Email
```

Além da infraestrutura DevOps, a aplicação final possui funcionalidades reais de gestão de despesas, edição, filtros, categorias, estados e analytics.

A arquitetura final também foi melhorada para demonstrar boas práticas de deployment:

- frontend exposto através de Nginx
- backend privado numa Docker network interna
- base de dados separada noutra VM
- persistência da base de dados com volume Docker
- smoke tests automáticos
- health checks reais
- limpeza de dados de teste
- deploy automatizado e reproduzível com Ansible

Esta configuração representa a versão final funcional e demonstrável do projeto.