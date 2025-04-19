const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const color_config = require('../../../client/config/color_config.json');
const { t } = require('../../../client/languages/i18n');
const moment = require('moment');
require('moment-duration-format');

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
        // Get the target user (either mentioned or the command user)
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(targetUser.id) || await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        // Set up month names for different languages
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
        
        // Format dates
        const createdAt = `${moment(targetUser.createdAt).format('DD')} ${months[moment(targetUser.createdAt).format('MM')]} ${moment(targetUser.createdAt).format('YYYY HH:mm:ss')}`;
        const createdDaysAgo = moment().diff(moment(targetUser.createdAt), 'days');
        
        let joinedAt = null;
        let joinedDaysAgo = null;
        
        if (member) {
            joinedAt = `${moment(member.joinedAt).format('DD')} ${months[moment(member.joinedAt).format('MM')]} ${moment(member.joinedAt).format('YYYY HH:mm:ss')}`;
            joinedDaysAgo = moment().diff(moment(member.joinedAt), 'days');
        }
        
        // Get user badges
        const badges = getUserBadges(targetUser, userLang);
        
        // Create the main embed with user information
        const userEmbed = new EmbedBuilder()
            .setColor(member ? member.displayHexColor : color_config.main_color)
            .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() })
            .setThumbnail(targetUser.displayAvatarURL({ size: 4096 }))
            .setTitle(userLang === 'tr' 
                ? `${targetUser.username} Kullanıcı Bilgileri`
                : userLang === 'ru' 
                    ? `Информация о пользователе ${targetUser.username}`
                    : `${targetUser.username}'s User Information`)
            .setFooter({ text: `ID: ${targetUser.id} | ${userLang === 'tr' ? 'Sayfa' : userLang === 'ru' ? 'Страница' : 'Page'} 1/2`, iconURL: targetUser.displayAvatarURL() })
            .setTimestamp();
        
        // Add fields based on language
        if (userLang === 'tr') {
            userEmbed.addFields(
                { name: "<:member:1360975789063012590> **Kullanıcı Adı**", value: targetUser.username, inline: true },
                { name: "<:etiket2:1360969412609577154> **Etiket**", value: targetUser.tag, inline: true },
                { name: "<:question:1360976413670379590> **ID**", value: targetUser.id, inline: true },
                { name: "<:tabela:1360969019221348553> **Hesap Oluşturulma Tarihi**", value: `${createdAt}\n(${createdDaysAgo} gün önce)`, inline: true }
            );
            
            if (member) {
                userEmbed.addFields(
                    { name: "<:tabela:1360969019221348553> **Sunucuya Katılma Tarihi**", value: `${joinedAt}\n(${joinedDaysAgo} gün önce)`, inline: true },
                    { name: "<:robot:1360969401012326592> **Bot mu?**", value: targetUser.bot ? "Evet" : "Hayır", inline: true }
                );
            }
            
            if (badges.length > 0) {
                userEmbed.addFields({ name: "<:add:1360976293008773160> **Rozetler**", value: badges.join(' '), inline: false });
            }
            
        } else if (userLang === 'ru') {
            userEmbed.addFields(
                { name: "<:member:1360975789063012590> **Имя пользователя**", value: targetUser.username, inline: true },
                { name: "<:etiket2:1360969412609577154> **Тег**", value: targetUser.tag, inline: true },
                { name: "<:question:1360976413670379590> **ID**", value: targetUser.id, inline: true },
                { name: "<:tabela:1360969019221348553> **Дата создания аккаунта**", value: `${createdAt}\n(${createdDaysAgo} дней назад)`, inline: true }
            );
            
            if (member) {
                userEmbed.addFields(
                    { name: "<:tabela:1360969019221348553> **Дата присоединения к серверу**", value: `${joinedAt}\n(${joinedDaysAgo} дней назад)`, inline: true },
                    { name: "<:robot:1360969401012326592> **Бот?**", value: targetUser.bot ? "Да" : "Нет", inline: true }
                );
            }
            
            if (badges.length > 0) {
                userEmbed.addFields({ name: "<:add:1360976293008773160> **Значки**", value: badges.join(' '), inline: false });
            }
            
        } else {
            userEmbed.addFields(
                { name: "<:member:1360975789063012590> **Username**", value: targetUser.username, inline: true },
                { name: "<:etiket2:1360969412609577154> **Tag**", value: targetUser.tag, inline: true },
                { name: "<:question:1360976413670379590> **ID**", value: targetUser.id, inline: true },
                { name: "<:tabela:1360969019221348553> **Account Created**", value: `${createdAt}\n(${createdDaysAgo} days ago)`, inline: true }
            );
            
            if (member) {
                userEmbed.addFields(
                    { name: "<:tabela:1360969019221348553> **Joined Server**", value: `${joinedAt}\n(${joinedDaysAgo} days ago)`, inline: true },
                    { name: "<:robot:1360969401012326592> **Bot?**", value: targetUser.bot ? "Yes" : "No", inline: true }
                );
            }
            
            if (badges.length > 0) {
                userEmbed.addFields({ name: "<:add:1360976293008773160> **Badges**", value: badges.join(' '), inline: false });
            }
        }
        
        // Create the roles embed
        const rolesEmbed = new EmbedBuilder()
            .setColor(member ? member.displayHexColor : color_config.main_color)
            .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() })
            .setThumbnail(targetUser.displayAvatarURL({ size: 4096 }))
            .setTitle(userLang === 'tr' 
                ? `${targetUser.username} Rol Bilgileri`
                : userLang === 'ru' 
                    ? `Информация о ролях ${targetUser.username}`
                    : `${targetUser.username}'s Role Information`)
            .setFooter({ text: `ID: ${targetUser.id} | ${userLang === 'tr' ? 'Sayfa' : userLang === 'ru' ? 'Страница' : 'Page'} 2/2`, iconURL: targetUser.displayAvatarURL() })
            .setTimestamp();
        
        // Add role information if the user is a member of the server
        if (member) {
            const roles = member.roles.cache
                .sort((a, b) => b.position - a.position)
                .filter(r => r.id !== interaction.guild.id)
                .map(r => r)
                .join(", ") || (userLang === 'tr' ? "Rol yok" : userLang === 'ru' ? "Нет ролей" : "No roles");
            
            const roleCount = member.roles.cache.size - 1; // Subtract @everyone role
            
            if (userLang === 'tr') {
                rolesEmbed.setDescription(`**Roller (${roleCount}):**\n${roles}`);
                
                // Add additional member information
                rolesEmbed.addFields(
                    { name: "<:not1:1360969875060691010> **Durumu**", value: getStatusText(member.presence?.status, userLang), inline: true },
                    { name: "<:music5:1360969682378559630> **Cihaz**", value: getDeviceText(member.presence?.clientStatus, userLang), inline: true },
                    { name: "<:smile:1360975984727429171> **Renk**", value: member.displayHexColor, inline: true }
                );
                
                // Add current activity if available
                if (member.presence?.activities && member.presence.activities.length > 0) {
                    const activity = member.presence.activities[0];
                    rolesEmbed.addFields(
                        { name: "<:gunes:1360975760780689601> **Aktivite**", value: getActivityText(activity, userLang), inline: false }
                    );
                }
                
            } else if (userLang === 'ru') {
                rolesEmbed.setDescription(`**Роли (${roleCount}):**\n${roles}`);
                
                // Add additional member information
                rolesEmbed.addFields(
                    { name: "<:not1:1360969875060691010> **Статус**", value: getStatusText(member.presence?.status, userLang), inline: true },
                    { name: "<:music5:1360969682378559630> **Устройство**", value: getDeviceText(member.presence?.clientStatus, userLang), inline: true },
                    { name: "<:smile:1360975984727429171> **Цвет**", value: member.displayHexColor, inline: true }
                );
                
                // Add current activity if available
                if (member.presence?.activities && member.presence.activities.length > 0) {
                    const activity = member.presence.activities[0];
                    rolesEmbed.addFields(
                        { name: "<:gunes:1360975760780689601> **Активность**", value: getActivityText(activity, userLang), inline: false }
                    );
                }
                
            } else {
                rolesEmbed.setDescription(`**Roles (${roleCount}):**\n${roles}`);
                
                // Add additional member information
                rolesEmbed.addFields(
                    { name: "<:not1:1360969875060691010> **Status**", value: getStatusText(member.presence?.status, userLang), inline: true },
                    { name: "<:music5:1360969682378559630> **Device**", value: getDeviceText(member.presence?.clientStatus, userLang), inline: true },
                    { name: "<:smile:1360975984727429171> **Color**", value: member.displayHexColor, inline: true }
                );
                
                // Add current activity if available
                if (member.presence?.activities && member.presence.activities.length > 0) {
                    const activity = member.presence.activities[0];
                    rolesEmbed.addFields(
                        { name: "<:gunes:1360975760780689601> **Activity**", value: getActivityText(activity, userLang), inline: false }
                    );
                }
            }
        } else {
            // If user is not a member of the server
            if (userLang === 'tr') {
                rolesEmbed.setDescription("Bu kullanıcı bu sunucuda değil.");
            } else if (userLang === 'ru') {
                rolesEmbed.setDescription("Этот пользователь не находится на этом сервере.");
            } else {
                rolesEmbed.setDescription("This user is not a member of this server.");
            }
        }
        
        // Create buttons for navigation
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('user_page_1')
                    .setLabel(userLang === 'tr' ? 'Kullanıcı Bilgileri' : userLang === 'ru' ? 'Информация о пользователе' : 'User Info')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('<:member:1360975789063012590>'),
                new ButtonBuilder()
                    .setCustomId('user_page_2')
                    .setLabel(userLang === 'tr' ? 'Rol Bilgileri' : userLang === 'ru' ? 'Информация о ролях' : 'Role Info')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('<:add:1360976293008773160>')
            );
        
        // Send the initial embed with buttons
        const message = await interaction.reply({ 
            embeds: [userEmbed], 
            components: [row],
            fetchReply: true
        });
        
        // Create a collector for button interactions
        const collector = message.createMessageComponentCollector({ 
            filter: i => i.user.id === interaction.user.id,
            time: 60000
        });
        
        // Handle button clicks
        collector.on('collect', async i => {
            if (i.customId === 'user_page_1') {
                await i.update({ embeds: [userEmbed], components: [row] });
            } else if (i.customId === 'user_page_2') {
                await i.update({ embeds: [rolesEmbed], components: [row] });
            }
        });
        
        // Disable buttons when the collector ends
        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('user_page_1')
                        .setLabel(userLang === 'tr' ? 'Kullanıcı Bilgileri' : userLang === 'ru' ? 'Информация о пользователе' : 'User Info')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('<:member:1360975789063012590>')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('user_page_2')
                        .setLabel(userLang === 'tr' ? 'Rol Bilgileri' : userLang === 'ru' ? 'Информация о ролях' : 'Role Info')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('<:add:1360976293008773160>')
                        .setDisabled(true)
                );
            
            try {
                await message.edit({ components: [disabledRow] });
            } catch (err) {
                // Ignore errors if the message was deleted
            }
        });
        
    } catch (err) {
        console.error(err);
        await interaction.reply({ 
            content: userLang === 'tr' 
                ? 'Bu komutu çalıştırırken bir hata oluştu.' 
                : userLang === 'ru' 
                    ? 'Произошла ошибка при выполнении этой команды.' 
                    : 'An error occurred while executing this command.', 
            ephemeral: true 
        });
    }
};

// Helper function to get user badges
function getUserBadges(user, lang) {
    const badges = [];
    const flagsMapping = {
        'Staff': { emoji: '<:DiscordStaff:1360976413670379590>', tr: 'Discord Çalışanı', ru: 'Сотрудник Discord', en: 'Discord Staff' },
        'Partner': { emoji: '<:DiscordPartner:1360976413670379590>', tr: 'Partner', ru: 'Партнер', en: 'Partner' },
        'CertifiedModerator': { emoji: '<:CertifiedModerator:1360976413670379590>', tr: 'Onaylı Moderatör', ru: 'Сертифицированный модератор', en: 'Certified Moderator' },
        'Hypesquad': { emoji: '<:HypeSquad:1360976413670379590>', tr: 'HypeSquad Etkinlikleri', ru: 'События HypeSquad', en: 'HypeSquad Events' },
        'HypeSquadOnlineHouse1': { emoji: '<:Bravery:1360976413670379590>', tr: 'HypeSquad Bravery', ru: 'HypeSquad Храбрость', en: 'HypeSquad Bravery' },
        'HypeSquadOnlineHouse2': { emoji: '<:Brilliance:1360976413670379590>', tr: 'HypeSquad Brilliance', ru: 'HypeSquad Блеск', en: 'HypeSquad Brilliance' },
        'HypeSquadOnlineHouse3': { emoji: '<:Balance:1360976413670379590>', tr: 'HypeSquad Balance', ru: 'HypeSquad Баланс', en: 'HypeSquad Balance' },
        'BugHunterLevel1': { emoji: '<:BugHunter:1360976413670379590>', tr: 'Bug Avcısı Seviye 1', ru: 'Охотник за багами 1 уровня', en: 'Bug Hunter Level 1' },
        'BugHunterLevel2': { emoji: '<:BugHunter2:1360976413670379590>', tr: 'Bug Avcısı Seviye 2', ru: 'Охотник за багами 2 уровня', en: 'Bug Hunter Level 2' },
        'VerifiedDeveloper': { emoji: '<:VerifiedDeveloper:1360976413670379590>', tr: 'İlk Doğrulanmış Bot Geliştiricisi', ru: 'Ранний верифицированный разработчик ботов', en: 'Early Verified Bot Developer' },
        'VerifiedBot': { emoji: '<:VerifiedBot:1360976413670379590>', tr: 'Doğrulanmış Bot', ru: 'Проверенный бот', en: 'Verified Bot' },
        'PremiumEarlySupporter': { emoji: '<:EarlySupporter:1360976413670379590>', tr: 'Erken Nitro Destekçisi', ru: 'Ранний саппортер Nitro', en: 'Early Nitro Supporter' },
        'ActiveDeveloper': { emoji: '<:ActiveDeveloper:1360976413670379590>', tr: 'Aktif Geliştirici', ru: 'Активный разработчик', en: 'Active Developer' }
    };
    
    if (user.flags) {
        const userFlags = user.flags.toArray();
        
        for (const flag of userFlags) {
            if (flagsMapping[flag]) {
                const badge = flagsMapping[flag];
                badges.push(`${badge.emoji} ${badge[lang] || badge.en}`);
            }
        }
    }
    
    return badges;
}

// Helper function to get status text
function getStatusText(status, lang) {
    if (!status) return lang === 'tr' ? 'Bilinmiyor' : lang === 'ru' ? 'Неизвестно' : 'Unknown';
    
    const statusMap = {
        'online': { tr: '🟢 Çevrimiçi', ru: '🟢 В сети', en: '🟢 Online' },
        'idle': { tr: '🟡 Boşta', ru: '🟡 Неактивен', en: '🟡 Idle' },
        'dnd': { tr: '🔴 Rahatsız Etmeyin', ru: '🔴 Не беспокоить', en: '🔴 Do Not Disturb' },
        'offline': { tr: '⚫ Çevrimdışı', ru: '⚫ Не в сети', en: '⚫ Offline' },
        'invisible': { tr: '⚪ Görünmez', ru: '⚪ Невидимый', en: '⚪ Invisible' }
    };
    
    return statusMap[status]?.[lang] || statusMap[status]?.en || (lang === 'tr' ? 'Bilinmiyor' : lang === 'ru' ? 'Неизвестно' : 'Unknown');
}

// Helper function to get device text
function getDeviceText(clientStatus, lang) {
    if (!clientStatus) return lang === 'tr' ? 'Bilinmiyor' : lang === 'ru' ? 'Неизвестно' : 'Unknown';
    
    const devices = [];
    
    if (clientStatus.desktop) devices.push(lang === 'tr' ? '💻 Masaüstü' : lang === 'ru' ? '💻 Компьютер' : '💻 Desktop');
    if (clientStatus.mobile) devices.push(lang === 'tr' ? '📱 Mobil' : lang === 'ru' ? '📱 Мобильный' : '📱 Mobile');
    if (clientStatus.web) devices.push(lang === 'tr' ? '🌐 Web' : lang === 'ru' ? '🌐 Веб' : '🌐 Web');
    
    return devices.length > 0 ? devices.join(', ') : (lang === 'tr' ? 'Bilinmiyor' : lang === 'ru' ? 'Неизвестно' : 'Unknown');
}

// Helper function to get activity text
function getActivityText(activity, lang) {
    if (!activity) return lang === 'tr' ? 'Aktivite yok' : lang === 'ru' ? 'Нет активности' : 'No activity';
    
    const typeMap = {
        'PLAYING': { tr: 'Oynuyor', ru: 'Играет в', en: 'Playing' },
        'STREAMING': { tr: 'Yayında', ru: 'Стримит', en: 'Streaming' },
        'LISTENING': { tr: 'Dinliyor', ru: 'Слушает', en: 'Listening to' },
        'WATCHING': { tr: 'İzliyor', ru: 'Смотрит', en: 'Watching' },
        'CUSTOM': { tr: '', ru: '', en: '' },
        'COMPETING': { tr: 'Yarışıyor', ru: 'Соревнуется в', en: 'Competing in' }
    };
    
    const type = typeMap[activity.type]?.[lang] || typeMap[activity.type]?.en || '';
    
    if (activity.type === 'CUSTOM') {
        return activity.state || (lang === 'tr' ? 'Özel Durum' : lang === 'ru' ? 'Пользовательский статус' : 'Custom Status');
    }
    
    return `${type} ${activity.name}`;
}

module.exports.config = {
    name: t("userinfo.name", { lng: 'en' }),
    description: t("userinfo.description", { lng: 'en' }),
    name_localizations: {
        'tr': t("userinfo.name", { lng: 'tr' }),
        'ru': t("userinfo.name", { lng: 'ru' })
    },
    description_localizations: {
        'tr': t("userinfo.description", { lng: 'tr' }),
        'ru': t("userinfo.description", { lng: 'ru' })
    },
    cooldown: 10,
    required_bot_permissions: ["ManageMessages"],
    options: [
        {
            name: 'user',
            name_localizations: {
                'tr': 'kullanıcı',
                'ru': 'пользователь'
            },
            description: 'The user to get information about',
            description_localizations: {
                'tr': 'Hakkında bilgi alınacak kullanıcı',
                'ru': 'Пользователь, о котором нужно получить информацию'
            },
            type: 6, // USER
            required: false
        }
    ]
}
