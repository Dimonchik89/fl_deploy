export const BAD_REQUEST = 'Bad Request';
export const NOT_FOUND = 'Not Found';
export const UNAUTHORIZED_EXAMPLE = {
	message: 'Unauthorized',
	statusCode: 401,
};
export const INTERVAL_SERVER_ERROR = {
	statusCode: 500,
	message: 'Internal server error',
};

export const NO_SUCH_FILE_OR_DIRECTORY = {
	message: "ENOENT: no such file or directory, stat '/home/example/index.html'",
	error: 'Not Found',
	statusCode: 404,
};

export const BAD_REQUEST_EXAMPLE = {
	message: 'Error message',
	error: BAD_REQUEST,
	statusCode: 400,
};

export const FORBIDDEN_EXAMPLE = {
	message: 'Forbidden resource',
	error: 'Forbidden',
	statusCode: 403,
};
