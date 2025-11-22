const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    position: {
        type: Number,
        required: true
    },
    totalPlayers: {
        type: Number,
        required: true
    },
    duration: {
        type: String, // Formato "5m 30s" o Number (segundos)
        required: true
    },
    result: {
        type: String,
        enum: ['win', 'loss'],
        required: true
    },
    eliminatedBy: {
        type: String
    },
    playersEliminated: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Match', MatchSchema);
