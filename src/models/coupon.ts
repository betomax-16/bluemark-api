import bcrypt from 'bcryptjs';
import { Schema, model, Document } from 'mongoose';
import Credential, { ICredential, ICredentialModel } from './credentials';
import Promotion, { IPromotion } from './promotion';

export interface ICoupon extends Document {
    status?: string;
    dateIssue?: Date;
    redemptionDate?: Date;
    idPromotion?: IPromotion['_id'];
}

const CouponSchema = new Schema({
    status: { type: String, required: true, trim: true },
    dateIssue: { type: Date, required: true, trim: true },
    redemptoinDate: { type: Date },
    idPromotion: { type: Schema.Types.ObjectId, required: true, ref: 'Promotion' }
}, 
{timestamps: true});

export default model<ICoupon>('Coupon', CouponSchema);