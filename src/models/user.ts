import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    firstLastName: { type: String, required: true, trim: true },
    secondLastName: { type: String, required: true, trim: true },
    birthdate: { type: Date, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    rol: { type: String, enum: ['ADMIN', 'USER', 'COMPANY'], default: 'USER' },
    imageUrl: {type: String, trim: true},
    password: { type: String, required: true },
}, 
{timestamps: true});

export default model('User', UserSchema);