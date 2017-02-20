
export default function(sequelize, types) {
  return sequelize.define(
    'user',
    {
      name: types.STRING,
      age: types.INTEGER
    }
  );
}
