import path from 'path';
import fs from 'fs';
import { Response } from "express";
import { IRequest } from '../interfaces/IRequest';
import Credential, { ICredentialModel } from '../models/credentials';
import Company, { ICompany } from '../models/company';
import User, { IUser } from '../models/user';
import { ObjectId } from 'bson';
import Admin, { IAdmin } from '../models/admin';

class UploadImageService {

    async removeImage(user: any) {
        if (user && user.imageUrl) {
            const name = user.imageUrl.split('/').pop();
            if (name) {
                const local: string = __dirname.replace('\\services', '\\').replace('/services', '/');
                const file: string = path.join(local, 'public/profile', name);
                const exist: boolean = await fs.existsSync(file);
                if (exist) {
                    await fs.unlinkSync(file);
                }
            }
        }
    }

    async uploadImage(req: IRequest, res: Response) {
        const aux: UploadImageService = new UploadImageService();
        const idUsuario: string|undefined = req.body.id ? req.body.id : req.iam;
        let rol: string|undefined;

        if (req.body.id) {
            const credential: ICredentialModel|null = await Credential.findOne({idUser: new ObjectId(idUsuario)});
            if (credential) {
                rol = credential.rol;
            }
        }
        else {
            rol = req.rol;
        }
        const host = req.protocol + "://" + req.get('host') + '/static/profile/' + req.file.filename;

        switch (rol) {
            case 'USER':
                    const user: IUser | null = await User.findById(idUsuario);
                    if (user) {
                        await aux.removeImage(user);
                    }
                    await User.findByIdAndUpdate(idUsuario, {$set:{imageUrl: host}}, {new: true});
                break;
            case 'COMPANY':
                    const company: ICompany | null = await Company.findById(idUsuario);
                    if (company) {
                        await aux.removeImage(company);
                    }
                    await Company.findByIdAndUpdate(idUsuario, {$set:{imageUrl: host}}, {new: true});
                break;
            case 'ADMIN':
                    const admin: IAdmin | null = await Admin.findById(idUsuario);
                    if (admin) {
                        await aux.removeImage(admin);
                    }
                    await Admin.findByIdAndUpdate(idUsuario, {$set:{imageUrl: host}}, {new: true});
                break;
            default:
                break;
        }
         
        res.json({imageUrl: host});
    }
    
}

export default new UploadImageService();