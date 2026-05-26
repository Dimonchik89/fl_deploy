export const USER_NOT_FOUND = 'User not found';

export const GET_USERS_SUCCESS_EXAMPLE = {
	count: 3,
	rows: [
		{
			id: 'e5f0f45f-7d23-4c2f-9ff8-a86d9369fdad',
			email: 'user2@gmail.com',
			subscription: 'free',
			maxFolderSize: 50,
			createdAt: '2026-01-05T10:46:01.740Z',
		},
		{
			id: 'c36825e1-1c05-4274-91b1-37489d268709',
			email: 'user@gmail.com',
			subscription: 'free',
			maxFolderSize: 50,
			createdAt: '2026-01-05T10:45:57.113Z',
		},
	],
};

export const GET_ONE_USER_EXAMPLE = {
	id: 'e5f0f45f-7d23-4c2f-9ff8-a86d9369fdad',
	email: 'user2@gmail.com',
	subscription: 'free',
	maxFolderSize: 50,
	createdAt: '2026-01-05T10:46:01.740Z',
};

export const USER_NOT_FOUND_EXAMPLE = {
	message: 'User not found',
	error: 'Not Found',
	statusCode: 404,
};
