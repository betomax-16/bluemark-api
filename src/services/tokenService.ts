import { IUserModel } from '../models/user';
import jwt from 'jwt-simple';
import moment from 'moment';

export interface PayloadJWT {
    sub?: string;
    rol?: string;
    iat?: number;
    exp?: number;
}

class TokenService {

    private SECRET_TOKEN: string = 'token';

    createToken(user: IUserModel): string {
        const payload: PayloadJWT = {
          sub: user._id,
          rol: user.rol,
          iat: moment().unix(),
          exp: moment().add(14, 'days').unix()
        }
      
        return jwt.encode(payload, this.SECRET_TOKEN);
    }
      
    decodeToken(token: string): Promise<PayloadJWT | any> {
        const decode = new Promise((resolve, reject) => {
          try {            
            const payload: PayloadJWT = jwt.decode(token, this.SECRET_TOKEN);
            resolve(payload);
          } catch (e) {
            reject({status: 500, message: e.message});
          }
        })
      
        return decode;
    }
}

const tokens = new TokenService();

export default tokens;