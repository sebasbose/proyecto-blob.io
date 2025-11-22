const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Por favor ingrese un nombre de usuario'],
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 15
    },
    email: {
        type: String,
        required: [true, 'Por favor ingrese un email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Por favor ingrese un email válido'
        ]
    },
    password: {
        type: String,
        required: [true, 'Por favor ingrese una contraseña'],
        minlength: 6,
        select: false // No devolver la contraseña por defecto
    },
    avatar: {
        type: String,
        default: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)'
    },
    bio: {
        type: String,
        default: 'Nuevo jugador de Blob.io',
        maxlength: 100
    },
    level: {
        type: Number,
        default: 1
    },
    currentXP: {
        type: Number,
        default: 0
    },
    maxXP: {
        type: Number,
        default: 1000
    },
    stats: {
        maxScore: { type: Number, default: 0 },
        totalScore: { type: Number, default: 0 },
        totalWins: { type: Number, default: 0 },
        gamesPlayed: { type: Number, default: 0 },
        totalTime: { type: Number, default: 0 }, // En minutos
        eliminatedPlayers: { type: Number, default: 0 },
        timesEliminated: { type: Number, default: 0 },
        bestStreak: { type: Number, default: 0 }
    },
    settings: {
        colorScheme: { type: String, default: 'random' },
        showGrid: { type: Boolean, default: true },
        showNames: { type: Boolean, default: true },
        soundEffects: { type: Boolean, default: true },
        profilePublic: { type: Boolean, default: true },
        showOnline: { type: Boolean, default: true },
        allowFriendRequests: { type: Boolean, default: true }
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encriptar contraseña antes de guardar
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar contraseñas
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
