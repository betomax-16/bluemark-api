import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoose from "mongoose";
import compression from 'compression';
import cors from 'cors';
import path from 'path';

import indexRoutes from './routes/indexRoutes';
import apiRoutes from './routes/apiRoutes';
import { pathToFileURL } from 'url';

class Server {
    public app: express.Application;

    private optionsCors: cors.CorsOptions = {
        allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "X-Access-Token"],
        credentials: true,
        methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
        origin: 'http://localhost:4200',
        preflightContinue: false
    };

    constructor() {
        this.app = express();
        this.config();
        this.routes();
    }

    config() {
        // MongoDB
        const MONGO_URI = 'mongodb://admin:Moonblack12@ds035787.mlab.com:35787/bluemark';
        mongoose.set('useFindAndModify', true);
        mongoose.connect(MONGO_URI || process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useCreateIndex: true,
        }).then(db => console.log('DB is connected'));

        // Settings
        this.app.set('port', process.env.PORT || 3000);

        // Middlewares
        this.app.use('/static', express.static(path.join(__dirname,'public')));
        this.app.use(morgan('dev'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: false}));
        this.app.use(helmet());
        this.app.use(compression());
        // const storage: multer.StorageEngine = multer.diskStorage({
        //     destination: path.join(__dirname, 'public/profile'),
        //     filename: (req, file, cb) => {
        //         const name = file.originalname.split('.')[0];
        //         const ext = file.originalname.split('.').pop();
        //         const date = Date.now();
        //         cb(null, name + '-' + date + '.' + ext );
        //     }
        // });
        // this.app.use(multer({storage}).single('photo'));
        // this.app.use(cors(this.optionsCors));
        this.app.use(cors());
    }

    routes() {
        this.app.use(indexRoutes);
        this.app.use('/api', apiRoutes);
    }

    start() {
        this.app.listen(this.app.get('port'), () => {
            console.log('Server on port', this.app.get('port'));
        });
    }
}

const server = new Server();
server.start();