# seneca-sequelize
This plugin makes a microservice out of your sequelize models. It works wrapping your sequelize instance and exposing your model methods as actions.

### Install with npm
`npm i --save seneca-sequelize`

### Define your models
```ts
// user.js
export default function(sequelize, types) {
  return sequelize.define('user',
    {
      name: types.STRING,
      age: types.INTEGER
    }
  );
}
```

### Load the plugin
```ts
import * as Sequelize from 'sequelize';
import * as Seneca from 'seneca';
import senecaSeq from 'seneca-sequelize';

// Setup your seneca instance
const seneca = Seneca();

// Setup your sequelize instance
const sequelize = new Sequelize('user', 'password', 'database', {
  dialect: 'sqlite'
});

/**
 * Initialize the plugin
 * Options:
 *  - sequelize (required): A sequelize instance.
 *  - modelsPath (required): The path where you have defined your sequelize models.
 *  - hooksPath (optional): The path where you have defined your sequelize hooks.
 *  - roleName (Optional): The role that will be used when you call act on seneca to access the generated services.
 */
seneca.use(senecaSeq, {modelsPath: 'dist/test/models/*', sequelize: sequelize, roleName: 'mymodels'});

// Start your seneca service
seneca.listen();
```

### Example of usage with curl, check out [sequelize](http://docs.sequelizejs.com/en/v3/) for more examples of queries
```bash
curl http://localhost:10101/act -d '
{
  "role": "mymodels"
  "model": "user",
  "cmd": "findAll"
  "payload": {
    "where": {
      "age": {
        "$gt": 20
      }
    }
  }
}
'
```
