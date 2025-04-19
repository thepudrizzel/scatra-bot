const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, version } = require('discord.js');
const color_config = require('../../../client/config/color_config.json')
const staff_config = require('../../../client/config/staff_config.json')
const { t } = require('../../../client/languages/i18n');
const moment = require('moment');
require('moment-duration-format');
const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports.execute = async(client, interaction) => {
    // Debug information
    console.log(`[DEBUG] User locale: ${interaction.locale}`);
    console.log(`[DEBUG] User language: ${interaction.guild.preferredLocale}`);
    
    // Force Turkish language for all users
    let userLang = 'tr';
    
    // Original language detection (commented out)
    // let userLang = 'en';
    // if (interaction.locale === 'tr') {
    //     userLang = 'tr';
    // } else if (interaction.locale === 'ru') {
    //     userLang = 'ru';
    // }
    
    try {
        const uptime = {
            days: Math.floor(client.uptime / 86400000),
            hours: Math.floor(client.uptime / 3600000) % 24,
            minutes: Math.floor(client.uptime / 60000) % 60,
            seconds: Math.floor(client.uptime / 1000) % 60
        };
        
        const duration = moment.duration(client.uptime).format(
            userLang === 'tr' 
                ? "D [gün], H [saat], m [dakika], s [saniye]" 
                : userLang === 'ru'
                    ? "D [дней], H [часов], m [минут], s [секунд]"
                    : "D [days], H [hours], m [minutes], s [seconds]"
        );
        
        let months = {};
        if (userLang === 'tr') {
            months = {
                "01": "Ocak", "02": "Şubat", "03": "Mart", "04": "Nisan",
                "05": "Mayıs", "06": "Haziran", "07": "Temmuz", "08": "Ağustos",
                "09": "Eylül", "10": "Ekim", "11": "Kasım", "12": "Aralık"
            };
        } else if (userLang === 'ru') {
            months = {
                "01": "Январь", "02": "Февраль", "03": "Март", "04": "Апрель",
                "05": "Май", "06": "Июнь", "07": "Июль", "08": "Август",
                "09": "Сентябрь", "10": "Октябрь", "11": "Ноябрь", "12": "Декабрь"
            };
        } else {
            months = {
                "01": "January", "02": "February", "03": "March", "04": "April",
                "05": "May", "06": "June", "07": "July", "08": "August",
                "09": "September", "10": "October", "11": "November", "12": "December"
            };
        }
        
        const createdAt = `${moment(client.user.createdAt).format('DD')} ${months[moment(client.user.createdAt).format('MM')]} ${moment(client.user.createdAt).format('YYYY HH:mm:ss')}`;
        const createdDaysAgo = moment().diff(moment(client.user.createdAt), 'days');
        
        const slashCommandsPath = path.join(process.cwd(), 'src', 'command', 'slash_command');
        const prefixCommandsPath = path.join(process.cwd(), 'src', 'command', 'prefix_command');
        
        let slashCommandCount = 0;
        let prefixCommandCount = 0;
        
        if (fs.existsSync(slashCommandsPath)) {
            const slashFolders = fs.readdirSync(slashCommandsPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
                
            for (const folder of slashFolders) {
                const commandFiles = fs.readdirSync(`${slashCommandsPath}/${folder}`).filter(file => file.endsWith('.js'));
                slashCommandCount += commandFiles.length;
            }
        }
        
        if (fs.existsSync(prefixCommandsPath)) {
            const prefixFolders = fs.readdirSync(prefixCommandsPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
                
            for (const folder of prefixFolders) {
                const commandFiles = fs.readdirSync(`${prefixCommandsPath}/${folder}`).filter(file => file.endsWith('.js'));
                prefixCommandCount += commandFiles.length;
            }
        }
        
        const cpuModel = os.cpus()[0].model;
        const cpuCores = os.cpus().length;
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const usedMemory = (totalMemory - freeMemory).toFixed(2);
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const osType = os.type();
        const osRelease = os.release();
        const osPlatform = os.platform();
        const osArch = os.arch();
        
        const totalUsers = client.guilds.cache.reduce((a, b) => a + b.memberCount, 0);
        const totalGuilds = client.guilds.cache.size;
        const totalChannels = client.channels.cache.size;
        const textChannels = client.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = client.channels.cache.filter(c => c.type === 2).size;
        const categoryChannels = client.channels.cache.filter(c => c.type === 4).size;
        const threadChannels = client.channels.cache.filter(c => c.isThread()).size;
        const totalEmojis = client.emojis.cache.size;
        const totalRoles = client.guilds.cache.reduce((a, g) => a + g.roles.cache.size, 0);
        
        const mainEmbed = new EmbedBuilder()
            .setColor(color_config.main_color)
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setThumbnail(client.user.displayAvatarURL({ size: 4096 }))
            .setTitle(t("botinfo.title", { lng: userLang, botName: client.user.username }))
            .setDescription(userLang === 'tr' 
                ? `**${client.user.username}** hakkında detaylı bilgiler aşağıda listelenmiştir.`
                : userLang === 'ru'
                    ? `Подробная информация о **${client.user.username}** приведена ниже.`
                    : `Detailed information about **${client.user.username}** is listed below.`)
            .setFooter({ text: `ID: ${client.user.id} | ${userLang === 'tr' ? 'Sayfa' : userLang === 'ru' ? 'Страница' : 'Page'} 1/3`, iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        
        if (userLang === 'tr') {
            mainEmbed.addFields(
                { name: "<:5535c0f065d87828a4ab97f6937edafb:1360967869202038831> **Bot Sahibi**", value: `<@${staff_config.staff_id}>`, inline: true },
                { name: "<a:woman_dance:1360969782395932708> **Bot Adı**", value: client.user.username, inline: true },
                { name: "<:question:1360976413670379590> **Bot ID**", value: client.user.id, inline: true },
                { name: "<:etiket2:1360969412609577154> **Etiket**", value: client.user.tag, inline: true },
                { name: "<:tabela:1360969019221348553> **Oluşturulma Tarihi**", value: `${createdAt}\n(${createdDaysAgo} gün önce)`, inline: true },
                { name: "<:zaman:1360976013076594739> **Çalışma Süresi**", value: duration, inline: true },
                { name: "<a:loading:1360969771235016784> **Gecikme**", value: `${client.ws.ping} ms`, inline: true },
                { name: "<:database:1360976353498763407> **Bellek Kullanımı**", value: `${memoryUsage} MB`, inline: true },
                { name: "<:sopa:1360975998476226801> **Shard**", value: client.shard ? `${client.shard.ids.join(', ')}/${client.shard.count}` : "Shard yok", inline: true }
            );
        } else if (userLang === 'ru') {
            mainEmbed.addFields(
                { name: "<:5535c0f065d87828a4ab97f6937edafb:1360967869202038831> **Владелец бота**", value: `<@${staff_config.staff_id}>`, inline: true },
                { name: "<a:woman_dance:1360969782395932708> **Имя бота**", value: client.user.username, inline: true },
                { name: "<:question:1360976413670379590> **ID бота**", value: client.user.id, inline: true },
                { name: "<:etiket2:1360969412609577154> **Тег**", value: client.user.tag, inline: true },
                { name: "<:tabela:1360969019221348553> **Дата создания**", value: `${createdAt}\n(${createdDaysAgo} дней назад)`, inline: true },
                { name: "<:zaman:1360976013076594739> **Время работы**", value: duration, inline: true },
                { name: "<a:loading:1360969771235016784> **Задержка**", value: `${client.ws.ping} ms`, inline: true },
                { name: "<:database:1360976353498763407> **Использование памяти**", value: `${memoryUsage} MB`, inline: true },
                { name: "<:sopa:1360975998476226801> **Шард**", value: client.shard ? `${client.shard.ids.join(', ')}/${client.shard.count}` : "Нет шардов", inline: true }
            );
        } else {
            mainEmbed.addFields(
                { name: "<:5535c0f065d87828a4ab97f6937edafb:1360967869202038831> **Bot Owner**", value: `<@${staff_config.staff_id}>`, inline: true },
                { name: "<a:woman_dance:1360969782395932708> **Bot Name**", value: client.user.username, inline: true },
                { name: "<:question:1360976413670379590> **Bot ID**", value: client.user.id, inline: true },
                { name: "<:etiket2:1360969412609577154> **Tag**", value: client.user.tag, inline: true },
                { name: "<:tabela:1360969019221348553> **Created At**", value: `${createdAt}\n(${createdDaysAgo} days ago)`, inline: true },
                { name: "<:zaman:1360976013076594739> **Uptime**", value: duration, inline: true },
                { name: "<a:loading:1360969771235016784> **Latency**", value: `${client.ws.ping} ms`, inline: true },
                { name: "<:database:1360976353498763407> **Memory Usage**", value: `${memoryUsage} MB`, inline: true },
                { name: "<:sopa:1360975998476226801> **Shard**", value: client.shard ? `${client.shard.ids.join(', ')}/${client.shard.count}` : "No shards", inline: true }
            );
        }
        
        const statsEmbed = new EmbedBuilder()
        .setColor(color_config.main_color)
            .setThumbnail(client.user.displayAvatarURL({ size: 4096 }))
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setTitle(userLang === 'tr' 
                ? "<:veri:1360975819354280067> İstatistikler" 
                : userLang === 'ru' 
                    ? "<:veri:1360975819354280067> Статистика" 
                    : "<:veri:1360975819354280067> Statistics")
            .setFooter({ text: `ID: ${client.user.id} | ${userLang === 'tr' ? 'Sayfa' : userLang === 'ru' ? 'Страница' : 'Page'} 2/3`, iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
            
        if (userLang === 'tr') {
            statsEmbed.addFields(
                { name: "<:member:1360975789063012590> **Toplam Kullanıcı**", value: totalUsers.toLocaleString(), inline: true },
                { name: "<:not1:1360969875060691010> **Toplam Sunucu**", value: totalGuilds.toLocaleString(), inline: true },
                { name: "<:music3:1360969708618252318> **Toplam Kanal**", value: totalChannels.toLocaleString(), inline: true },
                { name: "<:chat:1360976342669332610> **Metin Kanalları**", value: textChannels.toLocaleString(), inline: true },
                { name: "<:music5:1360969682378559630> **Ses Kanalları**", value: voiceChannels.toLocaleString(), inline: true },
                { name: "<:music6:1360969670777110608> **Kategori Kanalları**", value: categoryChannels.toLocaleString(), inline: true },
                { name: "<:gunes:1360975760780689601> **Thread Kanalları**", value: threadChannels.toLocaleString(), inline: true },
                { name: "<:smile:1360975984727429171> **Emoji Sayısı**", value: totalEmojis.toLocaleString(), inline: true },
                { name: "<:add:1360976293008773160> **Rol Sayısı**", value: totalRoles.toLocaleString(), inline: true },
                { name: "<:not2:1360969047717581010> **Komut Sayısı**", value: `Slash: ${slashCommandCount} | Prefix: ${prefixCommandCount}`, inline: true },
                { name: "<:el2:1360969155146416208> **Discord.JS Sürümü**", value: `v${version}`, inline: true },
                { name: "<:el2:1360969155146416208> **Node.JS Sürümü**", value: process.version, inline: true }
            );
        } else if (userLang === 'ru') {
            statsEmbed.addFields(
                { name: "<:member:1360975789063012590> **Всего пользователей**", value: totalUsers.toLocaleString(), inline: true },
                { name: "<:not1:1360969875060691010> **Всего серверов**", value: totalGuilds.toLocaleString(), inline: true },
                { name: "<:music3:1360969708618252318> **Всего каналов**", value: totalChannels.toLocaleString(), inline: true },
                { name: "<:chat:1360976342669332610> **Текстовые каналы**", value: textChannels.toLocaleString(), inline: true },
                { name: "<:music5:1360969682378559630> **Голосовые каналы**", value: voiceChannels.toLocaleString(), inline: true },
                { name: "<:music6:1360969670777110608> **Категории**", value: categoryChannels.toLocaleString(), inline: true },
                { name: "<:gunes:1360975760780689601> **Ветки**", value: threadChannels.toLocaleString(), inline: true },
                { name: "<:smile:1360975984727429171> **Эмодзи**", value: totalEmojis.toLocaleString(), inline: true },
                { name: "<:add:1360976293008773160> **Роли**", value: totalRoles.toLocaleString(), inline: true },
                { name: "<:not2:1360969047717581010> **Команды**", value: `Slash: ${slashCommandCount} | Prefix: ${prefixCommandCount}`, inline: true },
                { name: "<:el2:1360969155146416208> **Версия Discord.JS**", value: `v${version}`, inline: true },
                { name: "<:el2:1360969155146416208> **Версия Node.JS**", value: process.version, inline: true }
            );
        } else {
            statsEmbed.addFields(
                { name: "<:member:1360975789063012590> **Total Users**", value: totalUsers.toLocaleString(), inline: true },
                { name: "<:not1:1360969875060691010> **Total Servers**", value: totalGuilds.toLocaleString(), inline: true },
                { name: "<:music3:1360969708618252318> **Total Channels**", value: totalChannels.toLocaleString(), inline: true },
                { name: "<:chat:1360976342669332610> **Text Channels**", value: textChannels.toLocaleString(), inline: true },
                { name: "<:music5:1360969682378559630> **Voice Channels**", value: voiceChannels.toLocaleString(), inline: true },
                { name: "<:music6:1360969670777110608> **Category Channels**", value: categoryChannels.toLocaleString(), inline: true },
                { name: "<:gunes:1360975760780689601> **Thread Channels**", value: threadChannels.toLocaleString(), inline: true },
                { name: "<:smile:1360975984727429171> **Emojis**", value: totalEmojis.toLocaleString(), inline: true },
                { name: "<:add:1360976293008773160> **Roles**", value: totalRoles.toLocaleString(), inline: true },
                { name: "<:not2:1360969047717581010> **Commands**", value: `Slash: ${slashCommandCount} | Prefix: ${prefixCommandCount}`, inline: true },
                { name: "<:el2:1360969155146416208> **Discord.JS Version**", value: `v${version}`, inline: true },
                { name: "<:el2:1360969155146416208> **Node.JS Version**", value: process.version, inline: true }
            );
        }
        
        const systemEmbed = new EmbedBuilder()
        .setColor(color_config.main_color)
            .setThumbnail(client.user.displayAvatarURL({ size: 4096 }))
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setTitle(userLang === 'tr' 
                ? "<:robot:1360969401012326592> Sistem Bilgileri" 
                : userLang === 'ru' 
                    ? "<:robot:1360969401012326592> Системная информация" 
                    : "<:robot:1360969401012326592> System Information")
            .setFooter({ text: `ID: ${client.user.id} | ${userLang === 'tr' ? 'Sayfa' : userLang === 'ru' ? 'Страница' : 'Page'} 3/3`, iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
            
        if (userLang === 'tr') {
            systemEmbed.addFields(
                //{ name: "<:el2:1360969155146416208> **İşletim Sistemi**", value: `${osType} ${osRelease} (${osPlatform}, ${osArch})`, inline: false },
                //{ name: "<:el2:1360969155146416208> **CPU Modeli**", value: cpuModel, inline: false },
                { name: "<:el2:1360969155146416208> **CPU Çekirdek Sayısı**", value: cpuCores.toString(), inline: true },
                { name: "<:el2:1360969155146416208> **Toplam Bellek**", value: `${totalMemory} GB`, inline: true },
                { name: "<:el2:1360969155146416208> **Kullanılan Bellek**", value: `${usedMemory} GB`, inline: true },
                { name: "<:el2:1360969155146416208> **Boş Bellek**", value: `${freeMemory} GB`, inline: true },
                { name: "<:el2:1360969155146416208> **Bot Bellek Kullanımı**", value: `${memoryUsage} MB`, inline: true },
                { name: "<:el2:1360969155146416208> **Sistem Çalışma Süresi**", value: `<t:${Math.floor( Date.now() / 1000 - interaction.client.uptime / 1000)}:R>`, inline: true },
                { name: "<:el2:1360969155146416208> **Bağlantılar**", value: "━━━━━━━━━━━━━━━━━━━━━━", inline: false },
                { name: "<:el2:1360969155146416208> **Davet Linki**", value: `[Botu Davet Et](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)`, inline: true },
                { name: "<:el2:1360969155146416208> **Destek Sunucusu**", value: "[Destek Sunucusu](https://discord.gg/4vH62NhbBZ)", inline: true },
                //{ name: "<:el2:1360969155146416208> **Website**", value: "[Website](https://botwebsite.com)", inline: true }
            );
        } else if (userLang === 'ru') {
            systemEmbed.addFields(
                //{ name: "<:el2:1360969155146416208> **Операционная система**", value: `${osType} ${osRelease} (${osPlatform}, ${osArch})`, inline: false },
                //{ name: "<:el2:1360969155146416208> **Модель процессора**", value: cpuModel, inline: false },
                { name: "<:el2:1360969155146416208> **Количество ядер**", value: cpuCores.toString(), inline: true },
                { name: "<:el2:1360969155146416208> **Общая память**", value: `${totalMemory} GB`, inline: true },
                { name: "<:el2:1360969155146416208> **Используемая память**", value: `${usedMemory} GB`, inline: true },
                { name: "<:el2:1360969155146416208> **Свободная память**", value: `${freeMemory} GB`, inline: true },
                { name: "<:el2:1360969155146416208> **Использование памяти ботом**", value: `${memoryUsage} MB`, inline: true },
                { name: "<:el2:1360969155146416208> **Время работы системы**", value: `<t:${Math.floor( Date.now() / 1000 - interaction.client.uptime / 1000)}:R>`, inline: true },
                { name: "<:el2:1360969155146416208> **Ссылки**", value: "━━━━━━━━━━━━━━━━━━━━━━", inline: false },
                { name: "<:el2:1360969155146416208> **Пригласить бота**", value: `[Пригласить](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)`, inline: true },
                { name: "<:el2:1360969155146416208> **Сервер поддержки**", value: "[Сервер поддержки](https://discord.gg/4vH62NhbBZ)", inline: true },
                //{ name: "<:el2:1360969155146416208> **Веб-сайт**", value: "[Веб-сайт](https://botwebsite.com)", inline: true }
            );
        } else {
            systemEmbed.addFields(
                //{ name: "<:el2:1360969155146416208> **Operating System**", value: `${osType} ${osRelease} (${osPlatform}, ${osArch})`, inline: false },
                //{ name: "<:el2:1360969155146416208> **CPU Model**", value: cpuModel, inline: false },
                { name: "<:el2:1360969155146416208> **CPU Cores**", value: cpuCores.toString(), inline: true },
                { name: "<:el2:1360969155146416208> **Total Memory**", value: `${totalMemory} GB`, inline: true },
                { name: "<:el2:1360969155146416208> **Used Memory**", value: `${usedMemory} GB`, inline: true },
                { name: "<:el2:1360969155146416208> **Free Memory**", value: `${freeMemory} GB`, inline: true },
                { name: "<:el2:1360969155146416208> **Bot Memory Usage**", value: `${memoryUsage} MB`, inline: true },
                { name: "<:el2:1360969155146416208> **System Uptime**", value: `<t:${Math.floor( Date.now() / 1000 - interaction.client.uptime / 1000)}:R>`, inline: true },
                { name: "<:el2:1360969155146416208> **Links**", value: "━━━━━━━━━━━━━━━━━━━━━━", inline: false },
                { name: "<:el2:1360969155146416208> **Invite Link**", value: `[Invite Bot](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)`, inline: true },
                { name: "<:el2:1360969155146416208> **Support Server**", value: "[Support Server](https://discord.gg/4vH62NhbBZ)", inline: true },
                //{ name: "<:el2:1360969155146416208> **Website**", value: "[Website](https://botwebsite.com)", inline: true }
            );
        }
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('info_page_1')
                    .setLabel(userLang === 'tr' ? 'Bot Bilgileri' : userLang === 'ru' ? 'Информация о боте' : 'Bot Info')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('<:cicek:1360967313385459822>'),
                new ButtonBuilder()
                    .setCustomId('info_page_2')
                    .setLabel(userLang === 'tr' ? 'İstatistikler' : userLang === 'ru' ? 'Статистика' : 'Statistics')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('<:veri:1360975819354280067>'),
                new ButtonBuilder()
                    .setCustomId('info_page_3')
                    .setLabel(userLang === 'tr' ? 'Sistem' : userLang === 'ru' ? 'Система' : 'System')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('<:robot:1360969401012326592>')
            );
        
        const message = await interaction.reply({ 
            embeds: [mainEmbed], 
            components: [row],
            fetchReply: true
        });
        
        const collector = message.createMessageComponentCollector({ 
            filter: i => i.user.id === interaction.user.id,
            time: 60000
        });
        
        collector.on('collect', async i => {
            if (i.customId === 'info_page_1') {
                await i.update({ embeds: [mainEmbed], components: [row] });
            } else if (i.customId === 'info_page_2') {
                await i.update({ embeds: [statsEmbed], components: [row] });
            } else if (i.customId === 'info_page_3') {
                await i.update({ embeds: [systemEmbed], components: [row] });
            }
        });
        
        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('info_page_1')
                        .setLabel(userLang === 'tr' ? 'Bot Bilgileri' : userLang === 'ru' ? 'Информация о боте' : 'Bot Info')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('<:cicek:1360967313385459822>')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('info_page_2')
                        .setLabel(userLang === 'tr' ? 'İstatistikler' : userLang === 'ru' ? 'Статистика' : 'Statistics')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('<:veri:1360975819354280067>')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('info_page_3')
                        .setLabel(userLang === 'tr' ? 'Sistem' : userLang === 'ru' ? 'Система' : 'System')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('<:robot:1360969401012326592>')
                        .setDisabled(true)
                );
            
            try {
                await message.edit({ components: [disabledRow] });
            } catch (err) {
            }
        });
        
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
    }
},

module.exports.config = {
    name: t("botinfo.name", { lng: 'en' }),
    description: t("botinfo.description", { lng: 'en' }),
    name_localizations: {
        'tr': t("botinfo.name", { lng: 'tr' }),
        'ru': t("botinfo.name", { lng: 'ru' })
    },
    description_localizations: {
        'tr': t("botinfo.description", { lng: 'tr' }),
        'ru': t("botinfo.description", { lng: 'ru' })
    },
    cooldown: 20,
    required_bot_permissions: ["ManageMessages"],
    options: []
}
