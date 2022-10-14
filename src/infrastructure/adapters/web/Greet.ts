import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import fetch from 'node-fetch';

import { LiteTracer } from '../../telemetry/LiteTracer';
import { Logger } from '../../logger/Logger';

import { setMetadata, produceDynamicMetadata, getCorrelationId } from '../../utils/metadataUtils';

import { metadataConfig } from '../../../config/metadata';

import {
  MissingRequestBodyError,
  MissingIdError,
  GreetingPhraseError,
  FailureToEmitEventError,
  MissingEnvVarsError,
  NetworkUserError,
  NetworkGreetingError
} from '../../../application/errors/errors';

const REGION = process.env.REGION || '';
const GET_USER_NAME_SERVICE_URL = process.env.GET_USER_NAME_SERVICE_URL || '';
const GREETING_PHRASES_SERVICE_URL = process.env.GREETING_PHRASES_SERVICE_URL || '';
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || '';

const spanNames = {
  fullSpan: 'Greet a user',
  userSpan: 'Call the User service and fetch a response',
  apiSpan: 'Call the GreetingPhrase service and fetch a response',
  emitSpan: 'Emitting the "Greet" event using AWS EventBridge'
};
const serviceName = metadataConfig.service;

/**
 * @description The `Greet` function is the entry point for the service.
 *
 * It integrates with another out-of-context AWS service (`User`) and with
 * an external service (`GreetingPhrase`) hosted on Mockachino
 * (`https://www.mockachino.com`).
 */
export async function handler(
  event: APIGatewayProxyEvent,
  awsContext: Context
): Promise<APIGatewayProxyResult> {
  const tracer = new LiteTracer({ serviceName });
  try {
    // START SETUP //
    setMetadata(event, awsContext);
    tracer.setCorrelationId(getCorrelationId());

    checkEnvVars();

    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    if (!body || JSON.stringify(body) === '{}') throw new MissingRequestBodyError();

    const id = body.id;
    if (!id) throw new MissingIdError();

    const logger = new Logger();
    // END SETUP //

    const span = tracer.start(spanNames['fullSpan']);

    logger.log('Attempting to fulfill request...');

    randomlyInjectError();
    const user = await getUser(GET_USER_NAME_SERVICE_URL, id, tracer);
    const phrase = await getGreetingPhrase(GREETING_PHRASES_SERVICE_URL, tracer);
    const message = phrase ? phrase.replace('{{NAME}}', user) : '';

    await emitEvent(message, tracer);

    span.end();

    return {
      statusCode: 200,
      body: JSON.stringify(message)
    };
  } catch (error: any) {
    /**
     * It's possible we haven't caught all errors.
     * In that case, let's check for uncaught standard
     * errors and log them out so they are visible for
     * our tools.
     */
    if (error.name === 'Error') {
      const logger = new Logger();
      logger.error(error.message);
    }

    /**
     * Closes all traces at once. If we don't do this,
     * we are going to have blanks in our trace history.
     */
    tracer.endAll();

    return {
      statusCode: 400,
      body: JSON.stringify(error.message)
    };
  }
}

/**
 * @description Check for presence of required environment variables.
 */
function checkEnvVars() {
  if (!REGION || !GET_USER_NAME_SERVICE_URL || !GREETING_PHRASES_SERVICE_URL || !EVENT_BUS_NAME)
    throw new MissingEnvVarsError();
}

/**
 * @description Use chance to calculate if we get an error or not.
 */
function randomlyInjectError() {
  const randomNumber = Math.floor(Math.random() * (100 + 1));
  if (randomNumber > 80) throw new Error('Random error occurred!');
}

/**
 * @description Call `User` service (`GetUserName`) and get response.
 */
async function getUser(url: string, id: string, tracer: LiteTracer) {
  const span = tracer.start(spanNames['userSpan']);

  const { correlationId } = produceDynamicMetadata();
  const { spanId, traceId } = span.getConfiguration();

  const userResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'x-correlation-id': correlationId,
      'x-trace-id': traceId,
      'x-span-id': spanId
    },
    body: JSON.stringify({ id })
  }).then((res: any) => {
    span.end();
    if (res.status >= 200 && res.status < 300) return res.json();
    else throw new NetworkUserError();
  });
  //.catch((error: any) => console.error(error.message)); // TODO

  return userResponse;
}

/**
 * @description Call `GreetingPhrase` service and get response.
 */
async function getGreetingPhrase(url: string, tracer: LiteTracer) {
  const span = tracer.start(spanNames['apiSpan']);
  const greetingPhraseResponse = await fetch(url).then((res: any) => {
    if (res.status >= 200 && res.status < 300) return res.json();
    else throw new NetworkGreetingError();
  });
  //.catch((error: any) => console.error(error.message)); // TODO

  const { greetingPhrases } = greetingPhraseResponse;
  const maximum = greetingPhrases.length - 1;
  const randomNumber = Math.floor(Math.random() * (maximum + 1));
  const phrase = greetingPhrases[randomNumber];

  span.end();

  if (!phrase) throw new GreetingPhraseError(`${randomNumber}`);
  return phrase;
}

/**
 * @description Emit an event using AWS EventBridge.
 */
async function emitEvent(message: string, tracer: LiteTracer) {
  const span = tracer.start(spanNames['emitSpan']);
  const metadata = produceDynamicMetadata();
  const { spanId, traceId } = span.getConfiguration();

  const eventBridge = new EventBridgeClient({ region: REGION });

  const command = {
    EventBusName: EVENT_BUS_NAME,
    Source: 'ngpdemo.greet',
    DetailType: 'Greet',
    Detail: JSON.stringify({
      metadata: {
        ...metadata,
        spanId,
        traceId
      },
      data: message
    })
  };
  const event = new PutEventsCommand({ Entries: [command] });

  const result = await eventBridge.send(event);
  span.end();

  if (result['FailedEntryCount'] && result['FailedEntryCount'] > 0)
    throw new FailureToEmitEventError();
}
