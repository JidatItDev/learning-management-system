import sequelize from '../config/database'; // adjust path as needed

async function testDatabase() {
  try {
    console.log('🔍 Connecting to the database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

testDatabase();
