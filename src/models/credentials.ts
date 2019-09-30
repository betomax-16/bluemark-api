import bcrypt from 'bcryptjs';
import { Schema, model, Document } from 'mongoose';
import { ObjectId } from 'bson';

export interface ICredential extends Document {
    idUser?: ObjectId;
    email?: string;
    password?: string;
    rol?: string;
}

export interface ICredentialModel extends ICredential {
  comparePassword(pass: string, callback: any): boolean;
} 

const CredentialSchema = new Schema({
    idUser: { type: Schema.Types.ObjectId },
    email: { type: String, required: true, lowercase: true, trim: true, ndex: true, unique: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ['ADMIN', 'USER', 'COMPANY'], default: 'USER' },
}, 
{timestamps: true});

CredentialSchema.pre('save', function (next){
  let user: ICredential = this;
  if (!user.password) return next();
  if (!user.isModified('password')) return next();

  user.password = bcrypt.hashSync(user.password, 10);
  next();
})

CredentialSchema.pre('findOneAndUpdate', function (next){
  let credential: ICredential = this.getUpdate().$set;
  if (!credential) return next();
  else if(!credential.password) {
    delete credential.password;
    return next();
  }
  else if(credential.password && credential.password.trim() == '') {
    delete credential.password;
    return next();
  }
  
  credential.password = bcrypt.hashSync(credential.password, 10);
  next();
});

CredentialSchema.methods.comparePassword = function (pass: string, callback: any) {
  const user: ICredential = this as ICredential;
  const password: string = user.password ? user.password : '';
  return callback(null, bcrypt.compareSync(pass, password));
}

export default model<ICredentialModel>('Credential', CredentialSchema);