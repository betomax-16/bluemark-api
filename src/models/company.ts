import bcrypt from 'bcryptjs';
import { Schema, model, Document } from 'mongoose';
import Credential, { ICredential, ICredentialModel } from './credentials';

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

export default model<ICompany>('Company', CompanySchema);