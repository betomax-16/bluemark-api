import TokenService from '../services/tokenService';
import { Response, NextFunction } from "express";
import { IRequest } from '../interfaces/IRequest';

class MiddlewareAuth {

    isAuth(req: IRequest, res: Response, next: NextFunction) {
        const token = req.headers.authorization;

        if (!token) {
          return res.status(403).send({message: 'Token missing.'});
        }
                  
        TokenService.decodeToken(token)
          .then(response => {
            req.iam = response.sub;
            req.rol = response.rol;
            next();
          })
          .catch(response => {      
            res.status(response.status).send(response);
          })
    }
}

const middlewareAuth = new MiddlewareAuth();
export default middlewareAuth;