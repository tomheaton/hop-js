import {API, getIdPrefix, Id, validateId} from '../rest';
import {
	APIAuthorization,
	APIAuthorizationType,
	APIClient,
} from '../rest/client';
import {parseSize} from '../util';
import {DEFAULT_BASE_URL} from '../util/constants';

const SIX_MB_IN_BYTES = 6 * 1024 * 1024;

export class Ignite {
	private readonly client: APIClient;
	private readonly authType: APIAuthorizationType;

	constructor(authorization: APIAuthorization, baseUrl = DEFAULT_BASE_URL) {
		this.authType = getIdPrefix(authorization);
		this.client = new APIClient({baseUrl, authorization});
	}

	/**
	 * Gets all deployments for a team
	 * @param teamId The team ID to list deployments for. You only need to provide this if you are using bearer or PAT authorization.
	 * @returns A list of deployments for the given team.
	 */
	async getDeployments(teamId?: Id<'team'>) {
		if (this.authType === 'bearer' && !teamId) {
			throw new Error('Team ID is required for Bearer or PAT authorization');
		}

		if (teamId && this.authType === 'sk') {
			throw new Error('Team ID is not required for secret authorization');
		}

		const query = teamId ? {team: teamId} : undefined;

		const {deployments} = await this.client.get(
			'/v1/ignite/deployments',
			query,
		);

		return deployments;
	}

	/**
	 * Creates a new deployment.
	 * You should use this overload if you are authorizing with a bearer or pat.
	 * @param configOrTeam The team ID to create the deployment in.
	 * @param bearerOrPatConfig The deployment config to create.
	 */
	async createDeployment(
		configOrTeam: Id<'team'>,
		bearerOrPatConfig: API.Ignite.DeploymentConfig,
	): Promise<API.Ignite.Deployment>;

	/**
	 * Create a new deployment. You should use this overload if you are authorizing with a secret key and
	 * not with a bearer or pat.
	 * @param configOrTeam The config for this deployment.
	 */
	async createDeployment(
		configOrTeam: API.Ignite.DeploymentConfig,
	): Promise<API.Ignite.Deployment>;

	async createDeployment(
		configOrTeam: Id<'team'> | API.Ignite.DeploymentConfig,
		bearerOrPatConfig?: API.Ignite.DeploymentConfig,
	) {
		let config: API.Ignite.DeploymentConfig;
		let team: Id<'team'> | null = null;

		if (typeof configOrTeam === 'object') {
			if (this.authType === 'sk') {
				config = configOrTeam;
			} else {
				throw new Error(
					'First argument must be the team ID when using bearer authorization to create deployments.',
				);
			}
		} else {
			if (!bearerOrPatConfig) {
				throw new Error(
					'Second argument must be the deployment config when using bearer authorization to create deployments.',
				);
			}

			if (this.authType === 'bearer' || this.authType === 'pat') {
				team = configOrTeam;
				config = bearerOrPatConfig;
			} else {
				throw new Error(
					'Only argument must be the config when using secret authorization to create deployments.',
				);
			}
		}

		// Hop's runtime requires a minimum of 6mb of memory per container
		// It's useful to validate this at the SDK level as well as API level.
		if (parseSize(config.resources.ram) <= SIX_MB_IN_BYTES) {
			throw new Error(
				'Allocated memory must be greater than 6MB when creating a deployment.',
			);
		}

		const {deployment} = await this.client.post(
			'/v1/ignite/deployments',
			config,
			team ? {team} : undefined,
		);

		return deployment;
	}
}
