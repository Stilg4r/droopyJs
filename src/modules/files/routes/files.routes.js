import Router from 'express'
import multer from 'multer'
import { 
  list,
  sendFile,
  reciveFile
} from '../controllers/files.controller'
const router = Router()


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})
const upload = multer({ storage: storage })

router.get('/list', list);
router.get(/^(\/get)(\/[%\.\-;:&=+$\(\)\ ,\w]*\.?[-;:&=+$,\w]+)$/, sendFile );
router.post('/send', upload.single('file'), reciveFile );

module.exports = router
