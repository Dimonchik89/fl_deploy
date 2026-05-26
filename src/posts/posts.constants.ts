import { BAD_REQUEST } from '../app.constants';

const REQUIRE_FIELDS = 'Required fields';

export const CONTENT_HTML_EXAMPLE =
	'<article><div><h2 style="color: red">Strawberry title</h2><img style="width: 640px" src="https://hips.hearstapps.com/clv.h-cdn.co/assets/15/22/1432664914-strawberry-facts1.jpg?crop=1xw:0.8332147937411095xh;center,center" alt="strawberry" /><p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quisquam omnis rerum cumque deserunt natus nam impedit consequuntur non id illo, dicta et, tenetur aliquam porro amet recusandae, sit odit vero!</p><hr /><h2>Subtitle</h2><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Animi, a repellat. Corporis fugiat voluptatem quasi dolores optio dicta blanditiis modi inventore necessitatibus corrupti, ullam consequuntur nam atque sapiente quidem incidunt.</p></div></article>';

export const POST_EXAMPLE = {
	id: '0673b8af-5e55-4ad7-a246-6120ac62c2cf',
	contentHtml: CONTENT_HTML_EXAMPLE,
	createdAt: '2026-01-05T09:29:41.141Z',
	updatedAt: '2026-01-05T09:29:41.141Z',
};

export const CREATE_FILE_ERROR_REQUIRE_FIELDS_EXAMPLE = {
	message: ['contentHtml must be a string'],
	error: 'Bad Request',
	statusCode: 400,
};

export const GET_POSTS_SUCCESS_EXAMPLE = {
	count: 1,
	rows: [POST_EXAMPLE],
};

export const DELETE_FILE_EXAMPLE = {
	statusCode: 200,
	message: 'the post ff6a1126-5397-41e0-8f36-bec68f3b8a9a was deleted',
};
