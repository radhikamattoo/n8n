import {
    ICredentialType,
    NodePropertyTypes,
} from 'n8n-workflow';

export class VidrovrApi implements ICredentialType {
    name = 'vidrovrApi';
    displayName = 'Vidrovr API';
    documentationUrl = 'vidrovr';
    properties = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string' as NodePropertyTypes,
            default: '',
        },
    ];
}
