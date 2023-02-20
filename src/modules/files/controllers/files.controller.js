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
  } = req;

  try{
    const pathFile = `${filesPath}${file}`;
    if ( ! fs.existsSync(pathFile) ) {
      return res.status(404).json({
        hasError: true,
        message: 'Archivo no encontrado',
        data: null
      }).end();
    }

    return res.sendFile(file, { root: filesPath, dotfiles: 'allow' });

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
