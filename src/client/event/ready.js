const config = require('../config/bot_config.json')
    
module.exports = (client) => {
    client.on('ready', () => {
        // Set activity once instead of every 5 seconds to avoid sharding errors
        client.user.setActivity(`${config.durum}`);
        console.log(`> "${config.name}" Bot active for discord`);
        
        // Log that the welcome system is ready
        console.log(`> Welcome system is ready and listening for member events`);
    });
};
