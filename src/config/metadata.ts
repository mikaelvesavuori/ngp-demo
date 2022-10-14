import { StaticMetadataConfigInput } from '../interfaces/Metadata';

/**
 * @description Metadata configuration for this service.
 */
export const metadataConfig: StaticMetadataConfigInput = {
  version: 1,
  lifecycleStage: 'production',
  owner: 'MyCompany',
  hostPlatform: 'aws',
  domain: 'CustomerAcquisition',
  system: 'Greet',
  service: 'Greet',
  team: 'MyDemoTeam',
  tags: [''],
  dataSensitivity: 'sensitive'
};
