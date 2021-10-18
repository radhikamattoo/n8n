// Radhika Mattoo, radhika.mattoo@vidrovr.com
// Node for fetching video metadata 
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

export class VidrovrVideoMetadata implements INodeType {
	// n8n uses the properties set in the description property to render the node in the Editor UI.
	description: INodeTypeDescription = {
		displayName: 'VidrovrVideoMetadata',
		name: 'vidrovrVideoMetadata',
		icon: 'file:vidrovrIcon.png',
		group: ['input', 'output'],
		version: 1,
		description: 'Fetch Vidrovr video metadata',
		defaults: {
				name: 'Vidrovr Video Metadata',
				color: '#1A82e2',
		},
		inputs: ['main'],
		outputs: ['main'],
		// credentials field references custom credentials node for authentication
		// See: nodes-base/credentials/VidrovrApi.credentials.ts
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
					displayName: 'Video ID',
					name: 'video_id',
					type: 'string',
					default: '',
					required: true,
					description: 'UID of video for which you want metadata'
				},
		]
	};


	// Execute function determines what happens when a node is run
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let returnData = [];
        // Expecting list of objects containing VideoID
		// In general, you get input data from the current node directly 
		// or from input passed from the previous node. The latter is what is happening here
        const videos = this.getInputData();
		
        //Get credentials the user provided for this node
		// Credentials API node used here!
		const credentials = await this.getCredentials('vidrovrApi') as IDataObject;


        for(let i = 0; i < videos.length; i++){
            //Make http request 
			// Since videos is a list of objects, you reference the offset via param i when you call getNodeParameter
            const video_id = this.getNodeParameter('video_id', i) as string;
            const api_uri = `https://api.vidrovr.com/metadata/metadata/get_metadata?api_key=${credentials.apiKey}&video_id=${video_id}`;
			const options: OptionsWithUri = {
                method: 'GET',
                uri: api_uri,
                json: true,
            };

            const responseData = await this.helpers.request(options);
            returnData.push(responseData['metadata']);
        }
		

		// Map data to n8n data
		return [this.helpers.returnJsonArray(returnData)];
	}

}
