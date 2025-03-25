## Project management

Each project inside the `packages` folder, contains a `package.json` where the `name` is used as the reference for command execution (we'll call this the package name). Each package is declared inside the `pnpm-workspace.yaml` and `lerna.json` files.

## Install all dependencies

If you run `pnpm install` from the root. This command will install **all the dependencies** for all the packages inside the workspace.

## Install partial dependencies

If you want to install only the dependencies for the projects you need, you can run the filter command and pass a glob pattern matching the ones you want. For example. If you want to install all dependencies for `send`, you can run

`pnpm install --filter "send-*"`

This will only install the dependencies where the package name starts with `send-`.

## Running commands

_Note: Make sure you install the dependencies you need before running your commands._

You can run any package's commands by calling.

`lerna run <your-command> --scope=<package-name>`

For example, If I want to run e2e tests on send, I can run

`lerna run test:e2e:ci --scope=send-suite`
