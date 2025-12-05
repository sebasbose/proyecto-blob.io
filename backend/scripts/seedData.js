const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importar modelos
const User = require('../models/User');
const Match = require('../models/Match');

// Datos predefinidos
const avatars = [
    'linear-gradient(45deg, #ff6b6b, #ffa726)',
    'linear-gradient(45deg, #4ecdc4, #45b7d1)',
    'linear-gradient(45deg, #96ceb4, #66bb6a)',
    'linear-gradient(45deg, #f06292, #ab47bc)',
    'linear-gradient(45deg, #ffb74d, #ffa726)',
    'linear-gradient(45deg, #64b5f6, #42a5f5)',
    'linear-gradient(45deg, #aed581, #8bc34a)',
    'linear-gradient(45deg, #ff8a65, #ff7043)'
];

const usernames = [
    'ProGamer', 'SuperNinja', 'MegaHunter', 'UltraWizard', 'KingHero',
    'QueenLegend', 'MasterChampion', 'EpicBeast', 'CrazyStar', 'WildPlayer',
    'BlobMaster', 'CellEater', 'TinyBlob', 'GiantCell', 'SpeedyBlob',
    'SneakyCell', 'PowerBlob', 'NinjaCell', 'TurboBlob', 'MysticCell',
    'ThunderBlob', 'ShadowCell', 'FlashBlob', 'StormCell', 'PhoenixBlob',
    'DragonCell', 'LionBlob', 'TigerCell', 'EagleBlob', 'SharkCell',
    'WolfBlob', 'BearCell', 'FalconBlob', 'ViperCell', 'RavenBlob',
    'PantherCell', 'LeopardBlob', 'CobraCell', 'HawkBlob', 'JaguarCell',
    'CheetahBlob', 'PumaCell', 'OrcaBlob', 'KrakenCell', 'WhaleBlob',
    'DolphinCell', 'MantaBlob', 'BarracudaCell', 'HammerBlob', 'SwordCell'
];

// Función para sembrar datos
async function seedData() {
    try {
        // Conectar a MongoDB con timeout aumentado
        console.log('Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blobio', {
          serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Conectado a MongoDB\n');

        // Limpiar datos existentes (opcional - comentar si quieres mantener datos)
        // await User.deleteMany({});
        // await Match.deleteMany({});
        // console.log('Datos anteriores eliminados');

        const users = [];
        
        // Crear 50 usuarios de ejemplo
        for (let i = 0; i < 50; i++) {
            const username = usernames[i];
            const gamesPlayed = Math.floor(Math.random() * 200) + 10;
            const totalWins = Math.floor(gamesPlayed * (Math.random() * 0.3 + 0.05)); // 5-35% win rate
            const maxScore = Math.floor(Math.random() * 150000) + 5000;
            const totalScore = Math.floor(maxScore * gamesPlayed * 0.6);
            
            const user = new User({
                username: username,
                email: `${username.toLowerCase()}@example.com`,
                password: await bcrypt.hash('password123', 10),
                avatar: avatars[i % avatars.length],
                bio: `Jugador apasionado de Blob.io`,
                level: Math.floor(Math.random() * 50) + 1,
                currentXP: Math.floor(Math.random() * 1000),
                maxXP: 1000,
                stats: {
                    maxScore: maxScore,
                    totalScore: totalScore,
                    totalWins: totalWins,
                    gamesPlayed: gamesPlayed,
                    totalTime: Math.floor(Math.random() * 5000) + 100, // minutos
                    eliminatedPlayers: Math.floor(Math.random() * 500) + 10,
                    timesEliminated: Math.floor(Math.random() * 800) + 20,
                    bestStreak: Math.floor(Math.random() * 10) + 1,
                    currentStreak: Math.floor(Math.random() * 3)
                },
                lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
            });

            await user.save();
            users.push(user);
            console.log(`Usuario creado: ${username}`);

            // Crear algunas partidas para cada usuario
            const numMatches = Math.floor(Math.random() * 10) + 5;
            for (let j = 0; j < numMatches; j++) {
                const score = Math.floor(Math.random() * maxScore * 0.8);
                const position = Math.floor(Math.random() * 20) + 1;
                const result = position === 1 ? 'win' : 'loss';
                
                const match = new Match({
                    user: user._id,
                    score: score,
                    position: position,
                    totalPlayers: Math.floor(Math.random() * 30) + 10,
                    duration: Math.floor(Math.random() * 15) + 1, // 1-15 minutos
                    result: result,
                    playersEliminated: Math.floor(Math.random() * 10),
                    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
                });

                await match.save();
            }
        }

        console.log(`\n✅ Se crearon ${users.length} usuarios y sus partidas correctamente`);
        console.log('\nPuedes iniciar sesión con cualquier usuario usando:');
        console.log('Email: [username]@example.com');
        console.log('Password: password123');
        console.log('\nEjemplos:');
        console.log('- blobmaster@example.com / password123');
        console.log('- celleater@example.com / password123');
        console.log('- progamer@example.com / password123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al sembrar datos:', error.message);
        console.log('\n💡 Asegúrate de que MongoDB esté corriendo');
        console.log('   Puedes iniciar MongoDB con: mongod');
        process.exit(1);
    }
}

// Ejecutar la función
seedData();
