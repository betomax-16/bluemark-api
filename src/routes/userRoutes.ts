import { Request, Response, Router } from "express";
import User from '../models/user';

class UserRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    async getUsers(req: Request, res: Response) {
        const users = await User.find();
        res.json(users);
    }

    async getUser(req: Request, res: Response) {
        const user = await User.findById(req.params.id);
        res.json(user);
    }

    async createUser(req: Request, res: Response) {
        const newUser = new User(req.body);
        await newUser.save();
        res.json(newUser);
    }

    async updateUser(req: Request, res: Response) {
        const user = await User.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});
        res.json(user);
    }

    async deleteUser(req: Request, res: Response) {
        await User.findByIdAndDelete(req.params.id);
        res.json({message: 'User successfully removed.'});
    }

    routes() {
        this.router.route('/users')
                        .get(this.getUsers)
                        .post(this.createUser);
        this.router.route('/users/:id')
                        .get(this.getUser)
                        .put(this.updateUser)
                        .delete(this.deleteUser);
    }
}

const userRoutes = new UserRoutes();
userRoutes.routes();

export default userRoutes.router;