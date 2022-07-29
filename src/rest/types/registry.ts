import {Endpoint} from '../endpoints';
import {Empty} from './types';

export type RegistryEndpoints =
	| Endpoint<'DELETE', '/v1/registry/images/:image', Empty>
	| Endpoint<'GET', '/v1/registry/@this/images', {images: string[]}>
	| Endpoint<'GET', '/v1/registry/:project_id/images', {images: string[]}>
	| Endpoint<
			'GET',
			'/v1/registry/images/:image/manifests',
			{
				manifests: {
					digest: {
						digest: string;
						size: number;
						uploaded: string;
					};
					tag: string | null;
				}[];
			}
	  >;
