import fs from 'fs';
import path from 'path';
import{ response500 } from '../../../core/responses.service.js';

import  argv  from 'minimist';
const args = argv(process.argv.slice(2));
const filesPath = path.resolve(args['files-path'] ?? './');

const list = async (req, res) => {
  try {
    const all = fs.readdirSync( filesPath,  { withFileTypes: true } );

    const files = all
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);

    return res.status(200).json({
      hasError: false,
      message: 'Listado de archivos',
      data: files
    }).end();
  }
  catch (error) {
    return response500(res, {
      hasError: true,
      message: 'Error al listar los archivos',
      data: error
    });
  }  
};

const sendFile = async (req, res) => {
  const {
    params: { 1: file },
    headers: { range }
  } = req;
  try{
    const filePath = `${filesPath}${file}`;
    if ( ! fs.existsSync(filePath) ) {
      return res.status(404).json({
        hasError: true,
        message: 'Archivo no encontrado',
        data: null
      }).end();
    }
    const stat = fs.statSync(filePath);
    const { size: fileSize } = stat;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
      const chunksize = (end-start)+1;
      const file = fs.createReadStream(filePath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/octet-stream',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'application/octet-stream',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    return response500(res, {
      hasError: true,
      message: 'Error al enviar el archivo',
      data: error
    });
  }
};

const reciveFile = async (req, res) => {
  const { file } = req;

  const { destination, filename, originalname } = file;
  const origin  = `${path.resolve(destination)}/${filename}`;
  const destinationPath = `${filesPath}/${originalname}`;
  
  if ( fs.existsSync(destinationPath) ) {
    return res.status(409).json({
      hasError: true,
      message: 'Archivo ya existe',
      data: originalname
    }).end();
  }
  try{
    const fileBuffer = fs.readFileSync(origin);
    fs.writeFileSync(destinationPath, fileBuffer);
    fs.unlinkSync(origin);
    return res.status(200).json({
      hasError: false,
      message: 'Archivo recibido',
      data: originalname
    }).end();
  } catch (error) {
    return response500(res, {
      hasError: true,
      message: 'Error al recibir el archivo',
      data: error
    });
  }
};

module.exports = {
  list,
  sendFile,
  reciveFile
};
