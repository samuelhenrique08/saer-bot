require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// =========================================================
// CONFIG
// =========================================================
const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET; // chave que protege a rota

// =========================================================
// CLIENTE DISCORD
// =========================================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`✅ Bot online como ${client.user.tag}`);
    console.log(`📡 Conectado em ${client.guilds.cache.size} servidor(es)`);
});

// Comando de teste no chat (opcional, pode manter)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content === '!ping') {
        await message.reply('🏓 pong');
    }
});

// =========================================================
// SERVIDOR HTTP (para receber chamadas do Supabase)
// =========================================================
const app = express();
app.use(express.json());

// Rota de saúde (pública, sem autenticação)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        bot: client.user?.tag || 'offline',
        guilds: client.guilds.cache.size
    });
});

// Middleware de segurança: exige header Authorization com a chave secreta
app.use((req, res, next) => {
    const auth = req.headers['authorization'];
    if (!API_SECRET || auth !== `Bearer ${API_SECRET}`) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    next();
});

// Rota principal: enviar DM
// Body esperado: { discord_id: "123", message: "texto" }
app.post('/notify', async (req, res) => {
    const { discord_id, message } = req.body;

    if (!discord_id || !message) {
        return res.status(400).json({ error: 'discord_id e message são obrigatórios' });
    }

    try {
        const user = await client.users.fetch(String(discord_id));
        await user.send(message);
        console.log(`✅ DM enviada para ${user.tag} (${discord_id})`);
        return res.json({ success: true, sent_to: user.tag });
    } catch (err) {
        console.error(`❌ Erro ao enviar DM para ${discord_id}:`, err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 Servidor HTTP escutando na porta ${PORT}`);
});

// =========================================================
// LOGIN DISCORD
// =========================================================
client.login(process.env.DISCORD_BOT_TOKEN);