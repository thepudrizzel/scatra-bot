const config = require('../config/bot_config.json');

module.exports.execute = async (client) => {
    // Set activity once instead of using setInterval to avoid sharding errors
    try {
        client.user.setActivity(`${config.durum}`);
    } catch (error) {
        console.error('Error setting activity:', error);
    }
    
    console.log(`> "${config.name}" Bot active for discord`);
    
    // Log welcome system status
    console.log(`> Welcome system initialized in function/ready.js`);
};

module.exports.config = {
    name: "ready",
    once: true
};
