import { Request, Response, Router } from "express";
import User, { IUserModel } from '../models/user';
import TokenService from '../services/tokenService';
import middlewaresAuth from '../middlewares/auth';
import middlewaresRol from '../middlewares/rol';

class UserRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    async getUsers(req: Request, res: Response) {
        const users: IUserModel[] = await User.find();
        res.json(users);
    }

    async getUser(req: Request, res: Response) {
        const user: IUserModel | null = await User.findById(req.params.id);
        res.json(user);
    }

    async createUser(req: Request, res: Response) {
        const newUser: IUserModel = new User(req.body);
        await newUser.save();
        res.json(newUser);
    }

    async updateUser(req: Request, res: Response) {
        const user: IUserModel | null = await User.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});
        res.json(user);
    }

    async deleteUser(req: Request, res: Response) {
        await User.findByIdAndDelete(req.params.id);
        res.json({message: 'User successfully removed.'});
    }

    async login(req: Request, res: Response) {
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

    // --------------------------------------------------------------
    // --------------------------------------------------------------
    // --------------------------------------------------------------
    admin(req: Request, res: Response) {
        res.send({message: 'Admin'});
    }

    user(req: Request, res: Response) {
        res.send({message: 'User'});
    }

    company(req: Request, res: Response) {
        res.send({message: 'Company'});
    }
    // --------------------------------------------------------------
    // --------------------------------------------------------------
    // --------------------------------------------------------------

    routes() {
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