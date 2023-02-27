import hpp from 'hpp';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import express from 'express';
import log4js from 'log4js';
import path from 'path';
import { PORT } from './../env.js';
import { createStream } from 'rotating-file-stream';
import { routeGenerator } from './core/routeGenerator.service';

const logPath = path.join(__dirname, '../log/error.log');
const logPathExpress = path.join(__dirname, '../log/express.log');

// log4js para el log de errores
const loggerFile = {
  type: "file",
  maxLogSize: 10485760,
  backups: 3,
  compress: true,
};
log4js.configure({
appenders: {
  stdout: { type: "stdout" },
  errorFile: { ...loggerFile, filename: logPath }
},
categories: {
    default: { appenders: ["stdout"], level: "info" },
    error: { appenders: ["stdout", "errorFile"], level: "error" }
}
});
const app = express();
/** CONFIG SERVER */
app.set('port', PORT ?? 8080);
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: false }));
//Logger
const stream = createStream(logPathExpress, {
  size: '10M',
  interval: '7d',
  compress: 'gzip',
})
app.use(morgan('combined', { stream }));
app.use(morgan('dev'));

//Security
app.use(cors());
app.use(hpp());
app.use(helmet());
app.disable('x-powered-by');

/** ROUTES */
const routes = routeGenerator(path.join(__dirname, 'modules'))

routes.forEach(({ module, path }) => {
  app.use(module, require(path))
})

app.all('*', function (req, res) {
  return res.status(404).json({
    hasrror: true,
    messsage:
      "🖐️ These Aren't the 🤖Droids You're Looking For, La ruta no existe",
    data: { method: req.method, url: req.originalUrl },
  })
})

app.listen(app.get('port'), () =>{
  console.log(`worker pid=${process.pid}`);
  console.log(`Server on port ${app.get('port')}`);
});
