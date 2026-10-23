# Hello Module hooks

This folder is optional and only referenced when `entrypoints.hooks` is set in `extension.json`.

The reference module does not declare hooks on purpose: extension packages are loaded in
`metadata-only` mode, so nothing here is imported or executed by the core process. Use this
directory to document the lifecycle hooks a module intends to expose once a runtime loader exists.
