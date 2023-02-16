[![build-test](https://github.com/gravwell/pr-labels/actions/workflows/test.yml/badge.svg)](https://github.com/gravwell/pr-labels/actions/workflows/test.yml)

# PR Labels

This action applies/removes labels to/from PRs to indicate their status like so:

| Label     | Description                                      |
| --------- | ------------------------------------------------ |
| conflict | Labeled PR is in conflict with its target branch |
| behind    | Labeled PR is behind its target branch           |

## Inputs

| Parameter      | Description                                     | Required | Default |
| -------------- | ----------------------------------------------- | -------- | ------- |
| `GITHUB_TOKEN` | A GitHub Token. This can help with rate limits. | Y        | None    |

## Example

### Basic Example

```yaml
on: # Check labels when a PR is updated or when a branch is pushed
  pull_request_target:
  push:

jobs:
  test:
    name: Update PR Labels
    runs-on: ubuntu-latest
    steps:
      - uses: gravwell/pr-labels@v1
        with:
          GITHUB_TOKEN: ${{ github.token }}
```
