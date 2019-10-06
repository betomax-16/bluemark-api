import { Response, Router } from "express";
import { IRequest } from '../interfaces/IRequest';
import Credential, { ICredential, ICredentialModel } from '../models/credentials';
import Promotion, { IPromotion } from '../models/promotion';
import middlewaresAuth from '../middlewares/auth';
import middlewaresRol from '../middlewares/rol';
import { ObjectId } from "bson";

class PromotionRoutes {
    public router: Router;

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
                    "name":1,
                    "namePromotion": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                    "description": 1,
                    "validity": 1,
                    "couponIssuance": 1,
                }
            }
        ]);
    }

    async createPromotion(req: IRequest, res: Response) {
        const idCompany: string|undefined = req.iam;
        const newPromotion: IPromotion = new Promotion(req.body);
        let promotion: IPromotion|null;

        if (req.rol == 'COMPANY') {
            promotion = await Promotion.findOne({idCompany: new ObjectId(idCompany), namePromotion: newPromotion.namePromotion});
            if (!promotion) {
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
        
        if (req.body._id) {
            delete req.body._id;
        }

        let promotion: IPromotion|null = null;
        let result: IPromotion[]|undefined = undefined;
        if (req.params.id) {
            const currentUser: ICredentialModel|null = await Credential.findById(req.iam);
            if (currentUser) {
               if (currentUser.rol == 'COMAPANY') {
                    if (req.body.namePromotion) {
                        const promotionExist: IPromotion|null = await Promotion.findOne({_id: new ObjectId(req.params.id), idCompany: new ObjectId(req.iam), namePromotion: req.body.namePromotion});
                        if (!promotionExist) {
                            promotion = await Promotion.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});   
                        }
                        else {
                            return res.json({message: 'Promotion exist'});
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
                            promotion = await Promotion.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});   
                        }
                        else {
                            return res.json({message: 'Promotion exist'});
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
        const currentUser: ICredentialModel|null = await Credential.findById(req.iam);
        if (currentUser && currentUser.rol == 'COMPANY') {
            // Eliminar cupones
            const resp = await Promotion.remove({_id: req.params.id, idCompany: new ObjectId(req.iam)});
            if (resp.deletedCount && resp.deletedCount > 0) {
                return res.json({message: 'Promotion successfully removed.'});
            }
            else {
                res.json({message: 'Error removed.'});
            }
        }
        else if (currentUser && currentUser.rol == 'ADMIN') {
            // Eliminar cupones
            const resp = await Promotion.remove({_id: req.params.id});
            if (resp.deletedCount && resp.deletedCount > 0) {
                return res.json({message: 'Promotion successfully removed.'});
            }
            else {
                res.json({message: 'Error removed.'});
            }
        }
        else {
            res.json({message: 'You are not autorized.'});
        }
    }

    routes() {
        this.router.route('/companies/:idCompany/promotions')
                        .get(middlewaresAuth.isAuth, middlewaresRol.isCompany, this.getPromotions)
        // para busqueda de promociones
        // para obtener promociones propias de una compañia
        this.router.route('/promotions')
                        .get(middlewaresAuth.getData, this.getPromotions)
                        .post(middlewaresAuth.isAuth, middlewaresRol.isCompany, this.createPromotion);
        this.router.route('/promotions/:id')
                        .get(this.getPromotion)
                        .put(middlewaresAuth.isAuth, middlewaresRol.isCompany, this.updatePromotion)
                        .delete(middlewaresAuth.isAuth, middlewaresRol.isCompany, this.deletePromotion);
    }
}

const promotionRoutes = new PromotionRoutes();
promotionRoutes.routes();

export default promotionRoutes.router;