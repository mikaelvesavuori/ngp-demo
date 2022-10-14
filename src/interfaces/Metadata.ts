/**
 * @description User-provided static metadata input.
 * @todo Update descriptions
 */
export type StaticMetadataConfigInput = {
  // REQUIRED FIELDS

  /**
   * @description The version of the event.
   * @todo "...of the event"?
   */
  version: number;
  /**
   * @description Which lifecycle stage the event pertains to.
   */
  lifecycleStage: LifecycleStage;
  /**
   * @description The organization that owns this system.
   */
  owner: string;
  /**
   * @description The host platform or infrastructure that runs the system.
   */
  hostPlatform: string;
  /**
   * @description Domain of the producer system.
   */
  domain: string;
  /**
   * @description System of the producer.
   * @todo ???
   */
  system: string;
  /**
   * @description Service of the producer.
   */
  service: string;
  /**
   * @description Team responsible for emitting this event.
   */
  team: string;

  // OPTIONAL FIELDS

  /**
   * @description Tags for this event.
   */
  tags?: string[];
  /**
   * @description Data sensitivity classification for the contents of this event.
   */
  dataSensitivity?: DataSensitivity;
};

/**
 * @description Enriched metadata that is dynamically extended.
 */
export type Metadata = StaticMetadataConfigInput & {
  /**
   * @description Event ID.
   */
  id: string;
  /**
   * @description Correlation ID for the function call.
   */
  correlationId: string;
  /**
   * @description Timestamp when the event was produced.
   */
  timestamp: string;
  /**
   * @description Timestamp of the call.
   */
  timestampRequest: string;
  /**
   * @description What region is this system running in?
   * @todo Is this redundant since this is present in `DynamicMetadataOutput` too?
   */
  region: string;
  /**
   * @description What legal jurisdiction does this system fall into?
   * @example `EU`, `US`, `China`
   */
  jurisdiction: string;
};

/**
 * @description Valid lifecycles stages.
 */
type LifecycleStage = 'production' | 'qa' | 'test' | 'development' | 'staging' | 'demo';

/**
 * @description Valid data sensitivity levels.
 */
type DataSensitivity = 'public' | 'sensitive' | 'proprietary' | 'secret';

/**
 * @description Dynamic metadata.
 */
export type DynamicMetadataOutput = {
  /**
   * @description ID of the log.
   */
  id: string;
  /**
   * @description Span ID for the log.
   * @todo Remove?
   */
  //spanId: string;
  /**
   * @description Timestamp of this message in Unix epoch.
   */
  timestamp: string;
  /**
   * @description Timestamp of this message in ISO 8601 format.
   */
  timestampHuman: string;
  /**
   * @description Correlation ID for this function call.
   */
  correlationId: string;
  /**
   * @description Duration of function call in milliseconds.
   * @todo Remove?
   */
  //durationMs: number;
  /**
   * @description The user in this log context.
   */
  user: string;
  /**
   * @description The route that is responding.
   * @example `/doSomething`
   */
  route: string;
  /**
   * @description The trace ID correlated to this call.
   * @todo Remove?
   */
  //traceId: string;
  /**
   * @description The parent trace ID correlated to this call. Not included if root span.
   * @todo Remove?
   */
  //spanParentId?: string;
  /**
   * @description The region of the responding function/system.
   */
  region: string;
  /**
   * @description What runtime is used?
   */
  runtime: string;
  /**
   * @description The name of the funciton.
   */
  functionName: string;
  /**
   * @description Memory size of the current function.
   */
  functionMemorySize: string;
  /**
   * @description The version of the function.
   */
  functionVersion: string;
  /**
   * @description What AWS stage are we in?
   */
  stage: string;
  /**
   * @description The AWS account ID that the system is running in.
   */
  accountId: string;
  /**
   * @description Request time in Unix epoch of the incoming request.
   */
  requestTimeEpoch: string;
};
