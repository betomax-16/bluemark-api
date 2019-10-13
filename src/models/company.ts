import bcrypt from 'bcryptjs';
import { Schema, model, Document } from 'mongoose';
import Credential, { ICredential, ICredentialModel } from './credentials';
import Promotion, { IPromotion } from './promotion';
import path from 'path';
import fs from 'fs';

export interface ICompany extends Document {
    name?: string;
    phone?: string;
    address?: string;
    cp?: string;
    type?: string;
    imageUrl?: string;
    idCredential?: ICredential['_id'];
    rol?: string;
    email?: string;
    password?:string;
}

const CompanySchema = new Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    cp: { type: String, required: true, trim: true  },
    type: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true },
    idCredential: { type: Schema.Types.ObjectId, required: true, ref: 'Credential' }
}, 
{timestamps: true});

CompanySchema.pre('remove', async function (next){
    const company: ICompany = this;
    if (company && company.imageUrl) {
        const name = company.imageUrl.split('/').pop();
        if (name) {
            const local: string = __dirname.replace('\\models', '\\').replace('/models', '/');
            const file: string = path.join(local, 'public/profile', name);
            const exist: boolean = await fs.existsSync(file);
            if (exist) {
                await fs.unlinkSync(file);
            }
        }
    }
    await Credential.remove({idUser: company._id});
    const promotions: IPromotion[] = await Promotion.find({idCompany: company._id});
    promotions.forEach(promotion => {
        promotion.remove();
    });
    next();
});

export default model<ICompany>('Company', CompanySchema);