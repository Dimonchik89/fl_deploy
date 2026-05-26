import { BAD_REQUEST } from '../app.constants';

export const ALREADY_REGISTERED_ERROR = 'This user is already registered';
export const USER_EMAIL_NOT_FOUND_ERROR = 'No user with this email found';
export const WRONG_PASSWORD_ERROR = 'Invalid password';
export const UNAUTHORIZED_ERROR = 'Unauthorized';
export const INVALID_TOKEN_ERROR = 'Invalid token';
export const PROPERTY_SHOULD_NOT_EXIST_ERROR = 'property should not exist';

export const jwtConstants = {
	secret: process.env.JWT_SECRET,
	expire: process.env.JWT_EXPIRE_IN,
};

// userAlreadyRegistered
export const USER_ALREADY_REGISTERED_EXAMPLE = {
	summary: ALREADY_REGISTERED_ERROR,
	value: {
		message: ALREADY_REGISTERED_ERROR,
		error: BAD_REQUEST,
		statusCode: 400,
	},
};

export const PROPERTY_SHOULD_NOT_EXIST_EXAMPLE = {
	summary: PROPERTY_SHOULD_NOT_EXIST_ERROR,
	value: {
		message: 'Property role should not exist',
		error: BAD_REQUEST,
		statusCode: 400,
	},
};

export const USER_NOT_FOUND_EXAMPLE = {
	summary: USER_EMAIL_NOT_FOUND_ERROR,
	value: {
		message: USER_EMAIL_NOT_FOUND_ERROR,
		error: 'Unauthorized',
		statusCode: 401,
	},
};

export const INVALID_PASSWORD_EXAMPLE = {
	summary: WRONG_PASSWORD_ERROR,
	value: {
		message: WRONG_PASSWORD_ERROR,
		error: 'Unauthorized',
		statusCode: 401,
	},
};

export const INVALID_TOKEN_EXAMPLE = {
	summary: INVALID_TOKEN_ERROR,
	value: {
		message: INVALID_TOKEN_ERROR,
		error: 'Unauthorized',
		statusCode: 401,
	},
};

// userAccessTokenResponse
export const USER_ACCESS_TOKEN_AND_REFRESH_TOKEN_EXAMPLE = {
	access_token:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
	refresh_token:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNkZmI4ZjA4LWQ1Y2EtNDc3Yy05M2I2LTE4N2U3OTZiOTI5NSIsImVtYWlsIjoidG90b3RvQGdtYWlsLmNvbSIsInN1YnNjcmlwdGlvbiI6ImZyZWUiLCJzdHJpcGVDdXN0b21lcklkIjpudWxsLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc0NTU1ODg1OSwiZXhwIjoxNzQ2MTYzNjU5fQ.vBfGp9eFCBpfDqY3TkiDA8Vc4MF2OvI9bDk_456d91Q',
};

export const USER_PROFILE_EXAMPLE = {
	id: '3dfb8f08-d5ca-472c-93b6-187e796b9225',
	email: 'test@gmail.com',
	subscription: 'free',
	stripeCustomerId: null,
	maxFolderSize: 104857600,
	currentTotalFolderSize: 54857600,
};
