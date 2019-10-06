import { Schema, model, Document } from 'mongoose';
import { ICompany } from './company';

export interface IPromotion extends Document {
    name?: string,
    namePromotion?: string;
    description?: string;
    idCompany?: ICompany['_id'];
    validity?: Date;
    couponIssuance?: number;
}

const PromotionSchema = new Schema({
    namePromotion: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    validity: { type: Date, required: true },
    couponIssuance: { type: Number, required: true },
    idCompany: { type: Schema.Types.ObjectId, required: true, ref: 'Company' }
}, 
{timestamps: true});

PromotionSchema.pre('remove', function (next){
    let promo: IPromotion = this;
    // remover cupones
    next();
})

export default model<IPromotion>('Promotion', PromotionSchema);