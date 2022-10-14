# Next Generation Pipeline Demo

| Product name |  Team    |  Owner       |  Tech lead          |  Some link                |  Lifecycle stage |  Tags    |
| ------------ | -------- | ------------ | ------------------- | ------------------------- | ---------------- | -------- |
|  My product  | ThatTeam |  Cassie Cash |  Someguy Someguyson |  https://company.com/asdf |  Production      |  backend |

## Quickstart

Write an easy-to-follow guide or onboarding material for new users to help them quickly do something with the software.

### Commands

List your most important commands here.

#### Start development server

```shell
npm start
```

Description here.

### Configurations to edit

Configurations that are required and/or can be edited, including for initial setup, if necessary.

### Endpoints

- Development endpoint: [Link]()
- Staging endpoint: [Link]()
- Production endpoint: [Link]()

## Online documentation

Our online documentation can be found at:

- Website
- API docs
- Confluence (add link)

## Source code

Source code for our repositories can be found at:

- Location 1 (add link)
- Location 2 (add link)

## Diagrams

Please see the `diagrams` folder.

### Application code diagram

![Application code diagram](code-diagram.svg)

### Infrastructure diagram

[Infrastructure diagram](cfn-diagram.drawio)

### Software Bill of Materials (SBOM)

[SBOM](syft_report.txt)

### Architectural Decision Records

We follow the Michael Nygard model for Architectural Decision Records.
Please see the `adr` folder.

## API contracts, interfaces and event catalog

Visit the docs on Bump or see the `api` folder.

### Example payloads

Provide example payloads for all types of API requests or events that your system handles.

#### Do something

Description.

##### Input

```
POST /doSomething

{
  "key": "value"
}
```

##### Output

```
Status 200

{
  "key": "value"
}
```

### Events

#### SomethingHappened

Description.

##### Schema

```
{
 "key": "value"
}
```

## Tests and validation

Specify how to run tests and describe what types of tests are conducted. Also, specify any manual validations that might be needed and how to do them.

## Technical design of the solution

Write how you have designed your solution, for example in terms of technical scaling, databases, network segregation, and so on. See SDLC safeguards section 2 for more on these requirements.

### Explicit or implicit non-functional requirements

Something here.

### Technical scaling and performance

Something here.

### Resiliency and reliability

Something here.

### Access management

Something here.

#### Authentication and authorization

Something here.

### Data retention and sensitivity

Something here. For more, see `Data Inventory` section above.

### Cost

Something here.

### Operational effectiveness

Something here.

## Observability

### Logging

What information does this service log?
Link to logs/log group.

### Dashboards and metrics

Which dashboards exist? Is it easy to determine whether or not this microservice is working correctly by looking at the dashboard?
Link to dashboards.

### Key metrics

What are this microservice's key metrics?

**Example metrics**

- Language-specific metrics
- Availability
- SLA
- Latency
- Endpoint success/responses/response times
- Clients
- Errors and exceptions
- Dependencies

### Alerts

What alerts exist? Where do they report, on what thresholds? To whom? At what intervals?

## Changelog

See `CHANGELOG.md`.

## Bug and vulnerability reporting

We have a risk-based remediation strategy, with monthly, or more frequent, reviews. We use the CVSS framework to prioritize the order in which discovered vulnerabilities are fixed.

We use the following software tooling/products/services to aid us in our work:

- Some Product

Please see `SECURITY.md` for more.

## Contribution guidelines and code review process

Please see `CONTRIBUTING.md`.

## Code of conduct

Please see `CODE_OF_CONDUCT.md`.

## License

Please see `LICENSE.md`.
