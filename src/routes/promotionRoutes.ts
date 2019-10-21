import { Response, Router } from "express";
import { IRequest } from '../interfaces/IRequest';
import Credential, { ICredential, ICredentialModel } from '../models/credentials';
import Promotion, { IPromotion } from '../models/promotion';
import middlewaresAuth from '../middlewares/auth';
import middlewaresRol from '../middlewares/rol';
import { ObjectId } from "bson";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Types } from "mongoose";

class PromotionRoutes {
    public router: Router;
    private storage: multer.StorageEngine = multer.diskStorage({
        destination: path.join(__dirname.replace('\\routes', '\\').replace('/routes', '/'), 'public/promotion'),
        filename: (req, file, cb) => {
            const name = file.originalname.split('.')[0];
            const ext = file.originalname.split('.').pop();
            cb(null, name + '.' + ext );
        }
    });

    constructor() {
        this.router = Router();
        this.routes();
    }
 
    async getPromotions(req: IRequest, res: Response) {
        if (req.params.idCompany) {
            const auxPromotionRoutes:PromotionRoutes = new PromotionRoutes();
            const result: IPromotion[] = await auxPromotionRoutes.promotionAggregate(req.params.idCompany, true);
            res.json(result);
        }
        else {
            if (req.rol == 'COMPANY') {
                const auxPromotionRoutes:PromotionRoutes = new PromotionRoutes();
                const result: IPromotion[] = await auxPromotionRoutes.promotionAggregate(req.iam, true);
                res.json(result);
            }
            else {
                // agregar filtros
                const auxPromotionRoutes:PromotionRoutes = new PromotionRoutes();
                const result: IPromotion[] = await auxPromotionRoutes.promotionAggregate();
                res.json(result);
            }
        }
    }

    async getPromotion(req: IRequest, res: Response) {
        const auxPromotionRoutes:PromotionRoutes = new PromotionRoutes();
        const result: IPromotion[] = await auxPromotionRoutes.promotionAggregate(req.params.id);
        res.json(result[0]);
    }

    async promotionAggregate(id?: string, isIdCompany: boolean = false): Promise<IPromotion[]> {
        let $match: any;
        if (!isIdCompany) {
            $match = id ? {_id:new ObjectId(id)} : {};
        }
        else {
            $match = id ? {idCompany:new ObjectId(id)} : {};
        }

        return await Promotion.aggregate([
            {$match},
            {$lookup:
                {
                    from: "companies",
                    localField: "idCompany",
                    foreignField: "_id",
                    as: "Company"
                }
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$Company", 0 ] }, "$$ROOT" ] } }
            },
            {
                $project: {
                    "_id": 1,
                    "idCompany":1,
                    "name":1,
                    "namePromotion": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                    "description": 1,
                    "validity": 1,
                    "couponIssuance": 1,
                    "imagePromotion":1,
                }
            }
        ]);
    }

    async createPromotion(req: IRequest, res: Response) {
        const idCompany: string|undefined = req.iam;
        delete req.body._id;
        let newPromotion: IPromotion = new Promotion(req.body);
        let promotion: IPromotion|null;
        //const host = req.protocol + "://" + req.get('host') + '/static/promotion/' + req.file.filename;

        if (req.rol == 'COMPANY') {
            promotion = await Promotion.findOne({idCompany: new ObjectId(idCompany), namePromotion: newPromotion.namePromotion});
            if (!promotion && idCompany) {
                if (req.file) {
                    const host = req.protocol + "://" + req.get('host') + '/static/promotion/' + req.file.filename;
                    newPromotion.imagePromotion = host;
                }
                newPromotion.idCompany = new ObjectId(idCompany);
                await newPromotion.save();
                const auxPromotionRoutes:PromotionRoutes = new PromotionRoutes();
                const result: IPromotion[] = await auxPromotionRoutes.promotionAggregate(newPromotion.id);
                res.json(result[0]);
            }
            else {
                res.json({message: 'Promotion exist'});
            }
        }
        else {
            if (req.body.idCompany) {
                const credential: ICredentialModel|null = await Credential.findById(newPromotion.idCompany);
                if (credential && credential.rol == 'COMPANY') {
                    promotion = await Promotion.findOne({idCompany: new ObjectId(newPromotion.idCompany), namePromotion: newPromotion.namePromotion});
                    if (!promotion) {
                        if (req.file) {
                            const host = req.protocol + "://" + req.get('host') + '/static/promotion/' + req.file.filename;
                            newPromotion.imagePromotion = host;
                        }
                        await newPromotion.save();
                        const auxPromotionRoutes:PromotionRoutes = new PromotionRoutes();
                        const result: IPromotion[] = await auxPromotionRoutes.promotionAggregate(newPromotion.id);
                        res.json(result[0]);
                    }
                    else {
                        res.json({message: 'Promotion exist'});
                    }
                }
                else {
                    res.json({message: 'The company does not exist.'});
                }
            }
            else {
                res.json({message: 'idCompany required.'});
            }
        }
    }

    async updatePromotion(req: IRequest, res: Response) {
        //const host = req.protocol + "://" + req.get('host') + '/static/promotion/' + req.file.filename;
        if (req.body._id) {
            const promAux: IPromotion|null = await Promotion.findById(req.body._id);
            if (promAux && promAux.imagePromotion && req.file) {
                const filenamePromo: string | undefined = promAux.imagePromotion.split('/').pop();
                if (filenamePromo && req.file.filename != filenamePromo) {
                    const aux: PromotionRoutes = new PromotionRoutes();
                    aux.removeImage(promAux);
                }
            }
            delete req.body._id;
        }
        
        let promotion: IPromotion|null = null;
        let result: IPromotion[]|undefined = undefined;
        if (req.params.id) {
            const currentUser: ICredentialModel|null = await Credential.findOne({idUser:req.iam});
            if (currentUser) {
               if (currentUser.rol == 'COMPANY') {
                    if (req.body.namePromotion) {
                        const promotionExist: IPromotion|null = await Promotion.findOne({_id: new ObjectId(req.params.id), idCompany: new ObjectId(req.iam), namePromotion: req.body.namePromotion});
                        if (!promotionExist) {
                            //req.body.imagePromotion = host;
                            if (req.file) {
                                const host = req.protocol + "://" + req.get('host') + '/static/promotion/' + req.file.filename;
                                req.body.imagePromotion = host;
                            }
                            
                            promotion = await Promotion.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});   
                        }
                        else {
                            if (promotionExist.namePromotion == req.body.namePromotion) {
                                if (req.file) {
                                    const host = req.protocol + "://" + req.get('host') + '/static/promotion/' + req.file.filename;
                                    req.body.imagePromotion = host;
                                }
                                promotion = await Promotion.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});   
                            }
                            else {
                                return res.json({message: 'Promotion exist'});
                            }
                        }
                    }
                    else {
                        promotion = await Promotion.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});   
                    } 
               } 
               else if (currentUser.rol == 'ADMIN') {
                    if (req.body.namePromotion) {
                        const promotionExist: IPromotion|null = await Promotion.findOne({_id: new ObjectId(req.params.id), namePromotion: req.body.namePromotion});
                        if (!promotionExist) {
                            //req.body.imagePromotion = host;
                            if (req.file) {
                                const host = req.protocol + "://" + req.get('host') + '/static/promotion/' + req.file.filename;
                                req.body.imagePromotion = host;
                            }
                            promotion = await Promotion.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});   
                        }
                        else {
                            if (promotionExist.namePromotion == req.body.namePromotion) {
                                if (req.file) {
                                    const host = req.protocol + "://" + req.get('host') + '/static/promotion/' + req.file.filename;
                                    req.body.imagePromotion = host;
                                }
                                promotion = await Promotion.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});   
                            }
                            else {
                                return res.json({message: 'Promotion exist'});
                            }
                        }
                    }
                    else {
                        promotion = await Promotion.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});   
                    } 
               }
            }
        }
        
        if (promotion) {
            const auxPromotionRoutes:PromotionRoutes = new PromotionRoutes();
            result = await auxPromotionRoutes.promotionAggregate(promotion.id);
            res.json(result[0]); 
        }
        else {
            res.json({message:'Error al actualizar.'}); 
        }
    }

    async deletePromotion(req: IRequest, res: Response) {
        const aux: PromotionRoutes = new PromotionRoutes();
        const currentUser: ICredentialModel|null = await Credential.findOne({idUser:req.iam});
        
        if (currentUser && currentUser.rol == 'COMPANY') {
            const promo: IPromotion|null = await Promotion.findOne({_id: new ObjectId(req.params.id), idCompany: new ObjectId(req.iam)});
            if (promo) {
                await aux.removeImage(promo);
                await promo.remove();
                return res.json({message: 'Promotion successfully removed.'});
            }
            
            return res.json({message: 'Promotion not found'});
        }
        else if (currentUser && currentUser.rol == 'ADMIN') {
            const promo: IPromotion|null = await Promotion.findById(req.params.id);
            if (promo) {
                await aux.removeImage(promo);
                await promo.remove();
                return res.json({message: 'Promotion successfully removed.'});
            }

            return res.json({message: 'Promotion not found'});
        }
        else {
            res.json({message: 'You are not autorized.'});
        }
    }

    async removeImage(promo: any) {
        if (promo && promo.imagePromotion) {
            const name = promo.imagePromotion.split('/').pop();
            if (name) {
                const local: string = __dirname.replace('\\routes', '\\').replace('/routes', '/');
                const file: string = path.join(local, 'public/promotion', name);
                const exist: boolean = await fs.existsSync(file);
                if (exist) {
                    await fs.unlinkSync(file);
                }
            }
        }
    }

    async search(req: IRequest, res: Response) {
        const textSearch: string = req.query.text;
        let $match: any;
        if (textSearch) {
            $match = { $or: [  
                {namePromotion: { '$regex': textSearch, '$options' : 'i'}}, 
                {name: { '$regex': textSearch, '$options' : 'i'}}, 
                {type: { '$regex': textSearch, '$options' : 'i'} } 
            ] };
        }
        else {
            $match = {};
        }
        const result = await Promotion.aggregate([
            {$match:{validity: { $gt: new Date() }}},
            {$lookup:
                {
                    from: "companies",
                    localField: "idCompany",
                    foreignField: "_id",
                    as: "Company"
                }
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$Company", 0 ] }, "$$ROOT" ] } }
            },
            {
                $project: {
                    "_id": 1,
                    "idCompany":1,
                    "name":1,
                    "type":1,
                    "namePromotion": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                    "description": 1,
                    "validity": 1,
                    "couponIssuance": 1,
                    "imagePromotion":1,
                }
            },
            {$match},
        ]);
        return res.json(result);
    }

    routes() {
        this.router.route('/search')
                        .get(this.search);
        this.router.route('/companies/:idCompany/promotions')
                        .get(middlewaresAuth.isAuth, middlewaresRol.isCompany, this.getPromotions)
        // para busqueda de promociones
        // para obtener promociones propias de una compañia
        this.router.route('/promotions')
                        .get(middlewaresAuth.getData, this.getPromotions)
                        .post(middlewaresAuth.isAuth, middlewaresRol.isCompany, multer({storage: this.storage}).single('photo'), this.createPromotion);
        this.router.route('/promotions/:id')
                        .get(this.getPromotion)
                        .put(middlewaresAuth.isAuth, middlewaresRol.isCompany, multer({storage: this.storage}).single('photo'), this.updatePromotion)
                        .delete(middlewaresAuth.isAuth, middlewaresRol.isCompany, this.deletePromotion);
    }
}

const promotionRoutes = new PromotionRoutes();
promotionRoutes.routes();

export default promotionRoutes.router;