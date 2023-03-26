# ECE461_Project
This is the Project Repository for ECE 461: Software Engineering Part 2

## Installation

`git clone`
`npm install`

### Dependencies

Node version: 18.x.x
Docker (with docker compose): ^22.x


## Development

Uses gts linter to typescript (extension of eslint and prettier): https://github.com/google/gts

To run the API server locally, we provide a docker compose file.
All files in the src directory are updated automatically while the docker container is running to
enable easier development. Example: if you update index.ts in the src directory, the docker container will
automatically restart the API server with the new updated index.ts file.

To run the docker containers for local development:
#### First Time
`cd docker`
`sudo docker compose up`

#### After First Time
`cd docker`
`sudo docker compose up`

#### After First Time with update to npm dependencies
`cd docker`
`sudo docker compose up --build`

#### Delete Docker containers and networks
`cd docker`
`sudo docker compose down`

#### Delete Everything
`cd docker`
`sudo ./remove_all.sh`
