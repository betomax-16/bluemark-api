import { Schema, model, Document } from 'mongoose';
import { ICompany } from './company';
import path from 'path';
import fs from 'fs';

export interface IPromotion extends Document {
    name?: string,
    namePromotion?: string;
    description?: string;
    idCompany?: ICompany['_id'];
    validity?: Date;
    couponIssuance?: number;
    imagePromotion?: string;
    company?: ICompany;
}

const PromotionSchema = new Schema({
    namePromotion: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    validity: { type: Date, required: true },
    couponIssuance: { type: Number, required: true },
    imagePromotion: { type: String, trim: true },
    idCompany: { type: Schema.Types.ObjectId, required: true, ref: 'Company' }
}, 
{timestamps: true});

PromotionSchema.pre('remove', async function (next){
    const promo: IPromotion = this;
    if (promo && promo.imagePromotion) {
        const name = promo.imagePromotion.split('/').pop();
        if (name) {
            const local: string = __dirname.replace('\\models', '\\').replace('/models', '/');
            const file: string = path.join(local, 'public/promotion', name);
            const exist: boolean = await fs.existsSync(file);
            if (exist) {
                await fs.unlinkSync(file);
            }
        }
    }
    // remover cupones
    next();
})

export default model<IPromotion>('Promotion', PromotionSchema);