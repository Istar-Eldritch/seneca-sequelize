import {promisify} from 'bluebird';
import {Glob} from 'glob';
import {isAbsolute, join} from 'path';

const pluginName = 'seneca-sequelize';

const gAsync = promisify(Glob);

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

async function init(modelsPath, seneca, sequelize) {
  let files = await gAsync(modelsPath);
  
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
          let finalResult = typeof result === 'object' ? result.toJSON() : {result: result};
          done(null, finalResult);
        })
        .catch(done);
      });
    });

  });

  return sequelize;
}

function plugin(options) {
  let seneca = this;
  this.add({init: pluginName}, (args, done) => {
    init(options.path, seneca, options.sequelize).then((sequelize) => {
      console.log(`Plugin ${pluginName} loaded ${Object.keys(sequelize.models).length} models`);
      done();
    })
    .catch(err => {
      throw err;
    });
  });

  return pluginName;
}

export default plugin;
