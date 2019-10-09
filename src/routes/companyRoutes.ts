import { Response, Router } from "express";
import { IRequest } from '../interfaces/IRequest';
import Company, { ICompany } from '../models/company';
import middlewaresAuth from '../middlewares/auth';
import middlewaresRol from '../middlewares/rol';
import UploadImageService from '../services/uploadImageService';
import Credential, { ICredentialModel } from "../models/credentials";
import { ObjectId } from "bson";
import Promotion from "../models/promotion";

class CompanyRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }
 
    async getCompanies(req: IRequest, res: Response) {
        const auxCompanyRoutes:CompanyRoutes = new CompanyRoutes();
        const result: ICompany[] = await auxCompanyRoutes.companyAggregate();
        res.json(result);
    }

    async getCompany(req: IRequest, res: Response) {
        const auxCompanyRoutes:CompanyRoutes = new CompanyRoutes();
        const result: ICompany[] = await auxCompanyRoutes.companyAggregate(req.params.id);
        res.json(result[0]);
    }

    async companyAggregate(id?: string): Promise<ICompany[]> {
        const $match: any = id ? {_id:new ObjectId(id)} : {};
        return await Company.aggregate([
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
                    "phone": 1,
                    "address": 1,
                    "cp": 1,
                    "type": 1,
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

    async createCompany(req: IRequest, res: Response) {
        const newCredential: ICredentialModel = new Credential(req.body);
        newCredential.rol = 'COMPANY';
        await newCredential.save();
        const newCompany: ICompany = new Company(req.body);
        newCompany.idCredential = newCredential.id;
        await newCompany.save();
        newCredential.idUser = newCompany.id;
        await newCredential.save();

        const auxCompanyRoutes:CompanyRoutes = new CompanyRoutes();
        const result: ICompany[] = await auxCompanyRoutes.companyAggregate(newCompany.id);

        res.json(result[0]);
    }

    async updateCompany(req: IRequest, res: Response) {
        
        if (req.body._id) {
            delete req.body._id;
        }

        const idCompania: string|undefined = req.iam;
        let company: ICompany | null = null;
        let credential: ICredentialModel | null = null;
        let idCompany: string = '';
        req.body.rol = 'COMPANY';
        if (!req.params.id && idCompania) {
            idCompany = idCompania;
            company = await Company.findByIdAndUpdate(idCompania, {$set:req.body}, {new: true});
            if (company) {
                credential = await Credential.findByIdAndUpdate(company.idCredential, {$set:req.body}, {new: true});
            }
        }
        else if (req.params.id) {
            idCompany = req.params.id;
            company = await Company.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true}); 
            if (company) {
                credential = await Credential.findByIdAndUpdate(company.idCredential, {$set:req.body}, {new: true});
            }           
        }
        
        const auxUserRoutes:CompanyRoutes = new CompanyRoutes();
        const result: ICompany[] = await auxUserRoutes.companyAggregate(idCompany);

        res.json(result[0]);     
    }

    async deleteCompany(req: IRequest, res: Response) {
        const company: ICompany | null = await Company.findById(req.params.id);
        if (company) {
            await UploadImageService.removeImage(company);
            await company.remove();
            return res.json({message: 'User successfully removed.'});
        }
        res.json({message: 'Company not found.'});
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
        this.router.route('/companies')
                        .get(middlewaresAuth.isAuth, middlewaresRol.isAdmin, this.getCompanies)
                        .post(middlewaresAuth.isAuth, middlewaresRol.isAdmin, this.createCompany);
        this.router.route('/companies/:id')
                        .get(middlewaresAuth.isAuth, middlewaresRol.isCompany, this.getCompany)
                        .put(middlewaresAuth.isAuth, middlewaresRol.isCompany, this.updateCompany)
                        .delete(middlewaresAuth.isAuth, middlewaresRol.isCompany, this.deleteCompany);
    }
}

const userRoutes = new CompanyRoutes();
userRoutes.routes();

export default userRoutes.router;