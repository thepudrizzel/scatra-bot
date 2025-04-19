const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField, AttachmentBuilder, StringSelectMenuBuilder } = require('discord.js');
const color_config = require('../../../client/config/color_config.json');
const bot_config = require('../../../client/config/bot_config.json');
const staff_config = require('../../../client/config/staff_config.json');
const { t } = require('../../../client/languages/i18n');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const WelcomeSystem = require('../../../client/models/welcome_system');

// Register fonts for canvas - using try/catch to handle missing fonts gracefully
try {
    // Check if font files exist before trying to register them
    const regularFontPath = path.join(process.cwd(), 'assets', 'fonts', 'Roboto-Regular.ttf');
    const boldFontPath = path.join(process.cwd(), 'assets', 'fonts', 'Roboto-Bold.ttf');
    
    if (fs.existsSync(regularFontPath)) {
        registerFont(regularFontPath, { family: 'Roboto' });
    } else {
    }
    
    if (fs.existsSync(boldFontPath)) {
        registerFont(boldFontPath, { family: 'Roboto Bold' });
    } else {
    }
} catch (error) {
}

// Create assets directory if it doesn't exist
const assetsFolderPath = path.join(process.cwd(), 'assets');
const fontsFolderPath = path.join(assetsFolderPath, 'fonts');
const backgroundsFolderPath = path.join(assetsFolderPath, 'backgrounds');

try {
    if (!fs.existsSync(assetsFolderPath)) {
        fs.mkdirSync(assetsFolderPath, { recursive: true });
    }
    if (!fs.existsSync(fontsFolderPath)) {
        fs.mkdirSync(fontsFolderPath, { recursive: true });
    }
    if (!fs.existsSync(backgroundsFolderPath)) {
        fs.mkdirSync(backgroundsFolderPath, { recursive: true });
    }
} catch (error) {;
}

// Initialize welcomeData object to store temporary data
const welcomeData = {};

// Helper function to get guild settings from MongoDB
async function getGuildSettings(guildId) {
    try {
        let guildSettings = await WelcomeSystem.findOne({ guildId });
        
        if (!guildSettings) {
            guildSettings = new WelcomeSystem({ guildId });
            await guildSettings.save();
        }
        
        return guildSettings;
    } catch (error) {
        return null;
    }
}

// Helper function to update guild settings in MongoDB
async function updateGuildSettings(guildId, settings) {
    try {
        await WelcomeSystem.findOneAndUpdate(
            { guildId },
            settings,
            { upsert: true, new: true }
        );
        return true;
    } catch (error) {
        return false;
    }
}

// Helper function to create a canvas welcome image
async function createWelcomeCanvas(member, guildSettings, currentCount, goalCount, remainingCount, guildLang) {
    try {
        // Create canvas (800x250 pixels)
        const canvas = createCanvas(800, 250);
        const ctx = canvas.getContext('2d');
        
        // Draw background
        let background;
        if (guildSettings.canvasBackground) {
            try {
                background = await loadImage(guildSettings.canvasBackground);
            } catch (error) {
                // Use default gradient background if custom background fails
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#36393f');
                gradient.addColorStop(1, '#2f3136');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            // Use default gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#36393f');
            gradient.addColorStop(1, '#2f3136');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        if (background) {
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
            
            // Add semi-transparent overlay for better text visibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw user avatar
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);
        
        // Draw circle avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(125, 125, 75, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 50, 50, 150, 150);
        ctx.restore();
        
        // Draw circle border
        ctx.beginPath();
        ctx.arc(125, 125, 75, 0, Math.PI * 2, true);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.stroke();
        
        // Set text color
        ctx.fillStyle = guildSettings.canvasTextColor || '#ffffff';
        
        // Draw welcome text
        // Use default system fonts if Roboto is not available
        try {
            ctx.font = '36px "Roboto Bold", Arial, sans-serif';
        } catch (error) {
            ctx.font = '36px Arial, sans-serif';
        }
        ctx.textAlign = 'center';
        
        let welcomeText = '';
        if (guildLang === 'tr') {
            welcomeText = 'HOŞGELDİN!';
        } else if (guildLang === 'ru') {
            welcomeText = 'ДОБРО ПОЖАЛОВАТЬ!';
        } else {
            welcomeText = 'WELCOME!';
        }
        
        ctx.fillText(welcomeText, 500, 75);
        
        // Draw username
        try {
            ctx.font = '28px "Roboto Bold", Arial, sans-serif';
        } catch (error) {
            ctx.font = '28px Arial, sans-serif';
            console.log('[WELCOME] Using default font for username');
        }
        ctx.fillText(member.user.tag, 500, 125);
        
        // Draw member count
        try {
            ctx.font = '22px "Roboto", Arial, sans-serif';
        } catch (error) {
            ctx.font = '22px Arial, sans-serif';
            console.log('[WELCOME] Using default font for member count');
        }
        
        let memberCountText = '';
        if (guildLang === 'tr') {
            memberCountText = `Sen ${currentCount}. üyesin!`;
        } else if (guildLang === 'ru') {
            memberCountText = `Вы ${currentCount}-й участник!`;
        } else {
            memberCountText = `You are the ${currentCount}th member!`;
        }
        
        ctx.fillText(memberCountText, 500, 165);
        
        // Draw goal text if applicable
        if (remainingCount > 0) {
            try {
                ctx.font = '18px "Roboto", Arial, sans-serif';
            } catch (error) {
                ctx.font = '18px Arial, sans-serif';
                console.log('[WELCOME] Using default font for goal text');
            }
            
            let goalText = '';
            if (guildLang === 'tr') {
                goalText = `Hedefimize ulaşmak için ${remainingCount} üye kaldı!`;
            } else if (guildLang === 'ru') {
                goalText = `Осталось ${remainingCount} участников до нашей цели!`;
            } else {
                goalText = `${remainingCount} members left to reach our goal!`;
            }
            
            ctx.fillText(goalText, 500, 200);
        } else {
            try {
                ctx.font = '18px "Roboto", Arial, sans-serif';
            } catch (error) {
                ctx.font = '18px Arial, sans-serif';
                console.log('[WELCOME] Using default font for goal reached text');
            }
            
            let goalReachedText = '';
            if (guildLang === 'tr') {
                goalReachedText = 'Hedefimize ulaştık!';
            } else if (guildLang === 'ru') {
                goalReachedText = 'Мы достигли нашей цели!';
            } else {
                goalReachedText = 'We reached our goal!';
            }
            
            ctx.fillText(goalReachedText, 500, 200);
        }
        
        // Convert canvas to buffer
        return canvas.toBuffer();
    } catch (error) {
        console.error('[WELCOME] Error creating welcome canvas:', error);
        return null;
    }
}

// Helper function to create a canvas leave image
async function createLeaveCanvas(member, guildSettings, currentCount, goalCount, remainingCount, guildLang) {
    try {
        // Create canvas (800x250 pixels)
        const canvas = createCanvas(800, 250);
        const ctx = canvas.getContext('2d');
        
        // Draw background
        let background;
        if (guildSettings.canvasBackground) {
            try {
                background = await loadImage(guildSettings.canvasBackground);
            } catch (error) {
                console.error('[WELCOME] Error loading custom background:', error);
                // Use default gradient background if custom background fails
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#36393f');
                gradient.addColorStop(1, '#2f3136');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            // Use default gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#36393f');
            gradient.addColorStop(1, '#2f3136');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        if (background) {
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
            
            // Add semi-transparent overlay for better text visibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw user avatar
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);
        
        // Draw circle avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(125, 125, 75, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 50, 50, 150, 150);
        ctx.restore();
        
        // Draw circle border
        ctx.beginPath();
        ctx.arc(125, 125, 75, 0, Math.PI * 2, true);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.stroke();
        
        // Set text color
        ctx.fillStyle = guildSettings.canvasTextColor || '#ffffff';
        
        // Draw goodbye text
        try {
            ctx.font = '36px "Roboto Bold", Arial, sans-serif';
        } catch (error) {
            ctx.font = '36px Arial, sans-serif';
            console.log('[WELCOME] Using default font for goodbye text');
        }
        ctx.textAlign = 'center';
        
        let goodbyeText = '';
        if (guildLang === 'tr') {
            goodbyeText = 'GÖRÜŞÜRÜZ!';
        } else if (guildLang === 'ru') {
            goodbyeText = 'ДО СВИДАНИЯ!';
        } else {
            goodbyeText = 'GOODBYE!';
        }
        
        ctx.fillText(goodbyeText, 500, 75);
        
        // Draw username
        try {
            ctx.font = '28px "Roboto Bold", Arial, sans-serif';
        } catch (error) {
            ctx.font = '28px Arial, sans-serif';
            console.log('[WELCOME] Using default font for username');
        }
        ctx.fillText(member.user.tag, 500, 125);
        
        // Draw member count
        try {
            ctx.font = '22px "Roboto", Arial, sans-serif';
        } catch (error) {
            ctx.font = '22px Arial, sans-serif';
            console.log('[WELCOME] Using default font for member count');
        }
        
        let memberCountText = '';
        if (guildLang === 'tr') {
            memberCountText = `Şimdi ${currentCount} üyemiz var.`;
        } else if (guildLang === 'ru') {
            memberCountText = `Сейчас у нас ${currentCount} участников.`;
        } else {
            memberCountText = `We now have ${currentCount} members.`;
        }
        
        ctx.fillText(memberCountText, 500, 165);
        
        // Draw goal text if applicable
        if (remainingCount > 0) {
            try {
                ctx.font = '18px "Roboto", Arial, sans-serif';
            } catch (error) {
                ctx.font = '18px Arial, sans-serif';
                console.log('[WELCOME] Using default font for goal text');
            }
            
            let goalText = '';
            if (guildLang === 'tr') {
                goalText = `Hedefimize ulaşmak için ${remainingCount} üye kaldı!`;
            } else if (guildLang === 'ru') {
                goalText = `Осталось ${remainingCount} участников до нашей цели!`;
            } else {
                goalText = `${remainingCount} members left to reach our goal!`;
            }
            
            ctx.fillText(goalText, 500, 200);
        } else {
            try {
                ctx.font = '18px "Roboto", Arial, sans-serif';
            } catch (error) {
                ctx.font = '18px Arial, sans-serif';
                console.log('[WELCOME] Using default font for goal reached text');
            }
            
            let goalReachedText = '';
            if (guildLang === 'tr') {
                goalReachedText = 'Hedefimize hala ulaşmış durumdayız!';
            } else if (guildLang === 'ru') {
                goalReachedText = 'Мы все еще достигли нашей цели!';
            } else {
                goalReachedText = 'We still reached our goal!';
            }
            
            ctx.fillText(goalReachedText, 500, 200);
        }
        
        // Convert canvas to buffer
        return canvas.toBuffer();
    } catch (error) {
        console.error('[WELCOME] Error creating leave canvas:', error);
        return null;
    }
}

// Helper function to process placeholders in custom messages
function processPlaceholders(message, member, currentCount, goalCount, remainingCount) {
    if (!message) return null;
    
    return message
        .replace(/{user}/g, member.toString())
        .replace(/{username}/g, member.user.username)
        .replace(/{usertag}/g, member.user.tag)
        .replace(/{userid}/g, member.user.id)
        .replace(/{server}/g, member.guild.name)
        .replace(/{serverid}/g, member.guild.id)
        .replace(/{membercount}/g, currentCount)
        .replace(/{goal}/g, goalCount)
        .replace(/{remaining}/g, remainingCount);
}

module.exports.execute = async(client, interaction) => {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return interaction.reply({
            content: '<:cancel:1360976312591978717> Bu komutu kullanmak için "Sunucuyu Yönet" yetkisine sahip olmalısın.',
            ephemeral: true
        });
    }

    // Debug information
    console.log(`[DEBUG] User locale: ${interaction.locale}`);
    console.log(`[DEBUG] User language: ${interaction.guild.preferredLocale}`);
    
    // Detect user language based on their Discord locale
    let userLang = 'en'; // Default to English
    if (interaction.locale === 'tr') {
        userLang = 'tr';
    } else if (interaction.locale === 'ru') {
        userLang = 'ru';
    }
    
    console.log(`[DEBUG] Selected language for user: ${userLang}`);
    
    // Get or create guild settings
    let guildSettings = await getGuildSettings(interaction.guild.id);
    
    // Update language preference
    guildSettings.language = userLang;
    await updateGuildSettings(interaction.guild.id, { language: userLang });
    
    try {
        // Create buttons for welcome system
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('welcome_channel_goal')
                    .setLabel(userLang === 'tr' ? 'Kanal ve Üye Hedefi' : 
                             userLang === 'ru' ? 'Канал и цель участников' : 
                             'Channel and Member Goal')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('<:etiket:1360969462362144838>'),
                new ButtonBuilder()
                    .setCustomId('welcome_disable')
                    .setLabel(userLang === 'tr' ? 'Sistemi Kapat' : 
                             userLang === 'ru' ? 'Отключить систему' : 
                             'Disable System')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('<:cancel:1360976312591978717>')
            );
            
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('welcome_autorole')
                    .setLabel(userLang === 'tr' ? 'Otorol' : 
                             userLang === 'ru' ? 'Автороль' : 
                             'Auto Role')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('<:basarili:1360967302605967400>'),
                new ButtonBuilder()
                    .setCustomId('welcome_autorole_disable')
                    .setLabel(userLang === 'tr' ? 'Otorol Kapat' : 
                             userLang === 'ru' ? 'Отключить автороль' : 
                             'Disable Auto Role')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:cancel:1360976312591978717>')
            );
            
        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('welcome_message_type')
                    .setLabel(userLang === 'tr' ? 'Mesaj Tipi' : 
                             userLang === 'ru' ? 'Тип сообщения' : 
                             'Message Type')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📝'),
                new ButtonBuilder()
                    .setCustomId('welcome_help')
                    .setLabel(userLang === 'tr' ? 'Yardım' : 
                             userLang === 'ru' ? 'Помощь' : 
                             'Help')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❓')
            );
            
        // Create embed for welcome system
        const embed = new EmbedBuilder()
            .setColor(color_config.main_color)
            .setThumbnail(interaction.client.user.avatarURL({ size: 2048, format: 'png' }))
            .setImage(
                userLang === 'tr' ? 
                `https://cdn.discordapp.com/attachments/1361984566666989640/1362091565274759298/image.png?ex=6801221f&is=67ffd09f&hm=df5ff679d12ba298c59265e4805f1a2c16749b1f547189be6232f565ff340cd2&` : 
                
                userLang === 'ru' ? 
                `https://cdn.discordapp.com/attachments/1361984566666989640/1361984710149931099/image.png?ex=6800be9b&is=67ff6d1b&hm=8fbb72348fbad4be22a9913e8dca07d7524a7cc36afab1f8289c277d1532c08e&` :
                
                `https://cdn.discordapp.com/attachments/1361984566666989640/1361984710149931099/image.png?ex=6800be9b&is=67ff6d1b&hm=8fbb72348fbad4be22a9913e8dca07d7524a7cc36afab1f8289c277d1532c08e&`
            )
            .setAuthor({ 
                name: userLang === 'tr' ? `${interaction.client.user.username} Giriş & Sayaç Sistem` : 
                      userLang === 'ru' ? `${interaction.client.user.username} Система приветствия и счетчика` : 
                      `${interaction.client.user.username} Welcome & Counter System`, 
                iconURL: interaction.client.user.avatarURL({ size: 2048, format: 'png' }) 
            })
            .setDescription(
                userLang === 'tr' ? 
                `<:etiket:1360969462362144838> \`Kanal ve üye hedefi\`
**Sunucun için toplam bir rakam tut**

<:cop:1360967341734625411> \`Sistemi Kapat\`
**Kurulu olan sayaç sistemi kapatır**

<:cicek2:1360968766665785384> Auto rol verir mi?
**Sunucunuza giren kullanıcıya vermesi için:**
\`Otorol\` **&** \`Otorol Kapat\`
**ayarlamalısın.**` : 
                
                userLang === 'ru' ? 
                `<:etiket:1360969462362144838> \`Канал и цель участников\`
**Установить общий счетчик для вашего сервера**

<:cop:1360967341734625411> \`Отключить систему\`
**Выключить настроенную систему счетчика**

<:cicek2:1360968766665785384> Назначает ли автоматические роли?
**Чтобы назначить роль пользователям, присоединяющимся к вашему серверу:**
\`Автороль\` **&** \`Отключить автороль\`
**нужно настроить.**` :
                
                `<:etiket:1360969462362144838> \`Channel and Member Goal\`
**Set a total count for your server**

<:cop:1360967341734625411> \`Disable System\`
**Turn off the configured counter system**

<:cicek2:1360968766665785384> Does it assign auto roles?
**To assign a role to users joining your server:**
\`Auto Role\` **&** \`Disable Auto Role\`
**need to be configured.**`
            );
            
        // Add current settings to embed if they exist
        if (guildSettings.welcomeChannel) {
            const channel = interaction.guild.channels.cache.get(guildSettings.welcomeChannel);
            const channelName = channel ? channel.name : 'unknown-channel';
            
            embed.addFields({
                name: userLang === 'tr' ? '<:green:1360976879305101413> Mevcut Ayarlar' : 
                      userLang === 'ru' ? '<:green:1360976879305101413> Текущие настройки' : 
                      '<:green:1360976879305101413> Current Settings',
                value: userLang === 'tr' ? 
                      `**Sayaç Kanalı:** <#${guildSettings.welcomeChannel}> (${channelName})\n**Hedef:** ${guildSettings.memberGoal || 'Ayarlanmamış'}\n**Otorol:** ${guildSettings.autoRole ? `<@&${guildSettings.autoRole}>` : 'Ayarlanmamış'}\n**Mesaj Tipi:** ${guildSettings.messageType === 'canvas' ? 'Canvas (Resimli)' : 'Metin'}` :
                      
                      userLang === 'ru' ? 
                      `**Канал счетчика:** <#${guildSettings.welcomeChannel}> (${channelName})\n**Цель:** ${guildSettings.memberGoal || 'Не установлено'}\n**Автороль:** ${guildSettings.autoRole ? `<@&${guildSettings.autoRole}>` : 'Не установлено'}\n**Тип сообщения:** ${guildSettings.messageType === 'canvas' ? 'Canvas (Изображение)' : 'Текст'}` :
                      
                      `**Counter Channel:** <#${guildSettings.welcomeChannel}> (${channelName})\n**Goal:** ${guildSettings.memberGoal || 'Not set'}\n**Auto Role:** ${guildSettings.autoRole ? `<@&${guildSettings.autoRole}>` : 'Not set'}\n**Message Type:** ${guildSettings.messageType === 'canvas' ? 'Canvas (Image)' : 'Text'}`
            });
        }
        
        // Send the initial message with buttons
        const message = await interaction.reply({ 
            embeds: [embed], 
            components: [row, row2, row3],
            fetchReply: true
        });
        
        // Create collector for button interactions
        const collector = message.createMessageComponentCollector({ 
            filter: i => i.user.id === interaction.user.id,
            time: 300000 // 5 minutes
        });
        
        collector.on('collect', async i => {
            // Handle button interactions
            if (i.customId === 'welcome_channel_goal') {
                // Create channel select menu
                const channelRow = new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('welcome_channel_select')
                            .setPlaceholder(userLang === 'tr' ? 'Sayaç kanalını seçin' : 
                                           userLang === 'ru' ? 'Выберите канал счетчика' : 
                                           'Select counter channel')
                    );
                
                await i.update({ 
                    content: userLang === 'tr' ? 'Lütfen sayaç mesajlarının gönderileceği kanalı seçin:' : 
                             userLang === 'ru' ? 'Пожалуйста, выберите канал, куда будут отправляться сообщения счетчика:' : 
                             'Please select the channel where counter messages will be sent:',
                    components: [channelRow],
                    embeds: []
                });
                
            } else if (i.customId === 'welcome_disable') {
                // Disable welcome system
                try {
                    const guildSettings = await getGuildSettings(interaction.guild.id);
                    
                    if (guildSettings.welcomeChannel) {
                        // Delete the guild settings
                        await WelcomeSystem.findOneAndDelete({ guildId: interaction.guild.id });
                        
                        await i.update({ 
                            content: userLang === 'tr' ? '<:basarili:1360967302605967400> Sayaç sistemi başarıyla kapatıldı!' : 
                                     userLang === 'ru' ? '<:basarili:1360967302605967400> Система счетчика успешно отключена!' : 
                                     '<:basarili:1360967302605967400> Counter system successfully disabled!',
                            components: [],
                            embeds: []
                        });
                    } else {
                        await i.update({ 
                            content: userLang === 'tr' ? '<:cancel:1360976312591978717> Sayaç sistemi zaten kapalı!' : 
                                     userLang === 'ru' ? '<:cancel:1360976312591978717> Система счетчика уже отключена!' : 
                                     '<:cancel:1360976312591978717> Counter system is already disabled!',
                            components: [],
                            embeds: []
                        });
                    }
                } catch (error) {
                    console.error('[WELCOME] Error disabling welcome system:', error);
                    await i.update({ 
                        content: userLang === 'tr' ? '<:cancel:1360976312591978717> Sayaç sistemini kapatırken bir hata oluştu!' : 
                                 userLang === 'ru' ? '<:cancel:1360976312591978717> Произошла ошибка при отключении системы счетчика!' : 
                                 '<:cancel:1360976312591978717> An error occurred while disabling the counter system!',
                        components: [],
                        embeds: []
                    });
                }
                
            } else if (i.customId === 'welcome_autorole') {
                // Create role select menu
                const roleRow = new ActionRowBuilder()
                    .addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId('welcome_role_select')
                            .setPlaceholder(userLang === 'tr' ? 'Otomatik verilecek rolü seçin' : 
                                           userLang === 'ru' ? 'Выберите роль для автоматического назначения' : 
                                           'Select role to automatically assign')
                    );
                
                await i.update({ 
                    content: userLang === 'tr' ? 'Lütfen yeni üyelere otomatik verilecek rolü seçin:' : 
                             userLang === 'ru' ? 'Пожалуйста, выберите роль, которая будет автоматически назначаться новым участникам:' : 
                             'Please select the role to automatically assign to new members:',
                    components: [roleRow],
                    embeds: []
                });
                
            } else if (i.customId === 'welcome_autorole_disable') {
                // Disable auto role
                try {
                    // Get guild settings
                    const guildSettings = await getGuildSettings(interaction.guild.id);
                    
                    if (guildSettings.autoRole) {
                        // Update guild settings in MongoDB
                        await updateGuildSettings(interaction.guild.id, { autoRole: null });
                        
                        await i.update({ 
                            content: userLang === 'tr' ? '<:basarili:1360967302605967400> Otorol sistemi başarıyla kapatıldı!' : 
                                     userLang === 'ru' ? '<:basarili:1360967302605967400> Система автороли успешно отключена!' : 
                                     '<:basarili:1360967302605967400> Auto role system successfully disabled!',
                            components: [],
                            embeds: []
                        });
                    } else {
                        await i.update({ 
                            content: userLang === 'tr' ? '<:cancel:1360976312591978717> Otorol sistemi zaten kapalı!' : 
                                     userLang === 'ru' ? '<:cancel:1360976312591978717> Система автороли уже отключена!' : 
                                     '<:cancel:1360976312591978717> Auto role system is already disabled!',
                            components: [],
                            embeds: []
                        });
                    }
                } catch (error) {
                    console.error('[WELCOME] Error disabling auto role:', error);
                    await i.update({ 
                        content: userLang === 'tr' ? '<:cancel:1360976312591978717> Otorol sistemini kapatırken bir hata oluştu!' : 
                                 userLang === 'ru' ? '<:cancel:1360976312591978717> Произошла ошибка при отключении системы автороли!' : 
                                 '<:cancel:1360976312591978717> An error occurred while disabling the auto role system!',
                        components: [],
                        embeds: []
                    });
                }
                
            } else if (i.customId === 'welcome_channel_select') {
                // Handle channel selection
                const selectedChannel = i.values[0];
                
                // Create modal for member goal
                const modal = new ModalBuilder()
                    .setCustomId('welcome_goal_modal')
                    .setTitle(userLang === 'tr' ? 'Üye Hedefi' : 
                             userLang === 'ru' ? 'Цель участников' : 
                             'Member Goal');
                
                const goalInput = new TextInputBuilder()
                    .setCustomId('member_goal')
                    .setLabel(userLang === 'tr' ? 'Hedef üye sayısı' : 
                             userLang === 'ru' ? 'Целевое количество участников' : 
                             'Target member count')
                    .setPlaceholder('100')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(10);
                
                const firstActionRow = new ActionRowBuilder().addComponents(goalInput);
                modal.addComponents(firstActionRow);
                
                // Store selected channel temporarily
                if (!welcomeData[interaction.guild.id]) {
                    welcomeData[interaction.guild.id] = {};
                }
                welcomeData[interaction.guild.id].tempChannel = selectedChannel;
                console.log(`[WELCOME] Temporarily stored channel ${selectedChannel} for guild ${interaction.guild.id} in welcomeData`);
                
                await i.showModal(modal);
                
            } else if (i.customId === 'welcome_role_select') {
                // Handle role selection
                const selectedRole = i.values[0];
                
                try {
                    // Update guild settings in MongoDB
                    await updateGuildSettings(interaction.guild.id, { autoRole: selectedRole });
                    
                    await i.update({ 
                        content: userLang === 'tr' ? `<:basarili:1360967302605967400> Otorol başarıyla <@&${selectedRole}> olarak ayarlandı!` : 
                                 userLang === 'ru' ? `<:basarili:1360967302605967400> Автороль успешно установлена на <@&${selectedRole}>!` : 
                                 `<:basarili:1360967302605967400> Auto role successfully set to <@&${selectedRole}>!`,
                        components: [],
                        embeds: []
                    });
                } catch (error) {
                    console.error('[WELCOME] Error setting auto role:', error);
                    await i.update({ 
                        content: userLang === 'tr' ? '<:cancel:1360976312591978717> Otorol ayarlanırken bir hata oluştu!' : 
                                 userLang === 'ru' ? '<:cancel:1360976312591978717> Произошла ошибка при настройке автороли!' : 
                                 '<:cancel:1360976312591978717> An error occurred while setting the auto role!',
                        components: [],
                        embeds: []
                    });
                }
            } else if (i.customId === 'welcome_message_type') {
                // Create message type selection menu
                const messageTypeRow = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('welcome_message_type_select')
                            .setPlaceholder(userLang === 'tr' ? 'Mesaj tipini seçin' : 
                                           userLang === 'ru' ? 'Выберите тип сообщения' : 
                                           'Select message type')
                            .addOptions([
                                {
                                    label: userLang === 'tr' ? 'Metin' : 
                                          userLang === 'ru' ? 'Текст' : 
                                          'Text',
                                    description: userLang === 'tr' ? 'Basit metin mesajları' : 
                                                userLang === 'ru' ? 'Простые текстовые сообщения' : 
                                                'Simple text messages',
                                    value: 'text',
                                    emoji: '📝'
                                },
                                {
                                    label: userLang === 'tr' ? 'Canvas (Resimli)' : 
                                          userLang === 'ru' ? 'Canvas (Изображение)' : 
                                          'Canvas (Image)',
                                    description: userLang === 'tr' ? 'Özel tasarlanmış resimli mesajlar' : 
                                                userLang === 'ru' ? 'Специально разработанные сообщения с изображениями' : 
                                                'Custom designed image messages',
                                    value: 'canvas',
                                    emoji: '🖼️'
                                }
                            ])
                    );
                
                await i.update({ 
                    content: userLang === 'tr' ? 'Lütfen hoşgeldin ve ayrılma mesajları için bir tip seçin:' : 
                             userLang === 'ru' ? 'Пожалуйста, выберите тип для сообщений приветствия и прощания:' : 
                             'Please select a type for welcome and leave messages:',
                    components: [messageTypeRow],
                    embeds: []
                });
            } else if (i.customId === 'welcome_help') {
                // Show help embed
                const helpEmbed = new EmbedBuilder()
                    .setColor(color_config.main_color)
                    .setTitle(userLang === 'tr' ? '❓ Yardım: Mesaj Yer Tutucuları' : 
                             userLang === 'ru' ? '❓ Помощь: Заполнители сообщений' : 
                             '❓ Help: Message Placeholders')
                    .setDescription(
                        userLang === 'tr' ? 
                        'Özel mesajlarınızda aşağıdaki yer tutucuları kullanabilirsiniz:\n\n' +
                        '`{user}` - Kullanıcıyı etiketler (@kullanıcı)\n' +
                        '`{username}` - Kullanıcının adını gösterir\n' +
                        '`{usertag}` - Kullanıcının tam etiketini gösterir (kullanıcı#0000)\n' +
                        '`{userid}` - Kullanıcının ID\'sini gösterir\n' +
                        '`{server}` - Sunucu adını gösterir\n' +
                        '`{serverid}` - Sunucu ID\'sini gösterir\n' +
                        '`{membercount}` - Mevcut üye sayısını gösterir\n' +
                        '`{goal}` - Hedef üye sayısını gösterir\n' +
                        '`{remaining}` - Hedefe ulaşmak için kalan üye sayısını gösterir' :
                        
                        userLang === 'ru' ? 
                        'Вы можете использовать следующие заполнители в своих пользовательских сообщениях:\n\n' +
                        '`{user}` - Упоминает пользователя (@пользователь)\n' +
                        '`{username}` - Показывает имя пользователя\n' +
                        '`{usertag}` - Показывает полный тег пользователя (пользователь#0000)\n' +
                        '`{userid}` - Показывает ID пользователя\n' +
                        '`{server}` - Показывает название сервера\n' +
                        '`{serverid}` - Показывает ID сервера\n' +
                        '`{membercount}` - Показывает текущее количество участников\n' +
                        '`{goal}` - Показывает целевое количество участников\n' +
                        '`{remaining}` - Показывает оставшееся количество участников до цели' :
                        
                        'You can use the following placeholders in your custom messages:\n\n' +
                        '`{user}` - Mentions the user (@user)\n' +
                        '`{username}` - Shows the user\'s name\n' +
                        '`{usertag}` - Shows the user\'s full tag (user#0000)\n' +
                        '`{userid}` - Shows the user\'s ID\n' +
                        '`{server}` - Shows the server name\n' +
                        '`{serverid}` - Shows the server ID\n' +
                        '`{membercount}` - Shows the current member count\n' +
                        '`{goal}` - Shows the target member count\n' +
                        '`{remaining}` - Shows the remaining members needed to reach the goal'
                    )
                    .setFooter({ 
                        text: userLang === 'tr' ? 'Geri dönmek için herhangi bir butona tıklayın' : 
                              userLang === 'ru' ? 'Нажмите любую кнопку, чтобы вернуться' : 
                              'Click any button to go back',
                        iconURL: interaction.client.user.avatarURL({ size: 2048, format: 'png' })
                    });
                
                // Create back button
                const backRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('welcome_back')
                            .setLabel(userLang === 'tr' ? 'Geri Dön' : 
                                     userLang === 'ru' ? 'Вернуться' : 
                                     'Go Back')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('⬅️')
                    );
                
                await i.update({ 
                    embeds: [helpEmbed],
                    components: [backRow],
                    content: null
                });
            } else if (i.customId === 'welcome_back') {
                // Go back to main menu
                await i.update({ 
                    embeds: [embed],
                    components: [row, row2, row3],
                    content: null
                });
            } else if (i.customId === 'welcome_message_type_select') {
                // Handle message type selection
                const selectedType = i.values[0];
                
                try {
                    // Get guild settings
                    const guildSettings = await getGuildSettings(interaction.guild.id);
                    
                    // Update message type
                    guildSettings.messageType = selectedType;
                    await updateGuildSettings(interaction.guild.id, { messageType: selectedType });
                    
                    await i.update({ 
                        content: userLang === 'tr' ? 
                                `<:basarili:1360967302605967400> Mesaj tipi başarıyla ${selectedType === 'canvas' ? '**Canvas (Resimli)**' : '**Metin**'} olarak ayarlandı!` : 
                                
                                userLang === 'ru' ? 
                                `<:basarili:1360967302605967400> Тип сообщения успешно установлен на ${selectedType === 'canvas' ? '**Canvas (Изображение)**' : '**Текст**'}!` : 
                                
                                `<:basarili:1360967302605967400> Message type successfully set to ${selectedType === 'canvas' ? '**Canvas (Image)**' : '**Text**'}!`,
                        components: [],
                        embeds: []
                    });
                } catch (error) {
                    console.error('[WELCOME] Error updating message type:', error);
                    await i.update({ 
                        content: userLang === 'tr' ? '<:cancel:1360976312591978717> Mesaj tipini ayarlarken bir hata oluştu!' : 
                                 userLang === 'ru' ? '<:cancel:1360976312591978717> Произошла ошибка при установке типа сообщения!' : 
                                 '<:cancel:1360976312591978717> An error occurred while setting the message type!',
                        components: [],
                        embeds: []
                    });
                }
            }
        });
        
        // Handle modal submissions
        client.on('interactionCreate', async interaction => {
            if (!interaction.isModalSubmit()) return;
            
            if (interaction.customId === 'welcome_goal_modal') {
                const memberGoal = interaction.fields.getTextInputValue('member_goal');
                
                // Validate member goal
                if (isNaN(memberGoal) || parseInt(memberGoal) <= 0) {
                    return interaction.reply({
                        content: userLang === 'tr' ? '<:cancel:1360976312591978717> Lütfen geçerli bir sayı girin!' : 
                                userLang === 'ru' ? '<:cancel:1360976312591978717> Пожалуйста, введите действительное число!' : 
                                '<:cancel:1360976312591978717> Please enter a valid number!',
                        ephemeral: true
                    });
                }
                
                try {
                    // Get user language
                    let userLang = 'en'; // Default to English
                    if (interaction.locale === 'tr') {
                        userLang = 'tr';
                    } else if (interaction.locale === 'ru') {
                        userLang = 'ru';
                    }
                    
                    // Get or create guild settings
                    let guildSettings = await getGuildSettings(interaction.guild.id);
                    
                    // Get selected channel from temporary storage
                    const selectedChannel = welcomeData[interaction.guild.id]?.tempChannel;
                    
                    if (!selectedChannel) {
                        return interaction.reply({
                            content: userLang === 'tr' ? '<:cancel:1360976312591978717> Kanal seçimi bulunamadı! Lütfen tekrar deneyin.' : 
                                    userLang === 'ru' ? '<:cancel:1360976312591978717> Выбор канала не найден! Пожалуйста, попробуйте снова.' : 
                                    '<:cancel:1360976312591978717> Channel selection not found! Please try again.',
                            ephemeral: true
                        });
                    }
                    
                    // Update guild settings in MongoDB
                    await updateGuildSettings(interaction.guild.id, {
                        welcomeChannel: selectedChannel,
                        memberGoal: parseInt(memberGoal),
                        language: userLang
                    });
                    
                    // Clean up temporary data
                    if (welcomeData[interaction.guild.id]) {
                        delete welcomeData[interaction.guild.id].tempChannel;
                    }
                    
                    await interaction.reply({
                        content: userLang === 'tr' ? `<:basarili:1360967302605967400> Sayaç sistemi başarıyla ayarlandı!\n**Kanal:** <#${selectedChannel}>\n**Hedef:** ${memberGoal}` : 
                                userLang === 'ru' ? `<:basarili:1360967302605967400> Система счетчика успешно настроена!\n**Канал:** <#${selectedChannel}>\n**Цель:** ${memberGoal}` : 
                                `<:basarili:1360967302605967400> Counter system successfully configured!\n**Channel:** <#${selectedChannel}>\n**Goal:** ${memberGoal}`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('[WELCOME] Error saving welcome settings:', error);
                    await interaction.reply({
                        content: userLang === 'tr' ? '<:cancel:1360976312591978717> Sayaç sistemini ayarlarken bir hata oluştu!' : 
                                userLang === 'ru' ? '<:cancel:1360976312591978717> Произошла ошибка при настройке системы счетчика!' : 
                                '<:cancel:1360976312591978717> An error occurred while configuring the counter system!',
                        ephemeral: true
                    });
                }
            }
        });
        
        collector.on('end', async () => {
            // Disable all buttons when collector ends
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('welcome_channel_goal')
                        .setLabel(userLang === 'tr' ? 'Kanal ve üye hedefi' : 
                                 userLang === 'ru' ? 'Канал и цель участников' : 
                                 'Channel and Member Goal')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('<:etiket:1360969462362144838>')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('welcome_disable')
                        .setLabel(userLang === 'tr' ? 'Sistemi Kapat' : 
                                 userLang === 'ru' ? 'Отключить систему' : 
                                 'Disable System')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('<:cancel:1360976312591978717>')
                        .setDisabled(true)
                );
                
            const disabledRow2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('welcome_autorole')
                        .setLabel(userLang === 'tr' ? 'Otorol' : 
                                 userLang === 'ru' ? 'Автороль' : 
                                 'Auto Role')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('<:basarili:1360967302605967400>')
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('welcome_autorole_disable')
                        .setLabel(userLang === 'tr' ? 'Otorol Kapat' : 
                                 userLang === 'ru' ? 'Отключить автороль' : 
                                 'Disable Auto Role')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:cancel:1360976312591978717>')
                        .setDisabled(true)
                );
            
            try {
                await message.edit({ components: [disabledRow, disabledRow2] });
            } catch (err) {
                // Ignore errors if message was deleted
            }
        });
        
    } catch (err) {
        console.error(err);
        await interaction.reply({ 
            content: userLang === 'tr' ? '<:cancel:1360976312591978717> Bir hata oluştu!' : 
                     userLang === 'ru' ? '<:cancel:1360976312591978717> Произошла ошибка!' : 
                     '<:cancel:1360976312591978717> An error occurred!', 
            ephemeral: true 
        });
    }
};

// Event handler for new members
module.exports.onGuildMemberAdd = async (client, member) => {
    try {
        // Get guild settings from MongoDB
        const guildSettings = await getGuildSettings(member.guild.id);
        
        if (!guildSettings || !guildSettings.welcomeChannel) {
            return;
        }
        
        const welcomeChannel = member.guild.channels.cache.get(guildSettings.welcomeChannel);
        if (!welcomeChannel) {
            return;
        }
        
        
        // Get guild language preference
        const guildLang = guildSettings.language || 'en';
        
        // Calculate member counts
        const currentCount = member.guild.memberCount;
        const goalCount = guildSettings.memberGoal || 100;
        const remainingCount = Math.max(0, goalCount - currentCount);
        
        // Check message type (text or canvas)
        if (guildSettings.messageType === 'canvas') {
            try {
                
                // Create canvas welcome image
                const welcomeBuffer = await createWelcomeCanvas(member, guildSettings, currentCount, goalCount, remainingCount, guildLang);
                
                if (welcomeBuffer) {
                    // Create attachment from buffer
                    const attachment = new AttachmentBuilder(welcomeBuffer, { name: 'welcome.png' });
                    
                    // Send canvas welcome message
                    await welcomeChannel.send({ files: [attachment] });
                } else {
                    // Fallback to text message if canvas creation fails
                    
                    // Generate default text welcome message
                    let welcomeMessage = '';
                    if (guildLang === 'tr') {
                        welcomeMessage = `<a:gir:1360969941821554729> ${member} sunucuya katıldı! **${currentCount}** üye olduk.\n${remainingCount > 0 ? `🎯 Hedefimize ulaşmak için **${remainingCount}** üye kaldı!` : '🎉 Hedefimize ulaştık!'}`;
                    } else if (guildLang === 'ru') {
                        welcomeMessage = `<a:gir:1360969941821554729> ${member} присоединился к серверу! Нас теперь **${currentCount}** участников.\n${remainingCount > 0 ? `🎯 Осталось **${remainingCount}** участников до нашей цели!` : '🎉 Мы достигли нашей цели!'}`;
                    } else {
                        welcomeMessage = `<a:gir:1360969941821554729> ${member} joined the server! We now have **${currentCount}** members.\n${remainingCount > 0 ? `🎯 **${remainingCount}** members left to reach our goal!` : '🎉 We reached our goal!'}`;
                    }
                    
                    await welcomeChannel.send(welcomeMessage);
                }
            } catch (error) {
                
                // Fallback to text message if any error occurs
                let welcomeMessage = '';
                if (guildLang === 'tr') {
                    welcomeMessage = `<a:gir:1360969941821554729> ${member} sunucuya katıldı! **${currentCount}** üye olduk.\n${remainingCount > 0 ? `🎯 Hedefimize ulaşmak için **${remainingCount}** üye kaldı!` : '🎉 Hedefimize ulaştık!'}`;
                } else if (guildLang === 'ru') {
                    welcomeMessage = `<a:gir:1360969941821554729> ${member} присоединился к серверу! Нас теперь **${currentCount}** участников.\n${remainingCount > 0 ? `🎯 Осталось **${remainingCount}** участников до нашей цели!` : '🎉 Мы достигли нашей цели!'}`;
                } else {
                    welcomeMessage = `<a:gir:1360969941821554729> ${member} joined the server! We now have **${currentCount}** members.\n${remainingCount > 0 ? `🎯 **${remainingCount}** members left to reach our goal!` : '🎉 We reached our goal!'}`;
                }
                
                await welcomeChannel.send(welcomeMessage);
                console.log(`[WELCOME] Fallback text welcome message sent successfully after error`);
            }
        } else {
            // Send text welcome message
            console.log(`[WELCOME] Creating text welcome message for ${member.user.tag}`);
            
            // Check if there's a custom welcome message
            let welcomeMessage = '';
            
            if (guildSettings.customWelcomeMessage) {
                // Use custom welcome message with placeholders
                welcomeMessage = processPlaceholders(guildSettings.customWelcomeMessage, member, currentCount, goalCount, remainingCount);
                console.log(`[WELCOME] Using custom welcome message`);
            } else {
                // Use default welcome message
                if (guildLang === 'tr') {
                    welcomeMessage = `<a:gir:1360969941821554729> ${member} sunucuya katıldı! **${currentCount}** üye olduk.\n${remainingCount > 0 ? `🎯 Hedefimize ulaşmak için **${remainingCount}** üye kaldı!` : '🎉 Hedefimize ulaştık!'}`;
                } else if (guildLang === 'ru') {
                    welcomeMessage = `<a:gir:1360969941821554729> ${member} присоединился к серверу! Нас теперь **${currentCount}** участников.\n${remainingCount > 0 ? `🎯 Осталось **${remainingCount}** участников до нашей цели!` : '🎉 Мы достигли нашей цели!'}`;
                } else {
                    welcomeMessage = `<a:gir:1360969941821554729> ${member} joined the server! We now have **${currentCount}** members.\n${remainingCount > 0 ? `🎯 **${remainingCount}** members left to reach our goal!` : '🎉 We reached our goal!'}`;
                }
                console.log(`[WELCOME] Using default welcome message`);
            }
            
            console.log(`[WELCOME] Sending welcome message to channel ${welcomeChannel.name} (${welcomeChannel.id}): ${welcomeMessage}`);
            await welcomeChannel.send(welcomeMessage);
            console.log(`[WELCOME] Welcome message sent successfully`);
        }
        
        // Assign auto role if configured
        if (guildSettings.autoRole) {
            try {
                const role = member.guild.roles.cache.get(guildSettings.autoRole);
                if (!role) {
                    console.log(`[WELCOME] Auto role ${guildSettings.autoRole} not found in guild ${member.guild.id}`);
                    return;
                }
                
                // Check if bot has permission to manage roles
                const botMember = member.guild.members.cache.get(client.user.id);
                if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                    console.log(`[WELCOME] Bot doesn't have ManageRoles permission in guild ${member.guild.id}`);
                    return;
                }
                
                // Check if bot's role is higher than the role to assign
                if (botMember.roles.highest.position <= role.position) {
                    console.log(`[WELCOME] Bot's highest role (${botMember.roles.highest.name}) is not higher than the role to assign (${role.name})`);
                    return;
                }
                
                await member.roles.add(role);
                console.log(`[WELCOME] Auto role ${role.name} assigned to ${member.user.tag}`);
            } catch (error) {
                console.error(`[WELCOME] Error assigning auto role to ${member.user.tag}:`, error);
                
                // Log more detailed error information
                if (error.code === 50013) { // Missing Permissions
                    console.log(`[WELCOME] Missing permissions to assign role. Make sure the bot's role is higher than the role it's trying to assign and has the ManageRoles permission.`);
                }
            }
        }
    } catch (error) {
        console.error('Error in onGuildMemberAdd:', error);
    }
};

// Event handler for members leaving
module.exports.onGuildMemberRemove = async (client, member) => {
    console.log(`[WELCOME] Member left: ${member.user.tag} (${member.id}) in guild ${member.guild.name} (${member.guild.id})`);
    try {
        // Get guild settings from MongoDB
        const guildSettings = await getGuildSettings(member.guild.id);
        
        if (!guildSettings || !guildSettings.welcomeChannel) {
            console.log(`[WELCOME] No welcome settings found for guild ${member.guild.id} or no welcome channel set`);
            return;
        }
        
        const welcomeChannel = member.guild.channels.cache.get(guildSettings.welcomeChannel);
        if (!welcomeChannel) {
            console.log(`[WELCOME] Welcome channel ${guildSettings.welcomeChannel} not found in guild ${member.guild.id}`);
            return;
        }
        
        console.log(`[WELCOME] Found welcome channel: ${welcomeChannel.name} (${welcomeChannel.id})`);
        
        // Get guild language preference
        const guildLang = guildSettings.language || 'en';
        console.log(`[WELCOME] Using language for guild ${member.guild.id}: ${guildLang}`);
        
        // Calculate member counts
        const currentCount = member.guild.memberCount;
        const goalCount = guildSettings.memberGoal || 100;
        const remainingCount = Math.max(0, goalCount - currentCount);
        
        // Check message type (text or canvas)
        if (guildSettings.messageType === 'canvas') {
            try {
                console.log(`[WELCOME] Creating canvas leave message for ${member.user.tag}`);
                
                // Create canvas leave image
                const leaveBuffer = await createLeaveCanvas(member, guildSettings, currentCount, goalCount, remainingCount, guildLang);
                
                if (leaveBuffer) {
                    // Create attachment from buffer
                    const attachment = new AttachmentBuilder(leaveBuffer, { name: 'goodbye.png' });
                    
                    // Send canvas leave message
                    await welcomeChannel.send({ files: [attachment] });
                    console.log(`[WELCOME] Canvas leave message sent successfully`);
                } else {
                    // Fallback to text message if canvas creation fails
                    console.log(`[WELCOME] Canvas creation failed, falling back to text message`);
                    
                    // Generate default text leave message
                    let leaveMessage = '';
                    if (guildLang === 'tr') {
                        leaveMessage = `<a:cik:1360969954001817850> ${member.user.tag} sunucudan ayrıldı! **${currentCount}** üye kaldık.\n${remainingCount > 0 ? `🎯 Hedefimize ulaşmak için **${remainingCount}** üye kaldı!` : '🎉 Hedefimize hala ulaşmış durumdayız!'}`;
                    } else if (guildLang === 'ru') {
                        leaveMessage = `<a:cik:1360969954001817850> ${member.user.tag} покинул сервер! Нас осталось **${currentCount}** участников.\n${remainingCount > 0 ? `🎯 Осталось **${remainingCount}** участников до нашей цели!` : '🎉 Мы все еще достигли нашей цели!'}`;
                    } else {
                        leaveMessage = `<a:cik:1360969954001817850> ${member.user.tag} left the server! We now have **${currentCount}** members.\n${remainingCount > 0 ? `🎯 **${remainingCount}** members left to reach our goal!` : '🎉 We still reached our goal!'}`;
                    }
                    
                    await welcomeChannel.send(leaveMessage);
                    console.log(`[WELCOME] Fallback text leave message sent successfully`);
                }
            } catch (error) {
                console.error(`[WELCOME] Error creating/sending canvas leave message:`, error);
                
                // Fallback to text message if any error occurs
                let leaveMessage = '';
                if (guildLang === 'tr') {
                    leaveMessage = `<a:cik:1360969954001817850> ${member.user.tag} sunucudan ayrıldı! **${currentCount}** üye kaldık.\n${remainingCount > 0 ? `🎯 Hedefimize ulaşmak için **${remainingCount}** üye kaldı!` : '🎉 Hedefimize hala ulaşmış durumdayız!'}`;
                } else if (guildLang === 'ru') {
                    leaveMessage = `<a:cik:1360969954001817850> ${member.user.tag} покинул сервер! Нас осталось **${currentCount}** участников.\n${remainingCount > 0 ? `🎯 Осталось **${remainingCount}** участников до нашей цели!` : '🎉 Мы все еще достигли нашей цели!'}`;
                } else {
                    leaveMessage = `<a:cik:1360969954001817850> ${member.user.tag} left the server! We now have **${currentCount}** members.\n${remainingCount > 0 ? `🎯 **${remainingCount}** members left to reach our goal!` : '🎉 We still reached our goal!'}`;
                }
                
                await welcomeChannel.send(leaveMessage);
                console.log(`[WELCOME] Fallback text leave message sent successfully after error`);
            }
        } else {
            // Send text leave message
            console.log(`[WELCOME] Creating text leave message for ${member.user.tag}`);
            
            // Check if there's a custom leave message
            let leaveMessage = '';
            
            if (guildSettings.customLeaveMessage) {
                // Use custom leave message with placeholders
                leaveMessage = processPlaceholders(guildSettings.customLeaveMessage, member, currentCount, goalCount, remainingCount);
                console.log(`[WELCOME] Using custom leave message`);
            } else {
                // Use default leave message
                if (guildLang === 'tr') {
                    leaveMessage = `<a:cik:1360969954001817850> ${member.user.tag} sunucudan ayrıldı! **${currentCount}** üye kaldık.\n${remainingCount > 0 ? `🎯 Hedefimize ulaşmak için **${remainingCount}** üye kaldı!` : '🎉 Hedefimize hala ulaşmış durumdayız!'}`;
                } else if (guildLang === 'ru') {
                    leaveMessage = `<a:cik:1360969954001817850> ${member.user.tag} покинул сервер! Нас осталось **${currentCount}** участников.\n${remainingCount > 0 ? `🎯 Осталось **${remainingCount}** участников до нашей цели!` : '🎉 Мы все еще достигли нашей цели!'}`;
                } else {
                    leaveMessage = `<a:cik:1360969954001817850> ${member.user.tag} left the server! We now have **${currentCount}** members.\n${remainingCount > 0 ? `🎯 **${remainingCount}** members left to reach our goal!` : '🎉 We still reached our goal!'}`;
                }
                console.log(`[WELCOME] Using default leave message`);
            }
            
            console.log(`[WELCOME] Sending leave message to channel ${welcomeChannel.name} (${welcomeChannel.id}): ${leaveMessage}`);
            await welcomeChannel.send(leaveMessage);
            console.log(`[WELCOME] Leave message sent successfully`);
        }
    } catch (error) {
        console.error('Error in onGuildMemberRemove:', error);
    }
};

module.exports.config = {
    name: t("welcome.name", { lng: 'en' }),
    description: t("welcome.description", { lng: 'en' }),
    name_localizations: {
        'tr': t("welcome.name", { lng: 'tr' }),
        'ru': t("welcome.name", { lng: 'ru' })
    },
    description_localizations: {
        'tr': t("welcome.description", { lng: 'tr' }),
        'ru': t("welcome.description", { lng: 'ru' })
    },
    cooldown: 20,
    required_bot_permissions: ["ManageMessages"],
    options: []
};
