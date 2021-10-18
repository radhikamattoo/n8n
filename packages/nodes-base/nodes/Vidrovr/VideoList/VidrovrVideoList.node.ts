// Radhika Mattoo, radhika.mattoo@vidrovr.com
// Node for fetching a list of user-uploaded videos
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

export class VidrovrVideoList implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VidrovrVideoList',
		name: 'vidrovrVideoList',
		icon: 'file:vidrovrIcon.png',
		group: ['input', 'output'],
		version: 1,
		description: 'Fetch Vidrovr video list',
		defaults: {
				name: 'Vidrovr Video List',
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
					displayName: 'Limit',
					name: 'limit',
					type: 'string',
					default: '10',
					required: false,
					description: 'Number of videos returned'
				},
				{
					displayName: 'Offset',
					name: 'offset',
					type: 'string',
					default: '0',
					required: false,
					description: 'Offset from beginning of video return'
				},
				{
					displayName: 'Order',
					name: 'order',
					type: 'string',
					default: 'desc',
					required: false,
					description: 'Order of videos (by date uploaded)'
				},
				// Additional fields are grouped into a dropdown on the Node UI
				// Kept for optional params or params without defaults
				{
					displayName: 'Additional Fields',
					name: 'additionalFields',
					type: 'collection',
					placeholder: 'Add Field',
					default: {},
					options: [
						{
							displayName: 'Source',
							name: 'source',
							type: 'string',
							default: '',
							required: false,
							description: 'Video upload source'
						},
						{
							displayName: 'Start Date',
							name: 'start_date',
							type: 'dateTime',
							default: '',
							required: false,
							description: 'Start date of time range'
						},
						{
							displayName: 'End Date',
							name: 'end_date',
							type: 'dateTime',
							default: '',
							required: false,
							description: 'End date of time range'
						},
						{
							displayName: 'Title',
							name: 'title',
							type: 'string',
							default: '',
							required: false,
							description: 'Video title (fuzzy match)'
						}
					],
				},
				 

		]
	};


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let responseData;
		//Get credentials the user provided for this node
		const credentials = await this.getCredentials('vidrovrApi') as IDataObject;

		// Fields with defaults
		// In general, you get input data from the current node directly 
		// or from input passed from the previous node. The former is what is happening here
		const limit = this.getNodeParameter('limit', 0) as string; // 0 because it is a single-valued input, not a list of inputs
		const offset = this.getNodeParameter('offset', 0) as string;
		const order = this.getNodeParameter('order', 0) as string;

		let api_uri = `https://api.vidrovr.com/assets/get_video_list?api_key=${credentials.apiKey}&order=${order}&limit=${limit}&offset=${offset}`

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
		return [this.helpers.returnJsonArray(responseData['videos'])];
	}

}
