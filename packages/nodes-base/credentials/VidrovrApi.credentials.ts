// Radhika Mattoo, radhika.mattoo@vidrovr.com
// Node for setting Vidrovr API key
import {
    ICredentialType,
    NodePropertyTypes,
} from 'n8n-workflow';

export class VidrovrApi implements ICredentialType {
    // This node can be set once and reused in other Vidrovr-based nodes.
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
