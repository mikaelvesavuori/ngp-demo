rm -rf docs

npx typedoc --entryPoints src --entryPointStrategy expand --exclude "**/*+(test).ts" --excludeExternals --out docs
npx ag api/schema.json @asyncapi/html-template --output docs/api --force-write
npx madge --image docs/code-diagram.svg --exclude '(testdata|interfaces|application/errors)/.{0,}.(ts|js|json)' --extensions ts src
npx cfn-dia draw.io -t src/.serverless/cloudformation-template-update-stack.json --ci-mode -o docs/cfn-diagram.drawio

alias draw.io='/Applications/draw.io.app/Contents/MacOS/draw.io'

draw.io -x -f svg --scale 3 \
  -o docs/cfn-diagram.png \
  docs/cfn-diagram.drawio
