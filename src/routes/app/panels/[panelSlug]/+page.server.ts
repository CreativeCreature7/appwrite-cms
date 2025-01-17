import { AppwriteService } from '$lib/appwrite';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { PageUtils } from '$lib/utils';

export const actions: Actions = {
	deleteDocument: async ({ locals, request }) => {
		PageUtils.parseAuth(locals.session.data);

		const data = await request.formData();

		const databaseId = data.get('databaseId');
		const collectionId = data.get('collectionId');
		const documentId = data.get('documentId');

		if (!databaseId || !collectionId || !documentId) {
			throw error(400, { message: 'Invalid payload.' });
		}

		try {
			await AppwriteService.deleteDocument(
				databaseId.toString(),
				collectionId.toString(),
				documentId.toString()
			);

			return { success: true };
		} catch (err: any) {
			throw error(500, { message: 'Could not delete document: ' + err.message });
		}
	}
};

export const load: PageServerLoad = async ({ locals, params, url }) => {
	PageUtils.parseAuth(locals.session.data);

	const { panel, group } = PageUtils.parseParams(params);

	if (panel.singletonId) {
		throw redirect(307, `/app/panels/${panel.slug}/view/${panel.singletonId}`);
	}

	try {
		const limit = +(url.searchParams.get('limit') ?? '10');
		const page = +(url.searchParams.get('page') ?? '1');
		const label = url.searchParams.get('label') ?? '';

		const labelObj = panel.labels.find((l) => l.slug === label);

		const documents = await AppwriteService.listDocuments<any>(
			panel.databaseId,
			panel.collectionId,
			limit,
			(page - 1) * limit,
			labelObj ? labelObj.queries : []
		);

		return {
			panelDocuments: documents,
			panelLabel: label,
			panelLimit: limit,
			panelPage: page,

			panelSlug: params.panelSlug,
			group,
			panel
		};
	} catch (err: any) {
		throw error(500, { message: 'Could not load documents: ' + err.message });
	}
};
