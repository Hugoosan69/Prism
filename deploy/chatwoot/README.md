# Chatwoot — Deploy na VPS

## Pré-requisitos

- Docker e Docker Compose instalados
- Porta 3000 aberta no firewall

## Passos

### 1. Copiar arquivos para a VPS

```bash
scp -r deploy/chatwoot/ usuario@IP_DA_VPS:~/chatwoot
```

### 2. Configurar variáveis

```bash
cd ~/chatwoot
cp .env.example .env
```

Gerar o `SECRET_KEY_BASE`:

```bash
docker run --rm chatwoot/chatwoot:latest bundle exec rake secret
```

Colar o valor gerado no `.env`. Preencher também `POSTGRES_PASSWORD`, `REDIS_PASSWORD` e `FRONTEND_URL` com o IP da VPS.

### 3. Subir os containers

```bash
docker compose up -d
```

Na primeira vez, o Rails cria o banco automaticamente. Aguarde ~2 minutos.

### 4. Criar conta de admin

Abrir `http://IP_DA_VPS:3000` no navegador. Como `ENABLE_ACCOUNT_SIGNUP=true`, a tela de cadastro aparece. Criar a conta.

**Depois de criar a conta**, editar o `.env` e trocar para `ENABLE_ACCOUNT_SIGNUP=false`, depois:

```bash
docker compose restart rails sidekiq
```

### 5. Pegar o API token

No Chatwoot, ir em **Settings > Profile** (canto inferior esquerdo). Copiar o **Access Token**.

### 6. Descobrir o Account ID

O Account ID aparece na URL do painel: `http://IP:3000/app/accounts/1/...` — nesse caso, é `1`.

### 7. Configurar no Prism

Em `/configuracoes`, criar uma integração do tipo **Chatwoot**:
- **URL**: `http://IP_DA_VPS:3000`
- **Account ID**: o número do passo anterior
- **Token**: colar o Access Token e salvar

### 8. Configurar inboxes no Chatwoot

No painel do Chatwoot, criar os canais desejados:
- **E-mail**: Settings > Inboxes > Add Inbox > Email (IMAP/SMTP)
- **WhatsApp**: Settings > Inboxes > Add Inbox > WhatsApp (Cloud API ou 360dialog)
- **Widget**: Settings > Inboxes > Add Inbox > Website

As conversas desses canais aparecerão no Prism automaticamente.
