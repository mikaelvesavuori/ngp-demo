import { v4 as uuidv4 } from 'uuid';

/**
 * @description Custom basic tracer to replicate OpenTelemetry semantics
 * and behavior. Built as a ligher-weight way to handle spans in technical
 * contexts (like AWS Lambda) where OTEL tooling seems brittle at best.
 *
 * Make sure to reuse the same instance across your application to get it
 * working as intended.
 *
 * `LiteTracer` also removes the need to pass in complete instances into the
 * span functions. Instead, by using simple strings when refering to spans,
 * it makes it easier to handle the referential logic required.
 *
 * LiteTracer simplifies the OTEL model a bit:
 * - It only supports a single tracing context
 */
export class LiteTracer {
  serviceName: string;
  spans: SpanRepresentation[];
  correlationId?: string;
  parentContext?: string;

  constructor(input: LiteTracerInput) {
    const { serviceName } = input;
    this.serviceName = serviceName;
    this.spans = [];
    if (input?.correlationId) this.setCorrelationId(input.correlationId);
  }

  /**
   * @description Set correlation ID. Make use of this if you
   * were not able to set the correlation ID at the point of
   * instantiating `LiteTracer`.
   *
   * This value will be propagated to all future spans.
   */
  public setCorrelationId(correlationId: string) {
    this.correlationId = correlationId;
  }

  /**
   * @description Set the parent context. Use this if you
   * want to automatically assign a span as the parent for
   * any future spans.
   *
   * Call it with an empty string to reset it.
   *
   * @example tracer.setParentContext('FullSpan')
   * @example tracer.setParentContext('')
   *
   * This value will be propagated to all future spans.
   */
  public setParentContext(parentContext: string): void {
    this.parentContext = parentContext;
  }

  /**
   * @description Get an individual span.
   */
  private getSpan(spanName: string): SpanRepresentation | null {
    const span: SpanRepresentation = this.spans.filter(
      (span: SpanRepresentation) => span.spanName === spanName
    )[0];
    if (!span) return null;
    return span;
  }

  /**
   * @description Utility to get `parentSpanId` and `parentTraceId` from
   * the correct source. If passed a `parentSpanName` we will always use
   * this over any existing context.
   */
  private getParentIds(spanName: string, parentSpanName?: string) {
    // This instance looks fresh so let's set the parent as the current one for later spans
    if (!this.parentContext) this.setParentContext(spanName);
    const parentContext = this.parentContext || '';

    // Return values for new parent context
    if (parentSpanName) {
      const span = this.getSpan(parentSpanName);
      if (!span) throw new MissingParentSpanError(parentSpanName);
      return {
        parentSpanId: span['spanId'],
        parentTraceId: span['traceId']
      };
    }

    // Reuse the existing context for child span
    if (spanName !== parentContext) {
      const span = this.getSpan(parentContext);
      if (span)
        return {
          parentSpanId: span['spanId'],
          parentTraceId: span['traceId']
        };
    }

    // If `parentContext` and `spanName` are the same we will return undefined to not get a relational loop
    if (spanName === parentContext) {
      return {
        parentSpanId: undefined,
        parentTraceId: undefined
      };
    }

    throw new GetParentIdsError();
  }

  /**
   * @description Remove an individual span.
   *
   * Avoid calling this manually as the `Span` class will
   * make the necessary call when having ended a span.
   */
  public removeSpan(spanName: string): void {
    const spans: SpanRepresentation[] = this.spans.filter(
      (span: SpanRepresentation) => span.spanName !== spanName
    );
    this.spans = spans;
  }

  /**
   * @description Start a new trace. This will typically be automatically
   * assigned to the parent trace if one exists. Optionally you can pass in
   * the name of a parent span to link it to its trace ID.
   *
   * @see https://docs.honeycomb.io/getting-data-in/tracing/send-trace-data/
   * ```
   * A root span, the first span in a trace, does not have a parent. As you
   * instrument your code, make sure every span propagates its `trace.trace_id`
   * and` trace.span_id` to any child spans it calls, so that the child span can
   * use those values as its `trace.trace_id` and `trace.parent_id`. Honeycomb uses
   * these relationships to determine the order spans execute and construct the
   * waterfall diagram.
   * ```
   *
   * @param parentSpanName If provided, this will override any existing parent context
   * for this particular trace.
   */
  public start(spanName: string, parentSpanName?: string): Span {
    const spanExists = this.getSpan(spanName);
    if (spanExists) throw new SpanAlreadyExistsError(spanName);

    const { parentSpanId, parentTraceId } = this.getParentIds(spanName, parentSpanName);

    const newSpan = new Span({
      tracer: this,
      correlationId: this.correlationId,
      service: this.serviceName,
      spanName,
      parentSpanId,
      parentTraceId,
      parentSpanName
    });

    // Store local representation so we can make lookups for relations.
    const { spanId, traceId } = newSpan.getConfiguration();
    this.spans.push({
      spanName,
      spanId: spanId,
      traceId: traceId,
      reference: newSpan
    });

    return newSpan;
  }

  /**
   * @description Closes all spans.
   *
   * Only use the sparingly and in relevant cases, such as
   * when you need to close all spans in case of an error.
   */
  public endAll() {
    this.spans.forEach((spanRep: SpanRepresentation) => spanRep.reference.end());
  }
}

/**
 * @description Produces valid invariants of the actual `Span`.
 */
class Span {
  tracer: LiteTracer;
  configuration: SpanConfiguration;

  constructor(input: SpanInput) {
    const { tracer } = input;
    this.tracer = tracer;
    this.configuration = this.produceSpan(input);
  }

  /**
   * @description Produce a `Span`.
   */
  private produceSpan(input: SpanInput): SpanConfiguration {
    const { spanName, parentSpanName, parentSpanId, parentTraceId, correlationId, service } = input;
    const time = `${Date.now()}`;

    return {
      name: spanName, // Redundant? However, needs to be caught by Honeycomb
      timestamp: new Date().toISOString(), // RFC3339 format
      startTime: time,
      endTime: time,
      durationMs: 0,
      spanName,
      spanParent: parentSpanName,
      spanParentId: parentSpanId || '',
      spanId: uuidv4(),
      traceId: parentTraceId || uuidv4(),
      attributes: {},
      correlationId: correlationId || '',
      service: service || '',
      isEnded: false
    };
  }

  /**
   * @description Set a single attribute by key and value.
   */
  public setAttribute(key: any, value: any): void {
    this.configuration['attributes'][key] = value;
  }

  /**
   * @description Set one or more attributes through an object.
   * Merges and replaces any existing keys.
   */
  public setAttributes(attributeObject: Record<string, any>): void {
    const combinedAttributes = Object.assign(this.configuration['attributes'], attributeObject);
    this.configuration['attributes'] = combinedAttributes;
  }

  /**
   * @description Get the span's full configuration object.
   */
  public getConfiguration(): SpanConfiguration {
    return this.configuration;
  }

  /**
   * @description End the trace. Perform some configuration modification
   * to ensure logs looks right and don't contain unnecessary information.
   * Finally, call the tracer so it can remove its representation of this span.
   */
  public end(): void {
    const config = this.configuration;

    config['durationMs'] = Math.floor(Date.now() - parseInt(config.startTime));
    config['isEnded'] = true;
    // @ts-ignore
    delete config['startTime']; // Not needed in logs
    // @ts-ignore
    delete config['endTime']; // Not needed in logs
    // @ts-ignore
    if (!config['spanParentId']) delete config['spanParentId']; // Ensure this is completely erased if just empty

    // This ensures we get correct logs going between AWS and Honeycomb
    process.stdout.write(JSON.stringify(config) + '\n');

    // The tracer no longer needs to care about this span
    this.tracer.removeSpan(config['spanName']);
  }
}

/**
 * @description Used when we cannot find the parent span.
 */
export class MissingParentSpanError extends Error {
  constructor(parentSpanName: string) {
    super(parentSpanName);
    this.name = 'MissingParentSpanError';
    const message = `No parent span found by the name "${parentSpanName}"!`;
    this.message = message;
    process.stdout.write(JSON.stringify(message) + '\n');
  }
}

/**
 * @description Used when `getParentIds()` fails, either
 * because it could not find relevant values or because
 * we ended up in a non-catched state.
 */
export class GetParentIdsError extends Error {
  constructor() {
    super();
    this.name = 'GetParentIdsError';
    const message = `Something went wrong when running getParentIds()!`;
    this.message = message;
    process.stdout.write(JSON.stringify(message) + '\n');
  }
}

/**
 * @description Used when user is attempting to create a span
 * with a name that already exists.
 */
export class SpanAlreadyExistsError extends Error {
  constructor(spanName: string) {
    super(spanName);
    this.name = 'SpanAlreadyExistsError';
    const message = `A span with the name "${spanName}" already exists!`;
    this.message = message;
    process.stdout.write(JSON.stringify(message) + '\n');
  }
}

/**
 * @description Input when creating a new `LiteTracer` instance.
 */
interface LiteTracerInput {
  serviceName: string;
  correlationId?: string;
  parentContext?: string;
}

/**
 * @description This is how `LiteTracer` will represent each
 * new span. `LiteTracer` will make certain lookups to process
 * parent-child relationships.
 */
type SpanRepresentation = {
  spanName: string;
  traceId: string;
  spanId: string;
  reference: Span;
};

/**
 * @description The configuration shape of a `Span`. This configuration is
 * what we will manipulate and work on.
 *
 * @see https://docs.honeycomb.io/working-with-your-data/settings/definitions/
 */
interface SpanConfiguration {
  /**
   * Name of the span. Same as `spanName`.
   * Used as a redundancy as Honeycomb might need
   * to pick up on this field name.
   * @example GreetUser
   */
  name: string;
  /**
   * Timestamp when initially called in RFC3339 format.
   */
  timestamp: string;
  /**
   * Start time in Unix epoch. Same as `timestamp`.
   */
  startTime: string;
  /**
   * End time in Unix epoch.
   */
  endTime: string;
  /**
   * Duration of the span in milliseconds.
   */
  durationMs: number;
  /**
   * Name of the span.
   * @example GreetUser
   */
  spanName: string;
  /**
   * Name of the span's parent.
   */
  spanParent?: string;
  /**
   * Trace ID for this span. Should be same as `parentTraceId`, else set new one.
   */
  traceId: string;
  /**
   * Span ID for this span. Should always be unique.
   */
  spanId: string;
  /**
   * ID of parent span.
   */
  spanParentId: string;
  /**
   * Object with user-configurable attributes.
   */
  attributes: Record<string, any>;
  /**
   * Correlation ID of the call in which the span is started.
   */
  correlationId: string;
  /**
   * Service name.
   */
  service: string;
  /**
   * Has this span ended?
   * Is set to `true` automatically when calling with `span.end()`.
   */
  isEnded: boolean;
}

/**
 * @description Input for creating a new `Span`.
 */
type SpanInput = {
  /**
   * An instance of `LiteTracer`.
   */
  tracer: LiteTracer;
  /**
   * Correlation ID of the call in which the span is started.
   */
  correlationId?: string;
  /**
   * Service name.
   */
  service: string;
  /**
   * Name of the span.
   */
  spanName: string;
  /**
   * Span ID of the span's parent.
   */
  parentSpanId?: string;
  /**
   * Trace ID of the span's parent.
   */
  parentTraceId?: string;
  /**
   * Parent span's name.
   */
  parentSpanName?: string;
};
