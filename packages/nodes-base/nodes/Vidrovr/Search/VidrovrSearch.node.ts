// Radhika Mattoo, radhika.mattoo@vidrovr.com
// Node for searching a user's videos on Vidrovr
import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
} from 'n8n-workflow';

import { OptionsWithUri } from 'request';
import { getEntityFields } from '../../Microsoft/Dynamics/GenericFunctions';

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
					default: '',
					required: true,
					description: 'Keywords to search on'
				},
				// Part of the advanced Filter field
				{
					displayName: 'Recognized People',
					name: 'recognized_people',
					type: 'string',
					default: '',
					placeholder: 'Xi Jinping Foreman, Emma Stone',
					description: 'Comma-separated list of people to search for'
				},
				{
					displayName: 'Video Source',
					name: 'video_source',
					type: 'options',
					default: 'direct_upload',
					description: 'Type of video uploaded',
					options: [
						{
							name: 'Feed',
							value: 'feed',
						},
						{
							name: 'Direct Upload',
							value: 'direct_upload',
						}
					]
				},
				{
					displayName: 'Feed Name',
					name: 'feed_uid',
					type: 'options',
					default: '',
					required: true,
					displayOptions: {
						show: {
							video_source: [
								'feed',
							],
						},
					},
					typeOptions: {
						loadOptionsMethod: 'getFeeds',
					},
					description: 'Query will include the name of the feed set here'
				},
				{
					displayName: 'Start Date',
					name: 'start_date',
					type: 'dateTime',
					default: '',
					description: 'Only query videos/feeds from after this date (inclusive)'
				},
				{
					displayName: 'End Date',
					name: 'end_date',
					type: 'dateTime',
					default: '',
					description: 'Only query videos/feeds from before this date (inclusive)'
				},
				{
					displayName: 'Additional Fields',
					name: 'additionalFields',
					type: 'collection',
					placeholder: 'Add Field',
					default: {},
					options: [
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

	methods = {
		loadOptions: {
			async getFeeds(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>{
				let returnData: INodePropertyOptions[] = [];
				const credentials = await this.getCredentials('vidrovrApi') as IDataObject;
				const api_uri = `https://api.vidrovr.com/feeds/feeds/get_feeds/?api_key=${credentials.apiKey}`;

				const options: OptionsWithUri = {
					method: 'GET',
					uri: api_uri,
					json: true,
				};
				if(this.helpers.request){
					const { data } = await this.helpers.request(options);
					for(const feed of data){
						const feed_name = feed.name;
						const feed_id = feed.uid;
						returnData.push({
							name: feed_name,
							value: feed_id
						});
					}
				}
				return returnData;
				
			}
		}
	}


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let responseData;
		//Get credentials the user provided for this node
		const credentials = await this.getCredentials('vidrovrApi') as IDataObject;

		// Request body. Includes:
			// range: object for filtering creation_date
			// exact: object for filtering by feed id
		const body : {[k: string]: object} = {};

		// Query string filters. Includes: 
			// recognized_people: string
		const filters: {[k: string]: any} = {};
		
		// Date range 
		const date_range: {[k: string]: object} = {};

		// Basic query
		const query = this.getNodeParameter('query', 0) as string;

		let api_uri = `https://api.vidrovr.com/search/search?api_key=${credentials.apiKey}&query=${query}`

		// Adding fields to filters query string param
		
		// Recognized People
		const recognized_people = this.getNodeParameter('recognized_people', 0) as string;
		if(recognized_people.length > 0){
			filters["recognized_people"]  = recognized_people.split(",");
		}
		if(Object.keys(filters).length > 0){
			api_uri += `&filters=${JSON.stringify(filters)}`;
		}

		// Adding fields to request body
		
		// Video Source
		const video_source = this.getNodeParameter('video_source', 0) as string;
		if(video_source == "feed"){
			const feed_uid = this.getNodeParameter('feed_uid', 0) as string;
			body['exact'] = {
				feed_uid: feed_uid
			};
		}

		// Ramge for creation_date
		let start_date = this.getNodeParameter('start_date', 0) as string;
		let end_date = this.getNodeParameter('end_date', 0) as string;
		const creation_date: {[k: string]: string} = {};

		// 2021-11-02T04:00:00.000Z
		if(start_date.length > 0){
			start_date = start_date.split("T")[0] + "T00:00:00";
			creation_date["gte"] = start_date;
		}
		if(end_date.length > 0){
			end_date = end_date.split("T")[0] + "T00:00:00";
			creation_date["lte"] = end_date;
		}
		if(Object.keys(creation_date).length > 0){
			date_range['creation_date'] = creation_date
		}

		// Add creation date object to body
		if(Object.keys(date_range).length > 0){
			body['range'] = date_range
		}

		// Additional fields (as set in description field above) that are actually filled get grouped together to easily fetch optional params
		const additionalFields = this.getNodeParameter('additionalFields', 0) as IDataObject;

		// Build request URI
		for (const [key, value] of Object.entries(additionalFields)) {
			api_uri += `&${key}=${value}`;
		}
		const options: OptionsWithUri = {
			method: 'GET',
			uri: api_uri,
			json: true,
			body: body
		};
		console.log("API uri:", api_uri);
		console.log("Body:", body);
		
		responseData = await this.helpers.request(options);

		// Map data to n8n data
		return [this.helpers.returnJsonArray(responseData)];
	}

}
