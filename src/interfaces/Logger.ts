import { StaticMetadataConfigInput, DynamicMetadataOutput } from './Metadata';

/**
 * @description Interface for log messages.
 */
export interface LogInput {
  /**
   * @description Log message.
   */
  readonly message: Message;
  /**
   * @description Log level.
   */
  readonly level: LogLevels;
  /**
   * @description HTTP status that is related to this log.
   */
  readonly httpStatusCode: HttpStatusCode;
}

/**
 * @description Shape of final log output.
 */
export interface LogOutput extends StaticMetadataConfigInput, DynamicMetadataOutput {
  /**
   * @description Log message.
   */
  message: Message;
  /**
   * @description Log level.
   */
  level?: LogLevels;
  /**
   * @description HTTP status that is related to this log.
   */
  httpStatusCode: HttpStatusCode;
  /**
   * @description The duration of the processing.
   * @todo Remove?
   */
  //durationMs: number;
  /**
   * @description Was this is an error?
   */
  error: boolean;
}

/**
 * @description Valid log level names.
 */
export type LogLevels = 'ERROR' | 'WARN' | 'INFO';

/**
 * @description The message to put in the log.
 */
export type Message = string | Record<string, unknown>;

/**
 * @description Valid HTTP statuses.
 */
export type HttpStatusCode = 200 | 400 | 500;
