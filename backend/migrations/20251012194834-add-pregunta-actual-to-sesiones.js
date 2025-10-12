'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sesiones_encuesta', 'pregunta_actual', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Índice de la pregunta actual donde el usuario dejó el progreso'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sesiones_encuesta', 'pregunta_actual');
  }
};

