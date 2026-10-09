import { randomBytes, scrypt } from 'node:crypto';
import mongoose, { Schema } from 'mongoose';

interface IUser {
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');

    return new Promise((resolve, reject) => {
        scrypt(password, salt, 64, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true, unique: true },
        password: { type: String, required: true, select: false },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform: (_document, result) => {
                Reflect.deleteProperty(result, 'password');
                return result;
            },
        },
    },
);

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    this.password = await hashPassword(this.password);
});

export default mongoose.model<IUser>('User', UserSchema);
