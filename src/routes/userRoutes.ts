import { Response, Router } from "express";
import { IRequest } from '../interfaces/IRequest';
import User, { IUser } from '../models/user';
import Company, { ICompany } from '../models/company';
import TokenService from '../services/tokenService';
import middlewaresAuth from '../middlewares/auth';
import middlewaresRol from '../middlewares/rol';
import multer from 'multer';
import path from 'path';
import UploadImageService from '../services/uploadImageService';
import Credential, { ICredentialModel } from "../models/credentials";
import { ObjectId } from "bson";
import Admin, { IAdmin } from "../models/admin";

class UserRoutes {
    private storage: multer.StorageEngine = multer.diskStorage({
        destination: path.join(__dirname.replace('\\routes', '\\').replace('/routes', '/'), 'public/profile'),
        filename: (req, file, cb) => {
            const name = file.originalname.split('.')[0];
            const ext = file.originalname.split('.').pop();
            const date = Date.now();
            cb(null, name + '-' + date + '.' + ext );
        }
    });

    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    async getProfile(req: IRequest, res: Response) {
        const idUsuario: string|undefined = req.iam;
        const rol: string|undefined = req.rol;
        if (!idUsuario) return res.status(400).send({message: 'Token fail.'});
        
        const auxUserRoutes:UserRoutes = new UserRoutes();
        let result: any;
        switch (rol) {
            case 'USER':
                    result = await auxUserRoutes.userAggregate(idUsuario);
                break;
            case 'COMPANY':
                    result = await auxUserRoutes.companyAggregate(idUsuario);
                break;
            case 'ADMIN':
                    result = await auxUserRoutes.adminAggregate(idUsuario);
                break;
            default:
                break;
        }
        
        result[0].password = undefined;
        res.json(result[0]);
    }
 
    async getUsers(req: IRequest, res: Response) {
        const auxUserRoutes:UserRoutes = new UserRoutes();
        const result: IUser[] = await auxUserRoutes.userAggregate();
        res.json(result);
    }

    async getUser(req: IRequest, res: Response) {
        const auxUserRoutes:UserRoutes = new UserRoutes();
        const result: IUser[] = await auxUserRoutes.userAggregate(req.params.id);
        res.json(result[0]);
    }

    async userAggregate(id?: string): Promise<IUser[]> {
        const $match: any = id ? {_id:new ObjectId(id)} : {};
        return await User.aggregate([
            {$match},
            {$lookup:
                {
                    from: "credentials",
                    localField: "idCredential",
                    foreignField: "_id",
                    as: "Credential"
                }
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$Credential", 0 ] }, "$$ROOT" ] } }
            },
            {
                $project: {
                    "_id": 1,
                    "name": 1,
                    "firstLastName": 1,
                    "secondLastName": 1,
                    "birthdate": 1,
                    "sex": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                    "imageUrl": 1,
                    "rol": 1,
                    "email": 1,
                    "password": 1,
                }
            }
        ]);
    }

    async companyAggregate(id?: string): Promise<ICompany[]> {
        const $match: any = id ? {_id:new ObjectId(id)} : {};
        return await Company.aggregate([
            {$match},
            {$lookup:
                {
                    from: "credentials",
                    localField: "idCredential",
                    foreignField: "_id",
                    as: "Credential"
                }
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$Credential", 0 ] }, "$$ROOT" ] } }
            },
            {
                $project: {
                    "_id": 1,
                    "name": 1,
                    "phone": 1,
                    "address": 1,
                    "cp": 1,
                    "type": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                    "imageUrl": 1,
                    "rol": 1,
                    "email": 1,
                    "password": 1,
                }
            }
        ]);
    }

    async adminAggregate(id?: string): Promise<IAdmin[]> {
        const $match: any = id ? {_id:new ObjectId(id)} : {};
        return await Admin.aggregate([
            {$match},
            {$lookup:
                {
                    from: "credentials",
                    localField: "idCredential",
                    foreignField: "_id",
                    as: "Credential"
                }
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$Credential", 0 ] }, "$$ROOT" ] } }
            },
            {
                $project: {
                    "_id": 1,
                    "name": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                    "imageUrl": 1,
                    "rol": 1,
                    "email": 1,
                    "password": 1,
                }
            }
        ]);
    }

    async createUser(req: IRequest, res: Response) {
        const newCredential: ICredentialModel = new Credential(req.body);
        await newCredential.save();
        const newUser: IUser = new User(req.body);
        newUser.idCredential = newCredential.id;
        await newUser.save();
        newCredential.idUser = newUser.id;
        await newCredential.save();

        const auxUserRoutes:UserRoutes = new UserRoutes();
        const result: IUser[] = await auxUserRoutes.userAggregate(newUser.id);

        res.json(result[0]);
    }

    async updateUser(req: IRequest, res: Response) {
        
        if (req.body._id) {
            delete req.body._id;
        }
        
        let idUsuario: string = '';
        const auxUserRoutes:UserRoutes = new UserRoutes();
        let result: any[] = [];
        let credential: ICredentialModel | null = null;
        if (!req.params.id && req.iam) {
            idUsuario = req.iam;
        }
        else if (req.params.id) {
            idUsuario = req.params.id;      
        }
        
        credential = await Credential.findOneAndUpdate({idUser: new ObjectId(idUsuario)}, {$set:req.body}, {new: true});
        if (credential) {
            switch (credential.rol) {
                case 'ADMIN':
                        await Admin.findByIdAndUpdate(idUsuario, {$set:req.body}, {new: true});
                        result = await auxUserRoutes.adminAggregate(idUsuario);
                    break;
                case 'COMPANY':
                        await Company.findByIdAndUpdate(idUsuario, {$set:req.body}, {new: true});
                        result = await auxUserRoutes.companyAggregate(idUsuario);
                    break;
                case 'USER':
                        await User.findByIdAndUpdate(idUsuario, {$set:req.body}, {new: true});
                        result = await auxUserRoutes.userAggregate(idUsuario);
                    break;
                default:
                    break;
            }
        }

        res.json(result[0]);     
    }

    async deleteUser(req: IRequest, res: Response) {
        const user: IUser | null = await User.findById(req.params.id);
        if (user) {
            await UploadImageService.removeImage(user);
            await user.remove();
            return res.json({message: 'User successfully removed.'});
        }
        res.json({message: 'User not found.'});
    }

    async login(req: IRequest, res: Response) {
        let credential: ICredentialModel | null = await Credential.findOne({email: req.body.email}).exec();
        if (!credential) {
            return res.status(400).send({message: 'The email does not exist'});
        }
        
        credential.comparePassword(req.body.password, (err: any, match: boolean) => {
            if (!match) {
                return res.status(400).send({message: 'The password is invalid'});
            }
            else {
                if (credential) {
                    const token: string = TokenService.createToken(credential);
                    res.send({message: 'Wellcome!!', token});
                }                
            }
        });
    }

    async signup(req: IRequest, res: Response) {
        const newCredential: ICredentialModel = new Credential(req.body);
        await newCredential.save();
        const newUser: IUser = new User(req.body);
        newUser.idCredential = newCredential._id;
        await newUser.save();
        newCredential.idUser = newUser._id;
        await newCredential.save();
        // regresar el usuario completo
        const token: string = TokenService.createToken(newCredential);
        res.send({message: 'Wellcome!!', token});
    }

    async getRol(req: IRequest, res: Response) {
        const credential: ICredentialModel | null = await Credential.findOne({idUser: new ObjectId(req.params.id)});
        if (credential) {
            res.json({rol: credential.rol});
        }
        else {
            res.json({message: 'Dont find user.'});
        }
    }

    // async removeImage(user: IUser) {
    //     if (user && user.imageUrl) {
    //         const name = user.imageUrl.split('/').pop();
    //         if (name) {
    //             const local: string = __dirname.replace('\\routes', '\\').replace('/routes', '/');
    //             const file: string = path.join(local, 'public/profile', name);
    //             const exist: boolean = await fs.existsSync(file);
    //             if (exist) {
    //                 await fs.unlinkSync(file);
    //             }
    //         }
    //     }
    // }

    // async uploadImage(req: IRequest, res: Response) {
    //     const idUsuario: string|undefined = req.body.id ? req.body.id : req.iam;
    //     const user: IUser | null = await User.findById(idUsuario);
    //     if (user) {
    //         await this.removeImage(user);
    //     }
    //     const host = req.protocol + "://" + req.get('host') + '/static/profile/' + req.file.filename;
    //     await User.findByIdAndUpdate(idUsuario, {$set:{imageUrl: host}}, {new: true});
    //     res.json({imageUrl: host});
    // }

    routes() {
        this.router.route('/rol/:id')
                        .post(middlewaresAuth.isAuth, this.getRol);
        this.router.route('/imageprofile')
                        .post(middlewaresAuth.isAuth, middlewaresRol.isUser, multer({storage: this.storage}).single('photo'), UploadImageService.uploadImage);
        this.router.route('/profile')
                        .post(middlewaresAuth.isAuth, middlewaresRol.isUser, this.getProfile)
                        .put(middlewaresAuth.isAuth, middlewaresRol.isUser, this.updateUser);
        this.router.route('/signup')
                        .post(this.signup);
        this.router.route('/login')
                        .post(this.login);
        this.router.route('/users')
                        .get(middlewaresAuth.isAuth, middlewaresRol.isAdmin, this.getUsers)
                        .post(middlewaresAuth.isAuth, middlewaresRol.isAdmin, this.createUser);
        this.router.route('/users/:id')
                        .get(middlewaresAuth.isAuth, middlewaresRol.isUser, this.getUser)
                        .put(middlewaresAuth.isAuth, middlewaresRol.isUser, this.updateUser)
                        .delete(middlewaresAuth.isAuth, middlewaresRol.isAdmin, this.deleteUser);
    }
}

const userRoutes = new UserRoutes();
userRoutes.routes();

export default userRoutes.router;