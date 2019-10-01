import { Router } from "express";
import userRoutes from "./userRoutes";
import companyRoutes from './companyRoutes';
import adminRoutes from './adminRoutes';

class PostRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.use(userRoutes);
        this.router.use(companyRoutes);
        this.router.use(adminRoutes);
    }
}

const apiRoutes = new PostRoutes();
export default apiRoutes.router;