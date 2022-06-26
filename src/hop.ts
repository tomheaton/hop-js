import {API, Id} from './rest';
import {APIAuthorization, APIClient} from './rest/client';
import {Ignite, Pipe, Projects} from './sdks';
import {Channels} from './sdks/channels';
import {Registry} from './sdks/registry';
import {User} from './sdks/user';
import {DEFAULT_BASE_URL} from './util/constants';

/**
 * Constructs a new instance of Hop and all of its SDKs.
 *
 * @example
 * ```ts
 * const hop = new Hop(bearerTokenOrPATOrProjectToken);
 * await hop.ignite.containers.create(deploymentId);
 * ```
 *
 * If you would like to use only a subclass, you can do so by importing and instantiating that class directly.
 *
 * For example
 * ```ts
 * import {Ignite} from '@onehop/js';
 * const ignite = new Ignite(bearerTokenOrPATOrProjectToken);
 * ```
 */
export class Hop {
	private readonly sdks;

	public readonly ignite;
	public readonly users;
	public readonly projects;
	public readonly pipe;
	public readonly registry;
	public readonly channels;

	public readonly authType;

	constructor(authorzation: APIAuthorization, baseUrl = DEFAULT_BASE_URL) {
		this.authType = APIClient.getAuthType(authorzation);

		this.sdks = {
			ignite: new Ignite(authorzation, baseUrl),
			user: new User(authorzation, baseUrl),
			pipe: new Pipe(authorzation, baseUrl),
			projects: new Projects(authorzation, baseUrl),
			registry: new Registry(authorzation, baseUrl),
			channels: new Channels(authorzation, baseUrl),
		};

		this.ignite = {
			deployments: {
				create: this.sdks.ignite.createDeployment.bind(this.sdks.ignite),
				delete: this.sdks.ignite.deleteDeployment.bind(this.sdks.ignite),
				getAll: this.sdks.ignite.getAllDeployments.bind(this.sdks.ignite),
				get: this.sdks.ignite.getDeployment.bind(this.sdks.ignite),
				getContainers: this.sdks.ignite.getContainers.bind(this.sdks.ignite),

				gateways: {
					getAll: this.sdks.ignite.getGatewaysForDeployment.bind(
						this.sdks.ignite,
					),

					create: this.sdks.ignite.createGateway.bind(this.sdks.ignite),
				},
			},

			gateways: {
				get: this.sdks.ignite.getGateway.bind(this.ignite),
				addDomain: this.sdks.ignite.addDomainToGateway.bind(this.sdks.ignite),
			},

			containers: {
				create: this.sdks.ignite.createContainer.bind(this.sdks.ignite),
				delete: this.sdks.ignite.deleteContainer.bind(this.sdks.ignite),
				getLogs: this.sdks.ignite.getLogs.bind(this.sdks.ignite),

				stop: async (container: Id<'container'>) => {
					await this.sdks.ignite.updateContainerState(
						container,
						API.Ignite.ContainerState.STOPPED,
					);
				},

				start: async (container: Id<'container'>) => {
					await this.sdks.ignite.updateContainerState(
						container,
						API.Ignite.ContainerState.RUNNING,
					);
				},
			},
		};

		this.users = {
			me: {
				get: this.sdks.user.getMe.bind(this.sdks.user),
				pats: {
					create: this.sdks.user.createPAT.bind(this.sdks.user),
					delete: this.sdks.user.deletePAT.bind(this.sdks.user),
					getAll: this.sdks.user.getAllPATs.bind(this.sdks.user),
				},
			},
		};

		this.projects = {
			projectTokens: {
				delete: this.sdks.projects.deleteProjectToken.bind(this.sdks.projects),
				get: this.sdks.projects.getProjectTokens.bind(this.sdks.projects),
				create: this.sdks.projects.createProjectToken.bind(this.sdks.projects),
			},

			secrets: {
				create: this.sdks.projects.createSecret.bind(this.sdks.projects),
				getAll: this.sdks.projects.getSecrets.bind(this.sdks.projects),
				delete: this.sdks.projects.deleteSecret.bind(this.sdks.projects),
			},

			getAllMembers: this.sdks.projects.getAllMembers.bind(this.sdks.projects),
			getCurrentMember: this.sdks.projects.getCurrentMember.bind(
				this.sdks.projects,
			),
		};

		this.pipe = {
			streams: {
				getAll: this.sdks.pipe.getStreams.bind(this.sdks.pipe),
			},
		};

		this.registry = {
			images: {
				getAll: this.sdks.registry.getImages.bind(this.sdks.registry),
			},
		};

		this.channels = {
			create: this.sdks.channels.create.bind(this.sdks.ignite),
			tokens: {
				create: this.sdks.channels.createToken.bind(this.sdks.channels),
			},
		};
	}
}
