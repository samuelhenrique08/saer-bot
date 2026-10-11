# SAER Bot — Discord

Bot de Discord do **SAER (Serviço Aeropolicial)** para envio de notificações
privadas (DMs) aos membros: avisos gerais, strikes e mensagens individuais.

Roda **localmente** na máquina do administrador, sendo ligado apenas quando
necessário (ex: domingos e segundas-feiras).

---

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Comandos](#-comandos)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Como Usar](#-como-usar)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Integração com o Supabase](#-integração-com-o-supabase)
- [Regras e Limitações](#-regras-e-limitações)
- [Segurança](#-segurança)
- [Roadmap](#-roadmap)

---

## 🎯 Funcionalidades

- Envio de DM (mensagem direta) para um membro específico pelo ID
- Notificação formatada de strike (1º, 2º ou 3º)
- Envio de aviso em massa para todos os membros ativos cadastrados no Supabase
- Integração direta com o banco de dados do painel administrativo
- Autenticação segura via token de bot do Discord

---

## 🤖 Comandos

| Comando | O que faz |
|---|---|
| `!ping` | Testa se o bot está online |
| `!help` | Mostra a lista de comandos |
| `!dm <ID_Discord> <mensagem>` | Envia uma DM simples para um usuário |
| `!strike <ID_Discord> <1\|2\|3> <motivo>` | Envia notificação formatada de strike |
| `!aviso <mensagem>` | Envia a mesma mensagem para todos os membros ativos com Discord ID cadastrado |

### Exemplos

```
!ping
!help
!dm 525318781451501569 Olá, tudo bem?
!strike 525318781451501569 2 Ausência em operação
!aviso Reunião geral neste domingo às 20h
```

---

## 📦 Pré-requisitos

- [Node.js](https://nodejs.org) v18 ou superior
- Uma conta no [Discord Developer Portal](https://discord.com/developers/applications)
- Um bot do Discord criado (com token)
- Acesso ao servidor do Discord onde o bot será usado
- Acesso ao projeto Supabase do painel (URL + chave pública)

---

## 🚀 Instalação

### 1. Clonar ou criar a pasta do projeto

```bash
git clone https://github.com/SEU_USUARIO/saer-bot.git
cd saer-bot
```

Se não estiver usando Git, basta criar a pasta manualmente e colocar os
arquivos nela.

### 2. Instalar dependências

```bash
npm install
```

Isso instala:
- `discord.js` — biblioteca para interagir com o Discord
- `dotenv` — leitura de variáveis de ambiente
- `@supabase/supabase-js` — cliente do Supabase

---

## ⚙️ Configuração

### 1. Criar o arquivo `.env`

Na raiz do projeto, crie um arquivo chamado **`.env`** (sem extensão) com o
seguinte conteúdo:

```
DISCORD_BOT_TOKEN=seu_token_do_bot_aqui
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_publica_aqui
```

> ⚠️ **Importante**: não coloque espaços antes ou depois do `=`, não use
> aspas, e não deixe linhas em branco no meio.

### 2. Como obter o Token do bot

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique na sua aplicação
3. Vá em **Bot**
4. Em **Token**, clique em **Reset Token**
5. Copie o valor e cole no `.env`

### 3. Como obter as credenciais do Supabase

1. Acesse o painel do seu projeto Supabase
2. Vá em **Settings → API**
3. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** (ou **publishable key**) → `SUPABASE_ANON_KEY`

### 4. Configurar as Intents no Discord

Ainda no Developer Portal, na aba **Bot → Privileged Gateway Intents**, ative:

- ✅ **Message Content Intent** (obrigatório — sem isso o bot não lê comandos)

### 5. Convidar o bot para o servidor

1. Vá em **OAuth2 → URL Generator**
2. Em **Scopes**, marque:
   - ✅ `bot`
3. Em **Bot Permissions**, marque:
   - ✅ Send Messages
   - ✅ Read Message History
4. Copie a URL gerada no final da página
5. Abra essa URL no navegador, escolha o servidor e autorize

---

## 🎮 Como Usar

### Iniciar o bot

Na pasta do projeto, rode:

```bash
node index.js
```

Você deve ver:

```
🦅 ================================
✅ Bot online como SAER Notificações#1234
📡 Conectado em 1 servidor(es)
🦅 ================================

Comandos disponíveis:
  !ping
  !help
  !dm <ID_Discord> <mensagem>
  !strike <ID_Discord> <1|2|3> <motivo>
  !aviso <mensagem>

💡 Para desligar: Ctrl + C
```

### Desligar o bot

- No terminal: pressione **`Ctrl + C`**
- Ou simplesmente feche a janela do terminal

### Atalho `.bat` (Windows)

Para não precisar abrir o terminal toda vez, foi criado o arquivo
`iniciar-bot.bat`. Basta dar **dois cliques** nele para ligar o bot.

Para parar: feche a janela preta que abrir, ou aperte `Ctrl + C` dentro dela.

---

## 📁 Estrutura do Projeto

```
saer-bot/
├── index.js               # Código principal do bot
├── package.json           # Dependências e metadados
├── package-lock.json      # Versões travadas (gerado pelo npm)
├── .env                   # Variáveis de ambiente (NÃO COMMITAR)
├── .gitignore             # Arquivos ignorados pelo Git
├── iniciar-bot.bat        # Atalho para ligar o bot (Windows)
└── README.md              # Este arquivo
```

---

## 🗄 Integração com o Supabase

O comando `!aviso` consulta a tabela `members` do Supabase para obter a
lista de membros ativos e seus respectivos Discord IDs.

### Consulta usada

```javascript
supabase
  .from('members')
  .select('id, name, discord_id')
  .eq('is_active', true)
  .not('discord_id', 'is', null);
```

### Requisitos no banco

- A tabela `members` precisa ter a coluna `discord_id` (texto)
- Cada membro que deve receber DMs precisa ter o `discord_id` preenchido
- O RLS precisa permitir leitura pública (`anon`) dos membros ativos

### Como descobrir o Discord ID de um membro

1. No Discord, o administrador ativa o **Modo Desenvolvedor**:
   - Configurações → Avançado → Modo Desenvolvedor
2. Clique com o **botão direito** no nome do membro
3. Escolha **Copiar ID**
4. O ID é um número longo (ex: `525318781451501569`)

---

## ⚠️ Regras e Limitações

### O bot só consegue enviar DM para quem:

- **Está no mesmo servidor** que o bot (regra do Discord)
- **Permitiu** receber DMs de membros do servidor:
  - Configurações → Privacidade e Segurança → Permitir mensagens diretas
- **Não bloqueou** o bot

Se algum desses pré-requisitos não for atendido, o envio falha e o bot
registra o erro no console.

### Sobre o comando `!aviso`

- Envia **uma mensagem por vez**, com **500ms de intervalo** entre cada uma
- Isso evita o **rate limit** do Discord
- Para 10 pessoas leva ~5s, para 50 pessoas ~25s
- O bot mostra um relatório no final: quantos enviou e quantos falharam

### Sobre a hospedagem

O bot **roda localmente** na máquina do administrador. Ele **não fica
online 24/7** — só funciona enquanto o terminal estiver aberto com o
`node index.js` rodando.

Para uso ocasional (domingos, segundas-feiras), isso é suficiente e evita
custos de hospedagem.

---

## 🔐 Segurança

- O **token do bot** e as **chaves do Supabase** ficam no arquivo `.env`
- O `.env` está listado no `.gitignore` — **nunca** é enviado ao GitHub
- Nunca compartilhe o conteúdo do `.env` com ninguém
- Se o token vazar, faça **Reset Token** imediatamente no Developer Portal
- A chave `anon` do Supabase é pública por design; a proteção está nas
  políticas de **Row Level Security (RLS)**

---

## 🗺 Roadmap

Melhorias planejadas para o futuro:

- [ ] Comando `!strike-nome <nome>` — busca membro pelo nome no Supabase
- [ ] Comando `!meta` — avisa quem não bateu a meta da semana
- [ ] Comando `!reset` — dispara o reset semanal pelo Discord
- [ ] Cadastro de `discord_id` direto no painel administrativo
- [ ] Log de envios (quem recebeu o quê e quando)
- [ ] Modo silencioso via `.vbs` (roda sem janela visível)
- [ ] Dockerfile para portabilidade
- [ ] Hospedagem 24/7 em VPS (quando viável)

---

## 🐛 Problemas Comuns

| Erro | Causa | Solução |
|---|---|---|
| `Used disallowed intents` | Intent não ativada no Developer Portal | Ativar **Message Content Intent** |
| `supabaseUrl is required` | `.env` ausente ou mal formatado | Verificar se `.env` existe e está correto |
| `Cannot send messages to this user` | DM bloqueada ou usuário fora do servidor | O usuário precisa permitir DMs |
| `Unknown User` | ID inválido | Confirmar o ID copiado |
| `!help` ou `!aviso` não responde | Bot rodando com código antigo | Parar com `Ctrl+C` e rodar de novo |
| Bot não aparece online | Token inválido ou bot não iniciado | Verificar `.env` e reiniciar |

---

## 📄 Licença

Projeto de uso interno do **SAER — Serviço Aeropolicial**.
Todos os direitos reservados.

---

## 👥 Créditos

Desenvolvido para a **Polícia Civil RJ / CORE** — Operações Aéreas.