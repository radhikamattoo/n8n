
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


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let returnData = [];
        // Expecting list of object containing VideoID
        const videos = this.getInputData();
		
        //Get credentials the user provided for this node
		const credentials = await this.getCredentials('vidrovrApi') as IDataObject;


        for(let i = 0; i < videos.length; i++){
            //Make http request 
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
