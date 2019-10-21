import { Response, Router } from "express";
import { IRequest } from '../interfaces/IRequest';
import middlewaresAuth from '../middlewares/auth';
import { ObjectId } from "bson";
import Coupon, { ICoupon } from "../models/coupon";
import middlewareRol from "../middlewares/rol";
import Promotion, { IPromotion } from "../models/promotion";

class CouponRoutes {

    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    async getCouponsByUser(req: IRequest, res: Response) {
        const auxCouponRoutes:CouponRoutes = new CouponRoutes();
        const match: any = {idUser:new ObjectId(req.iam)};
        const result: ICoupon[] = await auxCouponRoutes.couponAggregate(match);
        res.json(result);
    }

    async getCoupon(req: IRequest, res: Response) {
        const auxCouponRoutes:CouponRoutes = new CouponRoutes();
        const match: any = {_id:new ObjectId(req.params.id)};
        const result: ICoupon[] = await auxCouponRoutes.couponAggregate(match);
        res.json(result[0]);
    }

    async createCoupon(req: IRequest, res: Response) {
        const auxUCouponRoutes:CouponRoutes = new CouponRoutes();
        const idPromotion: string = req.params.id;
        const matchCoupons: any = {idPromotion:new ObjectId(idPromotion)};
        const coupons: ICoupon[] = await auxUCouponRoutes.couponAggregate(matchCoupons);
        const promotion: IPromotion|null = await Promotion.findById(idPromotion);
        const existCoupon: ICoupon|null = await Coupon.findOne({idUser: new ObjectId(req.iam), idPromotion: new ObjectId(idPromotion)});
        if (!existCoupon) {
            if (promotion && promotion.couponIssuance && coupons.length < promotion.couponIssuance) {
                const newCoupon: ICoupon = new Coupon({
                    status: 'NEW',
                    idPromotion: idPromotion,
                    idUser: req.iam
                });
                await newCoupon.save();
    
                const match: any = {_id:new ObjectId(newCoupon._id)};
                const result: ICoupon[] = await auxUCouponRoutes.couponAggregate(match);
                res.json(result[0]);
            }
            else {
                res.send({message:'Limite de cupones alcanzado'});
            }
        }
        else
        {
            res.send({message:'Ya tienes un cupon.'});
        }
    }

    async deleteCoupon(req: IRequest, res: Response) {
        const coupon: ICoupon | null = await Coupon.findById(req.params.id);
        if (coupon) {
            await coupon.remove();
            return res.json({message: 'Coupon successfully removed.'});
        }
        res.json({message: 'Coupon not found.'});
    }

    async updateCoupon(req: IRequest, res: Response) {  
        let result: ICoupon[] | any = [{}];
        const coupon: ICoupon | null = await Coupon.findByIdAndUpdate(req.params.id, {$set:req.body}, {new: true});
        if (coupon) {
            const auxUCouponRoutes:CouponRoutes = new CouponRoutes();
            const match: any = {_id:new ObjectId(coupon._id)};
            result = await auxUCouponRoutes.couponAggregate(match); 
        }
        res.json(result[0]);
    }

    async couponAggregate($match?: any): Promise<ICoupon[]> {
        return await Coupon.aggregate([
            {$match},
            {$lookup:
                {
                    from: "promotions",
                    localField: "idPromotion",
                    foreignField: "_id",
                    as: "promotion"
                }
            },
            {$unwind:"$promotion"},
            {$match: {"promotion.validity": { $gt: new Date() }}},
            {$lookup:
                {
                    from: "companies",
                    localField: "promotion.idCompany",
                    foreignField: "_id",
                    as: "promotion.company"
                }
            },
            {$unwind:"$promotion.company"}
        ]);
    }

    routes() {
        this.router.route('/coupons')
                        .get(middlewaresAuth.isAuth, this.getCouponsByUser);
        this.router.route('/coupons/:id')
                        .get(middlewaresAuth.isAuth, this.getCoupon)
                        .delete(middlewaresAuth.isAuth, this.deleteCoupon)
                        .put(middlewaresAuth.isAuth, middlewareRol.isCompany, this.updateCoupon);
        this.router.route('/promotions/:id/coupons')
                        .post(middlewaresAuth.isAuth, this.createCoupon);
    }
}

const couponRoutes = new CouponRoutes();
couponRoutes.routes();

export default couponRoutes.router;