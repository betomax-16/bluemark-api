import { Router } from "express";
import userRoutes from "./userRoutes";
import companyRoutes from './companyRoutes';
import adminRoutes from './adminRoutes';
import promotionRoutes from './promotionRoutes';

class PostRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.use(userRoutes);
        this.router.use(companyRoutes);
        this.router.use(adminRoutes);
        this.router.use(promotionRoutes);
    }
}

const apiRoutes = new PostRoutes();
export default apiRoutes.router;