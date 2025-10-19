/**
 * Migración para eliminar campos innecesarios de la tabla encuestas
 * Campos a eliminar:
 * - tiempo_estimado
 * - max_respuestas
 * - permite_multiple_respuesta
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Eliminar columna tiempo_estimado
      await queryInterface.removeColumn('encuestas', 'tiempo_estimado', { transaction });
      console.log('Columna tiempo_estimado eliminada');

      // Eliminar columna max_respuestas
      await queryInterface.removeColumn('encuestas', 'max_respuestas', { transaction });
      console.log('Columna max_respuestas eliminada');

      // Eliminar columna permite_multiple_respuesta
      await queryInterface.removeColumn('encuestas', 'permite_multiple_respuesta', { transaction });
      console.log('Columna permite_multiple_respuesta eliminada');

      await transaction.commit();
      console.log('Migración completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Restaurar columna tiempo_estimado
      await queryInterface.addColumn('encuestas', 'tiempo_estimado', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 10
      }, { transaction });
      console.log('Columna tiempo_estimado restaurada');

      // Restaurar columna max_respuestas
      await queryInterface.addColumn('encuestas', 'max_respuestas', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });
      console.log('Columna max_respuestas restaurada');

      // Restaurar columna permite_multiple_respuesta
      await queryInterface.addColumn('encuestas', 'permite_multiple_respuesta', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }, { transaction });
      console.log('Columna permite_multiple_respuesta restaurada');

      await transaction.commit();
      console.log('Rollback completado exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('Error en el rollback:', error);
      throw error;
    }
  }
};
