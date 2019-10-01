import { Schema, model, Document } from 'mongoose';
import { ICredential } from './credentials';

export interface IAdmin extends Document {
    name?: string;
    imageUrl?: string;
    idCredential?: ICredential['_id'];
    rol?: string;
    email?: string;
    password?:string;
}

const AdminSchema = new Schema({
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true },
    idCredential: { type: Schema.Types.ObjectId, required: true, ref: 'Credential' }
}, 
{timestamps: true});

export default model<IAdmin>('Admin', AdminSchema);