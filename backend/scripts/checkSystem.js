const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Match = require('../models/Match');

async function checkSystem() {
    try {
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blobio');
        console.log(' Conexión a MongoDB exitosa\n');

        // Verificar usuarios
        const totalUsers = await User.countDocuments();
        console.log(`👥 Total de usuarios: ${totalUsers}`);

        if (totalUsers > 0) {
            const topUsers = await User.find({})
                .select('username stats.maxScore stats.totalWins level')
                .sort({ 'stats.maxScore': -1 })
                .limit(5);

            console.log('\n🏆 Top 5 jugadores por puntuación:');
            topUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.username} - ${user.stats.maxScore} puntos - Nivel ${user.level}`);
            });
        }

        // Verificar partidas
        const totalMatches = await Match.countDocuments();
        console.log(`\n Total de partidas: ${totalMatches}`);

        if (totalMatches > 0) {
            const recentMatches = await Match.find({})
                .populate('user', 'username')
                .sort({ date: -1 })
                .limit(5);

            console.log('\n Últimas 5 partidas:');
            recentMatches.forEach((match, index) => {
                const username = match.user?.username || 'Desconocido';
                console.log(`${index + 1}. ${username} - ${match.score} puntos - Posición ${match.position}/${match.totalPlayers}`);
            });
        }

        // Estadísticas globales
        const stats = await Match.aggregate([
            {
                $group: {
                    _id: null,
                    totalTime: { $sum: '$duration' },
                    avgScore: { $avg: '$score' }
                }
            }
        ]);

        if (stats.length > 0) {
            const totalTimeHours = Math.floor(stats[0].totalTime / 60);
            const avgScore = Math.floor(stats[0].avgScore);
            
            console.log('\n Estadísticas globales:');
            console.log(`  Tiempo total de juego: ${totalTimeHours} horas`);
            console.log(` Puntuación promedio: ${avgScore}`);
        }

        // Verificar estructura de datos
        if (totalUsers > 0) {
            const sampleUser = await User.findOne({});
            console.log('\n Verificación de estructura de datos:');
            console.log(' Campo stats.maxScore:', sampleUser.stats?.maxScore !== undefined);
            console.log(' Campo stats.totalWins:', sampleUser.stats?.totalWins !== undefined);
            console.log(' Campo stats.currentStreak:', sampleUser.stats?.currentStreak !== undefined);
            console.log(' Campo level:', sampleUser.level !== undefined);
            console.log(' Campo avatar:', sampleUser.avatar !== undefined);
        }

        console.log('\n Sistema de rankings verificado correctamente\n');
        
        if (totalUsers === 0) {
            console.log('  No hay usuarios en la base de datos');
            console.log(' Ejecuta "npm run seed" para crear datos de prueba\n');
        }

        process.exit(0);
    } catch (error) {
        console.error(' Error al verificar el sistema:', error.message);
        console.log('\n Soluciones posibles:');
        console.log('   1. Verifica que MongoDB esté corriendo');
        console.log('   2. Revisa la URI en el archivo .env');
        console.log('   3. Asegúrate de que las dependencias estén instaladas (npm install)\n');
        process.exit(1);
    }
}

checkSystem();
