import {API, assertId, Id, validateId} from '../rest';
import {parseSize} from '../util';
import {BaseSDK} from './base-sdk';

const SIX_MB_IN_BYTES = 6 * 1024 * 1024;

/**
 * Ignite class for interacting with Hop's Ignite product
 */
export class Ignite extends BaseSDK {
	/**
	 * Gets all deployments for a team
	 *
	 * @param teamId The team ID to list deployments for. You only need to provide this if you are using bearer or PAT authorization.
	 * @returns A list of deployments for the given team.
	 */
	async getAllDeployments(teamId?: Id<'team'>) {
		if (this.client.authType !== 'sk' && !teamId) {
			throw new Error('Team ID is required for Bearer or PAT authorization');
		}

		if (this.client.authType === 'sk' && teamId) {
			throw new Error('Team ID is not required for secret authorization');
		}

		const {deployments} = await this.client.get(
			'/v1/ignite/deployments',
			teamId ? {team: teamId} : {},
		);

		return deployments;
	}

	async updateContainerState(
		container: Id<'container'>,
		state:
			| API.Ignite.ContainerState.PENDING
			| API.Ignite.ContainerState.STOPPED,
	) {
		await this.client.patch(
			'/v1/ignite/containers/:container_id/state',
			{state},
			{container_id: container},
		);
	}

	/**
	 * Creates a new deployment.
	 * You should use this overload if you are authorizing with a bearer or pat.
	 *
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
	 *
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
			if (this.client.authType === 'sk') {
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

			if (this.client.authType === 'bearer' || this.client.authType === 'pat') {
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
			team ? {team} : {},
		);

		return deployment;
	}

	/**
	 * Get all containers for a deployment
	 *
	 * @param deployment The ID of the deployment to get
	 * @returns A list of all containers for that team
	 */
	async getContainers(deployment: Id<'deployment'>) {
		const {containers} = await this.client.get(
			'/v1/ignite/deployments/:deployment_id/containers',
			{deployment_id: deployment},
		);

		return containers;
	}

	/**
	 * Gets a deployment by name or id
	 *
	 * @param teamId The team ID to list containers for. You only need to provide this if you are using bearer or PAT authorization.
	 * @param nameOrId The deployment name or ID to list containers for.
	 */
	async getDeployment(
		teamId: Id<'team'>,
		nameOrId: string,
	): Promise<API.Ignite.Deployment>;

	/**
	 * Gets a deployment by name or id
	 *
	 * @param nameOrId The deployment name or ID to list containers for.
	 */
	async getDeployment(nameOrId: string): Promise<API.Ignite.Deployment>;

	async getDeployment(teamOrNameOrId: string, nameOrId?: string) {
		let team: Id<'team'> | undefined;
		let realNameOrId: string;

		if (teamOrNameOrId && nameOrId) {
			if (this.client.authType === 'sk') {
				throw new Error('Team ID is not required for secret authorization');
			}

			assertId(teamOrNameOrId, 'team');

			team = teamOrNameOrId;
			realNameOrId = nameOrId;
		} else if (teamOrNameOrId && !nameOrId) {
			if (this.client.authType !== 'sk') {
				throw new Error('Team ID is required for bearer or PAT authorization');
			}

			realNameOrId = teamOrNameOrId;
		} else {
			throw new Error('Team ID is required for bearer or PAT authorization');
		}

		if (validateId(realNameOrId, 'deployment')) {
			const {deployment} = await this.client.get(
				'/v1/ignite/deployments/:deployment_id',
				team
					? {team, deployment_id: realNameOrId}
					: {deployment_id: realNameOrId},
			);

			return deployment;
		}

		const {deployment} = await this.client.get(
			'/v1/ignite/deployments/search',
			{name: realNameOrId},
		);

		return deployment;
	}

	/**
	 * Deletes a deployment
	 *
	 * @param deployment The ID of the deployment
	 */
	async deleteDeployment(deployment: Id<'deployment'>) {
		await this.client.delete(
			'/v1/ignite/deployments/:deployment_id',
			undefined,
			{deployment_id: deployment},
		);
	}

	/**
	 * Creates a container
	 *
	 * @param deployment The ID of a deployment to create a container in.
	 * @returns The newly created container.
	 */
	async createContainer(deployment: Id<'deployment'>) {
		const {container} = await this.client.post(
			'/v1/ignite/deployments/:deployment_id/containers',
			undefined,
			{deployment_id: deployment},
		);

		return container;
	}

	/**
	 * Deletes a container
	 *
	 * @param container The ID of the container to delete.
	 */
	async deleteContainer(container: Id<'container'>) {
		await this.client.delete('/v1/ignite/containers/:container_id', undefined, {
			container_id: container,
		});
	}

	/**
	 * Get the logs for a container
	 *
	 * @param container The ID of the container
	 * @returns
	 */
	async getLogs(container: Id<'container'>) {
		const {logs} = await this.client.get(
			'/v1/ignite/containers/:container_id/logs',
			{container_id: container},
		);

		return logs;
	}
}
