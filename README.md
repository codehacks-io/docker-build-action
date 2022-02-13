# docker-build-action

Builds a docker image and publishes it.

In order for this action to work the `trigger` of the `workflow` must be a `release` see the [example](#example) to view how to use it. Such release must be tagged using the format `v{version-number}`. E.g. `v1`, `v1.1`, `v1.1.1` or `v0.0.1-rc.0` (always with a lowercase `v`).

The docker image gets published to 2 registries:

- A docker registry like GitHub registry or Docker Hub.
- Google Artifact Registry.

At build time, this action provides 2 arguments to the `docker build` command:
- `VERSION`: See [version](#version).
- `VERSION_SHA_BUILD`: See [version-sha-build](#version-sha-build).

-----

## Input arguments

### `dockerfile`

Path to your [Dockerfile](https://docs.docker.com/engine/reference/builder).

```yml
dockerfile: ${{ github.workspace }}/Dockerfile
```

### `dockercontext`

Path to your [Docker context](https://docs.docker.com/engine/context/working-with-contexts) used to build the image.

```yml
dockercontext: ${{ github.workspace }}
```

### `docker-registry-host`

Host of the docker registry where to publish the image. It's the "ghcr.io" part in "ghcr.io/codehacks-io/repo-name:latest".

```yml
docker-registry-host: ghcr.io
```

### `docker-namespace`

Namespace of the docker image. It's the "codehacks-io" part in "ghcr.io/codehacks-io/repo-name:latest". It's usually your GitHub or Docker username.

```yml
docker-namespace: my-docker-namespace
```

### `docker-image`

Name of the docker image. It's the "repo-name" part in "ghcr.io/codehacks-io/repo-name:latest".

```yml
docker-image: my-image
```

### `docker-user`

Username used for publishing the docker image. You can use your GitHub or Docker username.

```yml
docker-user: ${{ secrets.DOCKER_USER }} # You can have this data stored in any other secret.
```

### `docker-token`

Token to authenticate to the Docker registry.

If using GitHub registry, it can be generated at https://github.com/settings/tokens. It must have the `write:packages` scope.

If deploying to Docker Hub, use an access token generated at https://hub.docker.com/settings/security.

> This field is sensitive. You should use a github secret to set this variable.

```yml
docker-token: ${{ secrets.DOCKER_TOKEN }} # You can have this data stored in any other secret.
```

### `google-registry-host`

Host of your Google Artifact Registry. Syntax `${LOCATION}-docker.pkg.dev`. `LOCATION` is the regional or multi-regional location of the repository where the image is stored, for example us-east1 or us.

Run `gcloud artifacts locations list` to get available locations. More info https://cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling.

```yml
google-registry-host: us-central1-docker.pkg.dev
```

### `google-registry-project-id`

Your Google Cloud Console project ID.

If your project ID contains a colon, because of how Docker treats colons, you must **replace** the `:` character with a `/`.

```yml
google-registry-project-id: my-google-project-id
```

### `google-registry-repository`

Name of the repository where the image is stored.

```yml
google-registry-repository: my-google-artifact-registry-repository
```

### `google-registry-image`

Image name. I's the "test-image" part in "us-east1-docker.pkg.dev/my-project/my-repo/test-image".

It's usually the same as `docker-image` unless you want a different image name in Google Artifact Registry.

```yml
google-registry-image: my-image # It's normally the same as the input `docker-image`.
```

### `google-registry-service-account-key-base64`

Base64-encoded vserion of a service account key used to push the image to Google Artifact Registry. It must have the `Artifact Registry Writer` role.

More info https://cloud.google.com/artifact-registry/docs/docker/authentication#json-key and https://cloud.google.com/artifact-registry/docs/access-control

> This field is sensitive. You should use a github secret to set this variable.

```yml
google-registry-service-account-key-base64: ${{ secrets.GOOGLE_REGISTRY_SERVICE_ACCOUNT_KEY_BASE64 }} # You can have this data stored in any other secret.
```

-----

## Output arguments

### `version`

The version obtained from [GITHUB_REF](https://docs.github.com/en/actions/learn-github-actions/environment-variables#default-environment-variables).

E.g. if `GITHUB_REF` is `refs/tags/v0.0.1-rc.0`, the `VERSION` will be `0.0.1-rc.0`, without the `refs/tags/` and the leading `v`.

### `version-sha`

The same as `version` but it appends extra data:

- The character `-` so separate the `version`.
- The first 7 characters of the git sha.

E.g. `0.0.1-534716e`.

### `version-sha-build`

The same as `version-sha` but it appends extra data:

- `-ga-` indicating it was built with Github Actions
- The GitHub-provided [GITHUB_RUN_ID](https://docs.github.com/en/actions/learn-github-actions/environment-variables#default-environment-variables).

E.g. `0.0.1-534716e-ga-953451460`.

-----

## Example

You can have a workflow like `.github/workflows/docker-build.yml` with the following content:

```yml
name: 🐳 Build
on:
  release:
    types: [ created ]
jobs:
  build-and-push:
    name: Build and push docker image
    runs-on: ubuntu-latest
    environment: production
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - id: the-build
        uses: codehacks-io/docker-build-action@v0.0.0 # You can also use the main branch
        with:
          dockerfile: ${{ github.workspace }}/Dockerfile
          dockercontext: ${{ github.workspace }}
          docker-registry-host: ghcr.io
          docker-namespace: my-docker-namespace
          docker-image: my-image
          docker-user: ${{ secrets.DOCKER_USER }} # You can have this data stored in any other secret.
          docker-token: ${{ secrets.DOCKER_TOKEN }} # You can have this data stored in any other secret.
          google-registry-host: us-central1-docker.pkg.dev
          google-registry-project-id: my-google-project-id
          google-registry-repository: my-google-artifact-registry-repository
          google-registry-image: my-image # It's normally the same as the input `docker-image`.
          google-registry-service-account-key-base64: ${{ secrets.GOOGLE_REGISTRY_SERVICE_ACCOUNT_KEY_BASE64 }} # You can have this data stored in any other secret.
      - run:
          echo Built with tags '${{ steps.the-build.outputs.version }}', '${{ steps.the-build.outputs.version-sha }}' and '${{ steps.the-build.outputs.version-sha-build }}'.
        shell: bash
```
