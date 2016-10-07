# seneca-sequelize
This plugin makes a microservice out of your sequelize models. It works wrapping your sequelize instance and exposing your model methods as actions.

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
import senecaSeq from './main/index';

// Setup your seneca instance
const seneca = Seneca();

// Setup your sequelize instance
const sequelize = new Sequelize('user', 'password', 'database', {
  dialect: 'sqlite'
});

// Initialize the plugin
seneca.use(senecaSeq, {path: 'dist/test/models/*', sequelize: sequelize});

// Start your seneca service
seneca.listen();
```

### Example of usage with curl, check out [sequelize](http://docs.sequelizejs.com/en/v3/) for more examples of queries
```bash
curl http://localhost:10101/act -d '
{
  "role": "user",
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
