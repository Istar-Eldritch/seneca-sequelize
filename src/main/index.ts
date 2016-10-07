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

function loadModels(modelsPath, seneca, sequelize) {
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
      seneca.add({role: name, cmd: command}, (args, done) => {
        model[command](args.payload).then((result) => {
          let finalResult;
          if (Array.isArray(result)) {
            finalResult = result.map(e => e.toJSON());
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
    loadModels(options.modelsPath, seneca, sequelize);
    if (options.hooksPath) {
      loadHooks(options.hooksPath, seneca, sequelize);
    }
    console.log(`Plugin ${pluginName} loaded ${Object.keys(sequelize.models).length} models`);
    done();
  });

  return pluginName;
}

export default plugin;
