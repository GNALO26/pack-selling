const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB erreur : ${err.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connexion fermée');
  process.exit(0);
});

module.exports = connectDB;
