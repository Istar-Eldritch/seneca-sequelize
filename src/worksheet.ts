import * as Sequelize from 'sequelize';
import * as Seneca from 'seneca';
import senecaSeq from './main/index';

const seneca = Seneca();

const sequelize = new Sequelize('test', 'test', 'test', {
  dialect: 'sqlite'
});

seneca.use(senecaSeq, {path: 'dist/test/models/*', sequelize: sequelize});

seneca.listen();
