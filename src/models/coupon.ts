import bcrypt from 'bcryptjs';
import { Schema, model, Document } from 'mongoose';
import Credential, { ICredential, ICredentialModel } from './credentials';
import Promotion, { IPromotion } from './promotion';
import { IUser } from './user';
import { ICompany } from './company';

export interface ICoupon extends Document {
    status?: string;
    redemptionDate?: Date;
    idPromotion?: IPromotion['_id'];
    promotion?: IPromotion;
    idUser?: IUser['_id'];
}

const CouponSchema = new Schema({
    status: { type: String, required: true, trim: true },
    redemptoinDate: { type: Date },
    idPromotion: { type: Schema.Types.ObjectId, required: true, ref: 'Promotion' },
    idUser: { type: Schema.Types.ObjectId, required: true, ref: 'User'}
}, 
{timestamps: true});

export default model<ICoupon>('Coupon', CouponSchema);