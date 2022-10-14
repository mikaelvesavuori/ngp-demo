import { LogInput, LogOutput, Message } from '../../interfaces/Logger';

import { produceDynamicMetadata } from '../utils/metadataUtils';

import { metadataConfig } from '../../config/metadata';

/**
 * @description Logger is just a very basic logging utility.
 */
export class Logger {
  /**
   * @description Output an informational-level log.
   */
  public log(message: Message): LogOutput {
    const createdLog = this.createLog({ message, level: 'INFO', httpStatusCode: 200 });
    process.stdout.write(JSON.stringify(createdLog) + '\n');
    return createdLog;
  }

  /**
   * @description Output a warning-level log.
   */
  public warn(message: Message): LogOutput {
    const createdLog = this.createLog({ message, level: 'WARN', httpStatusCode: 200 });
    process.stdout.write(JSON.stringify(createdLog) + '\n');
    return createdLog;
  }

  /**
   * @description Output an error-level log.
   */
  public error(message: Message): LogOutput {
    const createdLog = this.createLog({ message, level: 'ERROR', httpStatusCode: 400 });
    process.stdout.write(JSON.stringify(createdLog) + '\n');
    return createdLog;
  }

  /**
   * @description Create the log envelope.
   */
  private createLog(log: LogInput): LogOutput {
    const {
      correlationId,
      user,
      route,
      region,
      runtime,
      functionName,
      functionMemorySize,
      functionVersion,
      stage,
      accountId,
      requestTimeEpoch,
      id,
      timestamp,
      timestampHuman
    } = produceDynamicMetadata();

    const logOutput = {
      // Static metadata
      ...metadataConfig,
      // Dynamic metadata
      message: log.message,
      error: log.level === 'ERROR' ? true : false,
      httpStatusCode: log.httpStatusCode,
      id,
      timestamp,
      timestampHuman,
      correlationId,
      user,
      route,
      region,
      runtime,
      functionName,
      functionMemorySize,
      functionVersion,
      stage,
      accountId,
      requestTimeEpoch
    };

    return logOutput;
  }
}
