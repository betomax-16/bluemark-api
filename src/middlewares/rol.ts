import { Response, NextFunction } from "express";
import { IRequest } from '../interfaces/IRequest';

class MiddlewareRol {

    isUser(req: IRequest, res: Response, next: NextFunction) {
        if (req.rol == 'USER' || req.rol == 'COMPANY' || req.rol == 'ADMIN') { next(); }
        else { return res.status(400).send({message: 'You are not authorized.'}); }        
    }

    isAdmin(req: IRequest, res: Response, next: NextFunction) {
        if (req.rol == 'ADMIN') { next(); }
        else { return res.status(400).send({message: 'You are not authorized.'}); }
    }

    isCompany(req: IRequest, res: Response, next: NextFunction) {
        if (req.rol == 'COMPANY' || req.rol == 'ADMIN') { next(); }
        else { return res.status(400).send({message: 'You are not authorized.'}); }
    }
}

const middlewareRol = new MiddlewareRol();
export default middlewareRol;