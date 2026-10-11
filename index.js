require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// =========================================================
// SUPABASE
// =========================================================
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// =========================================================
// DISCORD
// =========================================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// =========================================================
// READY
// =========================================================
client.once('ready', () => {
    console.log('');
    console.log('🦅 ================================');
    console.log(`✅ Bot online como ${client.user.tag}`);
    console.log(`📡 Conectado em ${client.guilds.cache.size} servidor(es)`);
    console.log('🦅 ================================');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('  !ping');
    console.log('  !help');
    console.log('  !dm <ID_Discord> <mensagem>');
    console.log('  !strike <ID_Discord> <1|2|3> <motivo>');
    console.log('  !aviso <mensagem>');
    console.log('');
    console.log('💡 Para desligar: Ctrl + C');
    console.log('');
});

// =========================================================
// MENSAGENS
// =========================================================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // ---------- !ping ----------
    if (message.content === '!ping') {
        await message.reply('🏓 pong — bot funcionando!');
        return;
    }

    // ---------- !help ----------
    if (message.content === '!help') {
        await message.reply([
            '📖 **Comandos do SAER Bot**',
            '',
            '`!ping` — Testa se o bot está online',
            '`!dm <ID> <mensagem>` — Envia DM simples',
            '`!strike <ID> <1|2|3> <motivo>` — Envia notificação de strike',
            '`!aviso <mensagem>` — Envia aviso para todos os membros ativos',
            '`!help` — Mostra esta lista'
        ].join('\n'));
        return;
    }

    // ---------- !dm <ID> <mensagem> ----------
    if (message.content.startsWith('!dm ')) {
        const args = message.content.slice(4).trim().split(' ');
        const targetId = args.shift();
        const texto = args.join(' ');

        if (!targetId || !texto) {
            await message.reply('Uso correto: `!dm <ID_Discord> <mensagem>`');
            return;
        }

        try {
            const user = await client.users.fetch(targetId);
            await user.send(texto);
            await message.reply(`✅ DM enviada para **${user.tag}**`);
            console.log(`📨 DM enviada para ${user.tag} (${targetId})`);
        } catch (err) {
            console.error(`❌ Erro:`, err.message);
            await message.reply(`❌ Erro: ${err.message}`);
        }
        return;
    }

    // ---------- !strike <ID> <1|2|3> <motivo> ----------
    if (message.content.startsWith('!strike ')) {
        const args = message.content.slice(8).trim().split(' ');
        const targetId = args.shift();
        const amount = args.shift();
        const motivo = args.join(' ') || 'Sem motivo informado';

        if (!targetId || !amount) {
            await message.reply('Uso correto: `!strike <ID_Discord> <1|2|3> <motivo>`');
            return;
        }

        if (!['1', '2', '3'].includes(amount)) {
            await message.reply('❌ O número do strike deve ser **1**, **2** ou **3**.');
            return;
        }

        try {
            const user = await client.users.fetch(targetId);

            const agora = new Date().toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            const avisoFinal = amount === '3'
                ? '\n\n🚨 **Atenção:** você atingiu o limite de 3 strikes.\nEm breve um administrador entrará em contato.'
                : '';

            const mensagem = [
                '⚠️ **Notificação do SAER**',
                '',
                `Você recebeu um strike (**${amount}º**).`,
                '',
                `📋 **Motivo:** ${motivo}`,
                `📅 **Data:** ${agora}`,
                '',
                'Em caso de dúvida, procure um administrador.',
                avisoFinal
            ].join('\n');

            await user.send(mensagem);
            await message.reply(`✅ Strike ${amount}º notificado para **${user.tag}**`);
            console.log(`⚠️ Strike ${amount}º enviado para ${user.tag} (${targetId}) — motivo: ${motivo}`);
        } catch (err) {
            console.error(`❌ Erro:`, err.message);
            await message.reply(`❌ Erro: ${err.message}`);
        }
        return;
    }

    // ---------- !aviso <mensagem> ----------
    if (message.content.startsWith('!aviso ')) {
        const texto = message.content.slice(7).trim();

        if (!texto) {
            await message.reply('Uso correto: `!aviso <mensagem>`');
            return;
        }

        await message.reply('⏳ Buscando membros e enviando avisos...');

        try {
            const { data: membros, error } = await supabase
                .from('members')
                .select('id, name, discord_id')
                .eq('is_active', true)
                .not('discord_id', 'is', null);

            if (error) throw error;

            if (!membros || !membros.length) {
                await message.reply('❌ Nenhum membro com Discord ID cadastrado.');
                return;
            }

            let enviados = 0;
            let falhas = 0;

            for (const m of membros) {
                try {
                    const user = await client.users.fetch(String(m.discord_id));
                    await user.send(`📢 **Aviso do SAER**\n\n${texto}`);
                    enviados++;
                    console.log(`📢 Aviso enviado para ${m.name} (${m.discord_id})`);
                    await new Promise(r => setTimeout(r, 500));
                } catch (err) {
                    falhas++;
                    console.error(`❌ Falha com ${m.name}:`, err.message);
                }
            }

            const relatorio = [
                `✅ Enviados: **${enviados}**`,
                falhas ? `❌ Falhas: **${falhas}**` : '',
                falhas ? `\n_Falhas comuns: usuário fora do servidor ou DM bloqueada._` : ''
            ].filter(Boolean).join('\n');

            await message.reply(relatorio);
        } catch (err) {
            console.error('Erro no !aviso:', err);
            await message.reply(`❌ Erro: ${err.message}`);
        }
        return;
    }
});

// =========================================================
// LOGIN
// =========================================================
client.login(process.env.DISCORD_BOT_TOKEN);