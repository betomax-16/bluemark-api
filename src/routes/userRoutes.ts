import { Request, Response, Router } from "express";
import { IRequest } from '../interfaces/IRequest';
import User, { IUserModel } from '../models/user';
import TokenService from '../services/tokenService';
import middlewaresAuth from '../middlewares/auth';
import middlewaresRol from '../middlewares/rol';
import path from 'path';
import fs from 'fs';

class UserRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    async getProfile(req: IRequest, res: Response) {
        const idUsuario: string|undefined = req.iam;
        if (!idUsuario) return res.status(400).send({message: 'Token fail.'});
        let user: IUserModel | null = await User.findById(idUsuario);
        if (!user) return res.status(404).send({message: 'User not found.'});
        if (user.password) { user.password = undefined; }
        return res.status(200).send(user);
    }
 
    async getUsers(req: IRequest, res: Response) {
        const users: IUserModel[] = await User.find();
        res.json(users);
    }

    async getUser(req: IRequest, res: Response) {
        const user: IUserModel | null = await User.findById(req.params.id);
        res.json(user);
    }

    async createUser(req: IRequest, res: Response) {
        const newUser: IUserModel = new User(req.body);
        await newUser.save();
        res.json(newUser);
    }

    async updateUser(req: IRequest, res: Response) {
        const idUsuario: string|undefined = req.iam;
        let user: IUserModel | null = null;
        if (!req.params.id && idUsuario) {
            user = await User.findByIdAndUpdate(idUsuario, {$set:req.body}, {new: true});
        }
        else if (req.params.id) {
            user = await User.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});            
        }
        res.json(user);     
    }

    async deleteUser(req: IRequest, res: Response) {
        await User.findByIdAndDelete(req.params.id);
        res.json({message: 'User successfully removed.'});
    }

    async login(req: IRequest, res: Response) {
        let user: IUserModel | null = await User.findOne({email: req.body.email}).exec();
        if (!user) {
            return res.status(400).send({message: 'The email does not exist'});
        }
        
        user.comparePassword(req.body.password, (err: any, match: boolean) => {
            if (!match) {
                return res.status(400).send({message: 'The password is invalid'});
            }
            else {
                if (user) {
                    const token: string = TokenService.createToken(user);
                    res.send({message: 'Wellcome!!', token});
                }                
            }
        });
    }

    async uploadImage(req: IRequest, res: Response) {
        const idUsuario: string|undefined = req.body.id ? req.body.id : req.iam;
        const user: IUserModel | null = await User.findById(idUsuario);
        if (user && user.imageUrl) {
            const name = user.imageUrl.split('/').pop();
            if (name) {
                const local: string = __dirname.replace('\\routes', '\\');
                const file: string = path.join(local, 'public/profile', name);
                const exist: boolean = await fs.existsSync(file);
                if (exist) {
                    await fs.unlinkSync(file);
                }
            }
        }
        
        const host = req.protocol + "://" + req.get('host') + '/static/profile/' + req.file.filename;
        await User.findByIdAndUpdate(idUsuario, {$set:{imageUrl: host}}, {new: true});
        res.json({imageUrl: host});
    }
    // --------------------------------------------------------------
    // --------------------------------------------------------------
    // --------------------------------------------------------------
    admin(req: IRequest, res: Response) {
        res.send({message: 'Admin'});
    }

    user(req: IRequest, res: Response) {
        res.send({message: 'User'});
    }

    company(req: IRequest, res: Response) {
        res.send({message: 'Company'});
    }
    // --------------------------------------------------------------
    // --------------------------------------------------------------
    // --------------------------------------------------------------

    routes() {
        this.router.route('/imageprofile')
                        .post(middlewaresAuth.isAuth, this.uploadImage);
        this.router.route('/profile')
                        .post(middlewaresAuth.isAuth, this.getProfile)
                        .put(middlewaresAuth.isAuth, this.updateUser);
        this.router.route('/login')
                        .post(this.login);
        this.router.route('/users')
                        .get(this.getUsers)
                        .post(this.createUser);
        this.router.route('/users/:id')
                        .get(this.getUser)
                        .put(this.updateUser)
                        .delete(this.deleteUser);

        // --------------------------------------------------------------
        // --------------------------------------------------------------
        // --------------------------------------------------------------
        this.router.route('/user').post(middlewaresAuth.isAuth, middlewaresRol.isUser, this.user);
        this.router.route('/admin').post(middlewaresAuth.isAuth, middlewaresRol.isAdmin,this.admin);
        this.router.route('/company').post(middlewaresAuth.isAuth, middlewaresRol.isCompany,this.company);
    }
}

const userRoutes = new UserRoutes();
userRoutes.routes();

export default userRoutes.router;