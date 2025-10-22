import { Alert } from 'react-native';
import { DatabaseService } from '../services/DatabaseService';

export const testDatabaseConnection = async () => {
  try {
    // 1. Test database connection
    const db = await DatabaseService.getDB();
    console.log('✅ Database connection successful');

    // 2. Test creating a test table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value INTEGER
      )`);
    console.log('✅ Test table created/verified');

    // 3. Test inserting data
    const insertResult = await db.executeSql(
      'INSERT INTO test_table (name, value) VALUES (?, ?)',
      ['test', 123]
    );
    console.log('✅ Data inserted:', insertResult[0].insertId);

    // 4. Test querying data
    const [selectResult] = await db.executeSql(
      'SELECT * FROM test_table WHERE name = ?',
      ['test']
    );
    console.log('✅ Query results:', selectResult.rows._array);

    // 5. Test updating data
    const updateResult = await db.executeSql(
      'UPDATE test_table SET value = ? WHERE name = ?',
      [456, 'test']
    );
    console.log('✅ Data updated, rows affected:', updateResult[0].rowsAffected);

    // 6. Test deleting data
    const deleteResult = await db.executeSql(
      'DELETE FROM test_table WHERE name = ?',
      ['test']
    );
    console.log('✅ Data deleted, rows affected:', deleteResult[0].rowsAffected);

    // 7. Test transaction
    await new Promise((resolve, reject) => {
      db.transaction(
        async (tx) => {
          try {
            await tx.executeSql('INSERT INTO test_table (name, value) VALUES (?, ?)', ['tx1', 1]);
            await tx.executeSql('INSERT INTO test_table (name, value) VALUES (?, ?)', ['tx2', 2]);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          console.error('Transaction error:', error);
          reject(error);
        },
        () => {
          console.log('✅ Transaction completed successfully');
          resolve();
        }
      );
    });

    // 8. Clean up
    await db.executeSql('DROP TABLE IF EXISTS test_table');
    console.log('✅ Cleanup completed');

    Alert.alert(
      'Prueba de Base de Datos Exitosa',
      'Todas las operaciones de la base de datos se completaron correctamente.'
    );
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    Alert.alert(
      'Error en la Prueba de Base de Datos',
      `Se produjo un error: ${error.message}`
    );
    return false;
  }
};
