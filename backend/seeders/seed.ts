import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../src/config/database';
import { Employee } from '../src/models';

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const count = await Employee.count();
    if (count > 0) {
      console.log('Employees already seeded. Skipping.');
      await sequelize.close();
      return;
    }

    await Employee.bulkCreate([
      { name: 'Alice Johnson' },
      { name: 'Bob Smith' },
      { name: 'Carol Williams' },
      { name: 'David Brown' },
      { name: 'Eve Davis' },
    ]);

    console.log('Seeding complete! 5 employees created.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
