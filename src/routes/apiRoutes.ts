import { Router } from "express";
import userRoutes from "./userRoutes";
import companyRoutes from './companyRoutes';
import adminRoutes from './adminRoutes';
import promotionRoutes from './promotionRoutes';
import couponRoutes from './couponRoutes';

class PostRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.use(userRoutes);
        this.router.use(companyRoutes);
        this.router.use(adminRoutes);
        this.router.use(promotionRoutes);
        this.router.use(couponRoutes);
    }
}

const apiRoutes = new PostRoutes();
export default apiRoutes.router;