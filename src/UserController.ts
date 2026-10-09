import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from './User';
import { parseUserInput } from './UserValidation';

function handleDatabaseError(res: Response, error: unknown, action: string): Response {
    if ((error as { code?: number })?.code === 11000) {
        return res.status(409).json({ message: 'A user with this email already exists' });
    }

    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({ message: error.message });
    }

    console.error(`Error ${action}:`, error);
    return res.status(500).json({ message: `Unable to ${action}` });
}

function isValidId(res: Response, id: string | string[] | undefined): id is string {
    if (typeof id === 'string' && mongoose.isValidObjectId(id)) {
        return true;
    }

    res.status(400).json({ message: 'Invalid user id' });
    return false;
}

export async function createUser(req: Request, res: Response): Promise<Response> {
    const parsed = parseUserInput(req.body, false);
    if (parsed.error || !parsed.data) {
        return res.status(400).json({ message: parsed.error });
    }

    try {
        const user = new User({
            name: parsed.data.name,
            email: parsed.data.email,
            password: parsed.data.password,
        });
        await user.save();
        return res.status(201).json(user);
    } catch (error) {
        return handleDatabaseError(res, error, 'create user');
    }
}

export async function getUsers(_req: Request, res: Response): Promise<Response> {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        return res.status(200).json(users);
    } catch (error) {
        return handleDatabaseError(res, error, 'retrieve users');
    }
}

export async function getUserById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (!isValidId(res, id)) {
        return res;
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(user);
    } catch (error) {
        return handleDatabaseError(res, error, 'retrieve user');
    }
}

export async function updateUser(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (!isValidId(res, id)) {
        return res;
    }

    const parsed = parseUserInput(req.body, true);
    if (parsed.error || !parsed.data) {
        return res.status(400).json({ message: parsed.error });
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (parsed.data.name !== undefined) user.name = parsed.data.name;
        if (parsed.data.email !== undefined) user.email = parsed.data.email;
        if (parsed.data.password !== undefined) user.password = parsed.data.password;

        await user.save();
        return res.status(200).json(user);
    } catch (error) {
        return handleDatabaseError(res, error, 'update user');
    }
}

export async function deleteUser(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (!isValidId(res, id)) {
        return res;
    }

    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'User deleted' });
    } catch (error) {
        return handleDatabaseError(res, error, 'delete user');
    }
}
