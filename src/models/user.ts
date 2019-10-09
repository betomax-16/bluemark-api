import bcrypt from 'bcryptjs';
import { Schema, model, Document } from 'mongoose';
import Credential, { ICredential, ICredentialModel } from './credentials';

export interface IUser extends Document {
    name?: string;
    firstLastName?: string;
    secondLastName?: string;
    birthdate?: Date;
    sex?: string;
    imageUrl?: string;
    idCredential?: ICredential['_id'];
    rol?: string;
    email?: string;
    password?:string;
}

const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    firstLastName: { type: String, required: true, trim: true },
    secondLastName: { type: String, required: true, trim: true },
    birthdate: { type: Date, required: true },
    sex: { type: String },
    imageUrl: { type: String, trim: true },
    idCredential: { type: Schema.Types.ObjectId, required: true, ref: 'Credential' }
}, 
{timestamps: true});

UserSchema.pre('remove', async function (next){
    const user: IUser = this;
    await Credential.remove({idUser: user._id});
    next();
});

export default model<IUser>('User', UserSchema);