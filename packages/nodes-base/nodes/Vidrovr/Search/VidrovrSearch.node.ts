// Radhika Mattoo, radhika.mattoo@vidrovr.com
// Node for searching a user's videos on Vidrovr
import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { OptionsWithUri } from 'request';

export class VidrovrSearch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VidrovrSearch',
		name: 'vidrovrSearch',
		icon: 'file:vidrovrIcon.png',
		group: ['input', 'output'],
		version: 1,
		description: 'Search uploaded videos on Vidrovr',
		defaults: {
				name: 'Vidrovr Search',
				color: '#1A82e2',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'vidrovrApi',
				required: true,
			},
		],
		properties: [
				// Node properties which the user gets displayed and
				// can change on the node.
				{
					displayName: 'Query',
					name: 'query',
					type: 'string',
					default: 'Xi, CCP, China',
					required: true,
					description: 'Keywords to search on'
				},
				{
					displayName: 'Additional Fields',
					name: 'additionalFields',
					type: 'collection',
					placeholder: 'Add Field',
					default: {},
					options: [
						{
							displayName: 'Filter',
							name: 'filter',
							type: 'json',
							default: '',
							required: false,
							description: 'JSON-stringified filter parameters for the advanced search.'
						},
						{
							displayName: 'Range',
							name: 'range_query',
							type: 'json',
							default: '',
							required: false,
							description: 'JSON-formatted time-range query'
						},
						{
							displayName: 'Size',
							name: 'size',
							type: 'number',
							default: 50,
							required: false,
							description: 'Used for paginating results. The maximum number of hits to return.'
						},
						{
							displayName: 'Sort',
							name: 'sort',
							type: 'string',
							default: '',
							required: false,
							description: 'Sort direction'
						},
						{
							displayName: 'Start',
							name: 'start',
							type: 'number',
							default: 0,
							required: false,
							description: 'Used for paginating results. The start of the results.'
						},
					],
				},
				 

		]
	};


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let responseData;
		//Get credentials the user provided for this node
		const credentials = await this.getCredentials('vidrovrApi') as IDataObject;

		// Fields with defaults
		const query = this.getNodeParameter('query', 0) as string;

		let api_uri = `https://api.vidrovr.com/search/search?api_key=${credentials.apiKey}&query=${query}`

		// Additional fields (as set in description field above) that are actually filled get grouped together to easily fetch optional params
		const additionalFields = this.getNodeParameter('additionalFields', 0) as IDataObject;

		// Build request URI
		for (const [key, value] of Object.entries(additionalFields)) {
			api_uri += `&${key}=${value}`;
		}

		//Make http request 
		const options: OptionsWithUri = {
			method: 'GET',
			uri: api_uri,
			json: true,
		};

		responseData = await this.helpers.request(options);

		// Map data to n8n data
		return [this.helpers.returnJsonArray(responseData)];
	}

}
