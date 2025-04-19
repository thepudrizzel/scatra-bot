const { model, Schema } = require("mongoose");

module.exports = model("Welcome_System", new Schema(
    {
        guildId: { type: String, required: true },
        welcomeChannel: { type: String, default: null },
        memberGoal: { type: Number, default: 100 },
        autoRole: { type: String, default: null },
        language: { type: String, default: "en" },
        messageType: { type: String, default: "text" }, // "text" or "canvas"
        customWelcomeMessage: { type: String, default: null },
        customLeaveMessage: { type: String, default: null },
        canvasBackground: { type: String, default: null },
        canvasTextColor: { type: String, default: "#ffffff" }
    }
));
