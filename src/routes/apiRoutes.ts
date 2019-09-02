import { Router } from "express";
import userRoutes from "./userRoutes";

class PostRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.use(userRoutes);
    }
}

const apiRoutes = new PostRoutes();
export default apiRoutes.router;