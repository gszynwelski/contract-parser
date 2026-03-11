# GestãoPro - Contract Parser

Aplicação Next.js para leitura e organização de contratos em PDF e recebimentos via PIX.

## Stack
- **Next.js 15** com App Router
- **NextAuth v4** com Google OAuth
- **Prisma ORM** + **PostgreSQL**
- **TypeScript**

## Configuração local

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo de exemplo e preencha os valores:
```bash
cp .env.example .env
```

Você precisará de:
- **DATABASE_URL**: Uma instância PostgreSQL. Recomenda-se [Neon](https://neon.tech) (gratuito).
- **NEXTAUTH_SECRET**: Gere com `openssl rand -base64 32`
- **GOOGLE_CLIENT_ID / SECRET**: Crie no [Google Cloud Console](https://console.cloud.google.com) em APIs & Serviços > Credenciais > OAuth 2.0. Adicione `http://localhost:3000/api/auth/callback/google` como URI de redirecionamento.

### 3. Rodar as migrations do banco
```bash
npx prisma migrate deploy
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Deploy (Vercel)
1. Importe o repositório na Vercel
2. Adicione todas as variáveis de ambiente do `.env.example` nas configurações do projeto
3. Mude `NEXTAUTH_URL` para a URL de produção
4. Adicione a URL de produção no Google Cloud Console como URI autorizado
