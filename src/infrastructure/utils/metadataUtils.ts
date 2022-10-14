import { v4 as uuidv4 } from 'uuid';

/* eslint-disable complexity */

import { DynamicMetadataOutput } from '../../interfaces/Metadata';

/**
 * @description Set some of the dynamic user metadata in process environment for portability.
 */
export function setMetadata(event: any, context: any) {
  process.env.__STARTTIME__ = `${Date.now()}`;

  // Check first if this is 1) via event, 2) via header (API), or 3) set new one from AWS request ID, else set as unknown
  const correlationId =
    event?.['detail']?.['metadata']?.['correlationId'] ||
    event?.['headers']?.['x-correlation-id'] ||
    context?.['awsRequestId'] ||
    'UNKNOWN';
  process.env.__CORRELATIONID__ = correlationId;

  // TODO: traceId, spanId, spanParentId ??? https://docs.honeycomb.io/getting-data-in/tracing/send-trace-data/
  const spanParentId =
    event?.['detail']?.['metadata']?.['traceId'] || event?.['headers']?.['x-trace-id'] || '';
  process.env.__SPANPARENTID__ = spanParentId;

  const region = process.env.AWS_REGION;
  process.env.__REGION__ = region;

  const runtime = process.env.AWS_EXECUTION_ENV;
  process.env.__RUNTIME__ = runtime;

  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
  process.env.__FUNCTIONNAME__ = functionName;

  const functionMemorySize = process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE;
  process.env.__FUNCTIONMEMSIZE__ = functionMemorySize;

  const functionVersion = process.env.AWS_LAMBDA_FUNCTION_VERSION;
  process.env.__FUNCTIONVERSION__ = functionVersion;

  const route = event?.['detail-type'] || event?.['path'] || 'UNKNOWN';
  process.env.__ROUTE__ = route;

  // TODO: Will be unknown in called service
  const user = event?.['requestContext']?.['identity']?.['user'] || 'UNKNOWN';
  process.env.__USER__ = user;

  // TODO: Will be unknown in EventBridge case; use metadata object?
  const stage = event?.['requestContext']?.['stage'] || 'UNKNOWN';
  process.env.__STAGE__ = stage; // TODO this is also set in static config...

  const viewerCountry = event?.['headers']?.['CloudFront-Viewer-Country'] || 'UNKNOWN';
  process.env.__VIEWERCOUNTRY__ = viewerCountry;

  const accountId = event?.['requestContext']?.['accountId'] || event?.['account'] || 'UNKNOWN';
  process.env.__ACCOUNTID__ = accountId;

  // TODO: Will be unknown in called service
  const requestTimeEpoch = event?.['requestContext']?.['requestTimeEpoch'] || 'UNKNOWN';
  process.env.__REQTIMEEPOCH__ = requestTimeEpoch;
}

/**
 * @description Get dynamic user metadata from process environment.
 * @todo Get user and route
 */
export function produceDynamicMetadata(): DynamicMetadataOutput {
  return {
    correlationId: process.env.__CORRELATIONID__ || 'UNKNOWN',
    id: uuidv4(),
    //spanParentId: process.env.__SPANPARENTID__ || '',
    user: process.env.__USER__ || 'UNKNOWN',
    route: process.env.__ROUTE__ || 'UNKNOWN',
    region: process.env.__REGION__ || 'UNKNOWN',
    runtime: process.env.__RUNTIME__ || 'UNKNOWN',
    functionName: process.env.__FUNCTIONNAME__ || 'UNKNOWN',
    functionMemorySize: process.env.__FUNCTIONMEMSIZE__ || 'UNKNOWN',
    functionVersion: process.env.__FUNCTIONVERSION__ || 'UNKNOWN',
    stage: process.env.__STAGE__ || 'UNKNOWN',
    accountId: process.env.__ACCOUNTID__ || 'UNKNOWN',
    requestTimeEpoch: process.env.__REQTIMEEPOCH__ || 'UNKNOWN',
    timestamp: `${Date.now()}`,
    timestampHuman: new Date().toString() // TODO outputs right but log has wrong format
  };
}

/**
 * Utility to get correlation ID from environment.
 */
export const getCorrelationId = () => process.env.__CORRELATIONID__ || 'UNKNOWN';
