export type UserFields = 'name' | 'email' | 'password';
export type UserInput = Partial<Record<UserFields, string>>;
export type UserInputResult = { data?: UserInput; error?: string };

const allowedFields: UserFields[] = ['name', 'email', 'password'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseUserInput(body: unknown, partial: boolean): UserInputResult {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body must be a JSON object' };
    }

    const fields = body as Record<string, unknown>;
    const unknownField = Object.keys(fields).find((field) => !allowedFields.includes(field as UserFields));
    if (unknownField) {
        return { error: `Unsupported field: ${unknownField}` };
    }

    const data: UserInput = {};
    for (const field of allowedFields) {
        const value = fields[field];
        if (value === undefined) {
            if (!partial) {
                return { error: `${field} is required` };
            }
            continue;
        }

        if (typeof value !== 'string') {
            return { error: `${field} must be a string` };
        }

        const normalized = field === 'password' ? value : value.trim();
        if (normalized.trim().length === 0) {
            return { error: `${field} cannot be empty` };
        }

        data[field] = normalized;
    }

    if (data.email && !emailPattern.test(data.email)) {
        return { error: 'email must be a valid email address' };
    }

    if (partial && Object.keys(data).length === 0) {
        return { error: 'Provide at least one field to update' };
    }

    return { data };
}
