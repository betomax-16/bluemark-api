import bcrypt from 'bcryptjs';
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    name?: string;
    firstLastName?: string;
    secondLastName?: string;
    birthdate?: Date;
    email?: string;
    rol?: string;
    sex?: string;
    imageUrl?: string;
    password?: string;
}

export interface IUserModel extends IUser {
  comparePassword(pass: string, callback: any): boolean;
} 

const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    firstLastName: { type: String, required: true, trim: true },
    secondLastName: { type: String, required: true, trim: true },
    birthdate: { type: Date, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    sex: { type: String },
    rol: { type: String, enum: ['ADMIN', 'USER', 'COMPANY'], default: 'USER' },
    imageUrl: {type: String, trim: true},
    password: { type: String, required: true },
}, 
{timestamps: true});

UserSchema.pre('save', function (next){
  let user: IUser = this;
  if (!user.password) return next();
  if (!user.isModified('password')) return next();

  user.password = bcrypt.hashSync(user.password, 10);
  next();
})

UserSchema.pre('findOneAndUpdate', function (next){
  let user: IUser = this.getUpdate().$set;
  if (!user) return next();
  else if(!user.password) {
    delete user.password;
    return next();
  }
  else if(user.password && user.password.trim() == '') {
    delete user.password;
    return next();
  }
  
  user.password = bcrypt.hashSync(user.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (pass: string, callback: any) {
  const user: IUser = this as IUser;
  const password: string = user.password ? user.password : '';
  return callback(null, bcrypt.compareSync(pass, password));
}

export default model<IUserModel>('User', UserSchema);