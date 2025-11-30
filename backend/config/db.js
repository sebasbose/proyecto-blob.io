const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/blobio';
        
        console.log('🔄 Intentando conectar a MongoDB...');
        
        const conn = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000, // Timeout después de 5s
        });
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.log('⚠️  Continuando sin base de datos (modo desarrollo)');
        console.log('💡 Para conectar a MongoDB:');
        console.log('   1. Instala MongoDB localmente, o');
        console.log('   2. Actualiza MONGO_URI en .env con credenciales válidas de MongoDB Atlas');
        
        // No salir del proceso, permitir que el servidor continúe
        return false;
    }
};

module.exports = connectDB;
