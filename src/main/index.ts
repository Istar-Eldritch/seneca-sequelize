import {promisify} from 'bluebird';
import {sync} from 'glob';
import {isAbsolute, join} from 'path';

const pluginName = 'seneca-sequelize';

const supportedCmds = [
  'create',
  'findOrCreate',
  'findById',
  'findOne',
  'findAll',
  'findAndCountAll',
  'count',
  'bulkCreate',
  'update',
  'upsert',
  'destroy'
];

function getFunctions(model) {
  return Object.getOwnPropertyNames(model).filter(key => typeof model[key] === 'function');
}

function replaceModels(sequelize, payload) {

  if (payload.model) {
    payload.model = sequelize.models[payload.model];
  }

  if (payload.include) {
    payload.include = payload.include.map(inclusion => {
      return replaceModels(sequelize, inclusion);
    });
  }

  return payload;
}

function loadModels(roleName, modelsPath, seneca, sequelize) {
  let files = sync(modelsPath);
  
  let models = files.reduce((acc, file) => {
    let filePath = isAbsolute(file) ? file : join(process.cwd(), file);
    let model = sequelize.import(filePath);
    acc[model.name] = model;
    return acc;
  }, {});

  Object.keys(models).forEach(name => {
    let model = models[name];
    if (model.hasOwnProperty('associate')) {
      model.associate(models);
    }

    supportedCmds.forEach(command => {
      seneca.add({role: roleName, model: name, cmd: command}, (msg, done) => {

        let args = [];
        if (command !== 'update' && command !== 'create') {
          args.push(replaceModels(model.sequelize, msg.payload || {}));
        }
        else {
          args.push(msg.payload);
        }

        if (command === 'update') {
          args.push(replaceModels(model.sequelize, msg.query || {}));
        }

        model[command].apply(model, args).then((result) => {
          let finalResult;
          if (result === null) {
            finalResult = result;
          }
          else if (command === 'count' && Array.isArray(result)) {
            finalResult = {result: result[0].count};
          }
          else if (Array.isArray(result)) {
            finalResult = result.map(e => {
              return typeof e.toJSON === 'function' ? e.toJSON() : e;
            });
          }
          else if (typeof result === 'object' && typeof result.toJSON === 'function') {
            finalResult = result.toJSON();
          }
          else {
            finalResult = {result: result};
          }
          done(null, finalResult);
        })
        .catch(done);
      });
    });

  });

  return sequelize;
}

function loadHooks(hooksPath, seneca, sequelize) {
  let files = sync(hooksPath);

  files.forEach((file) => {
    let filePath = isAbsolute(file) ? file: join(process.cwd(), file);
    let hook = require(filePath);
    hook(seneca, sequelize);
  });
}

function plugin(options) {
  let seneca = this;
  this.add({init: pluginName}, (args, done) => {
    let sequelize = options.sequelize;
    loadModels(options.roleName || 'crud', options.modelsPath, seneca, sequelize);
    if (options.hooksPath) {
      loadHooks(options.hooksPath, seneca, sequelize);
    }
    console.log(`Plugin ${pluginName} loaded ${Object.keys(sequelize.models).length} models`);
    done();
  });

  return pluginName;
}

export default plugin;
