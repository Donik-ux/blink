import mongoose from '../db/mongooseShim.js';

// Подключение к in-memory БД (шим Mongoose с персистом в JSON-файл).
// Полностью заменяет MongoDB — никакие внешние сервисы не требуются.
export const connectDB = async () => {
  try {
    await mongoose.connect();
    console.log('✓ БД готова (in-memory + JSON persist)');
  } catch (error) {
    console.error('✗ Ошибка инициализации БД:', error.message);
    process.exit(1);
  }
};
