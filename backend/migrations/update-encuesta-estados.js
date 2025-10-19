/**
 * Migración para actualizar el ENUM de estados de la tabla encuestas
 * Eliminar estados: PAUSADA y CERRADA
 * Mantener estados: BORRADOR y ACTIVA
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Paso 1: Cambiar encuestas con estado PAUSADA o CERRADA a BORRADOR
      await queryInterface.sequelize.query(
        `UPDATE encuestas SET estado = 'BORRADOR' WHERE estado IN ('PAUSADA', 'CERRADA')`,
        { transaction }
      );
      console.log('Encuestas con estado PAUSADA o CERRADA cambiadas a BORRADOR');

      // Paso 2: Modificar la columna para usar el nuevo ENUM
      await queryInterface.changeColumn('encuestas', 'estado', {
        type: Sequelize.ENUM('BORRADOR', 'ACTIVA'),
        allowNull: false,
        defaultValue: 'BORRADOR'
      }, { transaction });
      console.log('ENUM de estado actualizado a solo BORRADOR y ACTIVA');

      await transaction.commit();
      console.log('Migración de estados completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Restaurar el ENUM original con todos los estados
      await queryInterface.changeColumn('encuestas', 'estado', {
        type: Sequelize.ENUM('BORRADOR', 'ACTIVA', 'PAUSADA', 'CERRADA'),
        allowNull: false,
        defaultValue: 'BORRADOR'
      }, { transaction });
      console.log('ENUM de estado restaurado con todos los valores');

      await transaction.commit();
      console.log('Rollback de estados completado exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('Error en el rollback:', error);
      throw error;
    }
  }
};

