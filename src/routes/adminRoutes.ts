import { Response, Router } from "express";
import { IRequest } from '../interfaces/IRequest';
import Company, { ICompany } from '../models/company';
import middlewaresAuth from '../middlewares/auth';
import middlewaresRol from '../middlewares/rol';
import UploadImageService from '../services/uploadImageService';
import Admin, { IAdmin } from '../models/admin';
import Credential, { ICredentialModel } from "../models/credentials";
import { ObjectId } from "bson";

class AdminRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }
 
    async getAdmins(req: IRequest, res: Response) {
        const auxCompanyRoutes:AdminRoutes = new AdminRoutes();
        const result: ICompany[] = await auxCompanyRoutes.adminAggregate();
        res.json(result);
    }

    async getAdmin(req: IRequest, res: Response) {
        const auxAdminRoutes:AdminRoutes = new AdminRoutes();
        const result: IAdmin[] = await auxAdminRoutes.adminAggregate(req.params.id);
        res.json(result[0]);
    }

    async adminAggregate(id?: string): Promise<ICompany[]> {
        const $match: any = id ? {_id:new ObjectId(id)} : {};
        return await Admin.aggregate([
            {$match},
            {$lookup:
                {
                    from: "credentials",
                    localField: "idCredential",
                    foreignField: "_id",
                    as: "Credential"
                }
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$Credential", 0 ] }, "$$ROOT" ] } }
            },
            {
                $project: {
                    "_id": 1,
                    "name": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                    "imageUrl": 1,
                    "rol": 1,
                    "email": 1,
                    "password": 1,
                }
            }
        ]);
    }

    async createAdmin(req: IRequest, res: Response) {
        const newCredential: ICredentialModel = new Credential(req.body);
        newCredential.rol = 'ADMIN';
        await newCredential.save();
        const newAdmin: IAdmin = new Admin(req.body);
        newAdmin.idCredential = newCredential.id;
        await newAdmin.save();
        newCredential.idUser = newAdmin.id;
        await newCredential.save();

        const auxCompanyRoutes:AdminRoutes = new AdminRoutes();
        const result: IAdmin[] = await auxCompanyRoutes.adminAggregate(newAdmin.id);

        res.json(result[0]);
    }

    async updateAdmin(req: IRequest, res: Response) {
        
        if (req.body._id) {
            delete req.body._id;
        }

        const idAdministrador: string|undefined = req.iam;
        let admin: IAdmin | null = null;
        let credential: ICredentialModel | null = null;
        let idAdmin: string = '';
        req.body.rol = 'ADMIN';
        if (!req.params.id && idAdministrador) {
            idAdmin = idAdministrador;
            admin = await Admin.findByIdAndUpdate(idAdmin, {$set:req.body}, {new: true});
            if (admin) {
                credential = await Credential.findByIdAndUpdate(admin.idCredential, {$set:req.body}, {new: true});
            }
        }
        else if (req.params.id) {
            idAdmin = req.params.id;
            admin = await Admin.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true}); 
            if (admin) {
                credential = await Credential.findByIdAndUpdate(admin.idCredential, {$set:req.body}, {new: true});
            }           
        }
        
        const auxAdminRoutes:AdminRoutes = new AdminRoutes();
        const result: ICompany[] = await auxAdminRoutes.adminAggregate(idAdmin);

        res.json(result[0]);     
    }

    async deleteAdmin(req: IRequest, res: Response) {
        const admin: IAdmin | null = await Admin.findById(req.params.id);
        if (admin) {
            await UploadImageService.removeImage(admin);
            await admin.remove();
            return res.json({message: 'Admin successfully removed.'});
        }
        res.json({message: 'Admin not found'});
    }

    // async removeImage(company: ICompany) {
    //     if (company && company.imageUrl) {
    //         const name = company.imageUrl.split('/').pop();
    //         if (name) {
    //             const local: string = __dirname.replace('\\routes', '\\').replace('/routes', '/');
    //             const file: string = path.join(local, 'public/profile', name);
    //             const exist: boolean = await fs.existsSync(file);
    //             if (exist) {
    //                 await fs.unlinkSync(file);
    //             }
    //         }
    //     }
    // }

    // async uploadImage(req: IRequest, res: Response) {
    //     const idCompany: string|undefined = req.body.id ? req.body.id : req.iam;
    //     const company: ICompany | null = await Company.findById(idCompany);
    //     if (company) {
    //         await this.removeImage(company);
    //     }
    //     const host = req.protocol + "://" + req.get('host') + '/static/profile/' + req.file.filename;
    //     await Company.findByIdAndUpdate(idCompany, {$set:{imageUrl: host}}, {new: true});
    //     res.json({imageUrl: host});
    // }

    routes() {
        this.router.route('/admins')
                        .get(middlewaresAuth.isAuth, middlewaresRol.isAdmin, this.getAdmins)
                        .post(middlewaresAuth.isAuth, middlewaresRol.isAdmin, this.createAdmin);
        this.router.route('/admins/:id')
                        .get(middlewaresAuth.isAuth, middlewaresRol.isAdmin, this.getAdmin)
                        .put(middlewaresAuth.isAuth, middlewaresRol.isAdmin, this.updateAdmin)
                        .delete(middlewaresAuth.isAuth, middlewaresRol.isAdmin, this.deleteAdmin);
    }
}

const userRoutes = new AdminRoutes();
userRoutes.routes();

export default userRoutes.router;