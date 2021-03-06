# LDES Server Simulator

> **Note**: <span style="Color:red">DO NOT use this repository anymore, it will be deleted soon.</span> This project has been moved to https://github.com/Informatievlaanderen/VSDS-LDES-E2E-testing/tree/main/ldes-server-simulator.

It is not very practical to test the LDES client with an actual LDES server as typically the [LDES data set](https://semiceu.github.io/LinkedDataEventStreams/) will be too large to be used in automated (end-to-end) testing. For example, the [beta GIPOD LDES server](https://private-api.gipod.beta-vlaanderen.be/api/v1/ldes/mobility-hindrances) contains more than 650.000 LDES members in 2.600 fragments and it takes about an hour to retrieve them.

This project implements a very small and basic LDES server (no support for accept headers, etc.) that allows to dynamically serve a number of fragment pages of your choice. The idea is that you POST a set of LDES fragments to the simulator, optionally set some redirects (to allow getting a specific fragment easier, e.g. the first or last) and then retrieve fragments using an LDES client from the simulator.

## Build the simulator

The simulator is implemented as a node.js application. Currently, after cloning the repository, you need to build it before you can run it.

The only **prerequisite** to build the simulator is [node.js](https://nodejs.org/en/) (it includes [npm](https://www.npmjs.com/)). You need to download and install node.js manually or using something like [chocolatey](https://chocolatey.org/). See [choco node.js package](https://community.chocolatey.org/packages/nodejs) for installation instructions.

Once node.js is installed, run the following commands from a (bash or powershell) terminal:
```bash
npm i
npm run build
```

## Test the simulator

At this moment, the simulator is completely unit tested with a coverage of 100% at the controller level (so excluding the [infrastructure part](./src/server.ts)).

To run the tests (after first building the simulator) use the following command:
```bash
npm test
```

## Run the simulator

The simulator accepts the following command line arguments:
* `--port=<port-number>` allows to set the port, defaults to 80
* `--host=<hostname>` allows to set the hostname, defaults to localhost
* `--baseUrl=<protocol+origin>` allows to set the base URL the server will use for re-writing a fragment ID origin (see [Upload a fragment](#upload-a-fragment) below), defaults to http://localhost:80
* `--seed=<local-directory>` allows to seed the simulator with the fragments found in the given local directory, no default (will not serve any fragments), optional
* `--silent` prevents any console debug output, optional

To start the simulator you need to run one of the following commands in a terminal (bash, powershell, etc.):
```bash
npm start
node dist/server.js
node dist/server.js --silent
node dist/server.js --seed=./data/gipod --silent
node dist/server.js --baseUrl=http://localhost:9000 --port=9000
```

## Retrieve available fragments and aliases

You can use a regulator browser, [postman](https://www.postman.com/), [curl](https://curl.se/) or any other http client to query the simulator. The root url of the simulator allows to query for the available fragments (uploaded pages) and aliases (configured redirects). 

To query the available fragments and aliases from the (bash) command line using curl:

`curl http://localhost/` 

This results initially in:
```json
{"aliases":[],"fragments":[]}  
```

## Upload a fragment

To upload the LDES fragments, the simulator offers an `/ldes` endpoint to which you can `POST` your LDES fragment with the body containg the fragment content. The simulator will replace the origin and protocol (e.g. `https://private-api.gipod.beta-vlaanderen.be`) in the fragment's id (`"tree:node"."@id"`) with the given baseURL to ensure that when it returns a fragment, you can follow the fragment relations.

To upload an LDES fragment from the (bash) command line using curl:

`curl -X POST http://localhost/ldes -H "Content-Type: application/json-ld" -d "@sample.jsonld"`

where `sample.jsonld` is your fragment file located in the current working directory. This results in something like (depends on the file's content):
```json
{"path":"/api/v1/ldes/mobility-hindrances"}
```

**Note**: you need to ensure that your collection of fragments does not contain a relation to a fragment outside of your collection (data subset). Obviously, the simulator will not contain such a fragment and return a HTTP code 404.

## Create an alias

Although it does not matter with which fragment you start retrieving a LDES data set, typically it can be retrieved from a 'starting point', e.g. in case of a time-based fragmentation this is the oldest fragment. For this and similar reasons you can alias a fragment with a more human-friendly path. The simulator allows to define an alias for a fragment, resulting in a HTTP redirect to the original fragment. The simulator provides an `/alias` endpoint to which you can `POST` your alias information with the body containg a json like:
```json
{"original":"<fragment-url>", "alias":"<alias-url>"}
```
To create an alias for a fragment from the (bash) command line using curl:
```bash
curl -X POST http://localhost/alias -H "Content-Type: application/json" -d '{"original": "https://private-api.gipod.beta-vlaanderen.be/api/v1/ldes/mobility-hindrances", "alias": "https://private-api.gipod.beta-vlaanderen.be/ldes/mobility-hindrances"}'
```
and the simulator will respond with:
```json
{"redirect":{"from":"/ldes/mobility-hindrances","to":"/api/v1/ldes/mobility-hindrances"}}
```

## Retrieve a fragment

After uploading the fragments and optionally creating aliases, you can retrieve a fragment using your favorite http client directly or through the simulator home page.

To request the simulator home page using curl:
```text
curl http://localhost
```
results in:
```json
{"aliases":["/ldes/mobility-hindrances"],"fragments":["/api/v1/ldes/mobility-hindrances"]}
```

To retrieve a fragment directly with curl:
```text
curl http://localhost/ldes/mobility-hindrances
```
results in:
```json
{
  "@context": ["https://private-api.gipod.beta-vlaanderen.be/api/v1/context/gipod.jsonld"],
  "@id": "http://localhost/api/v1/ldes/mobility-hindrances",
  "@type": "Node",
  "viewOf": "https://private-api.gipod.beta-vlaanderen.be/api/v1/ldes/mobility-hindrances",
  "collectionInfo": {
    "@id": "https://private-api.gipod.beta-vlaanderen.be/api/v1/ldes/mobility-hindrances",
    "@type": "EventStream",
    "shape": "https://private-api.gipod.beta-vlaanderen.be/api/v1/ldes/mobility-hindrances/shape",
    "timestampPath": "prov:generatedAtTime",
    "versionOfPath": "dct:isVersionOf"
  },
  "tree:relation": [],
  "items": [
      ... (omitted LDES members)
  ]
}

```
**Note**: that the fragment ID (and, if available) the relation link) refers to the simulator instead of the original LDES server.

## Docker
The simulator can be run as a docker container, after creating a docker image for it. The docker container will keep running until stopped.

To create a docker image, run the following command:
```bash
docker build --tag vsds/simulator .
```

To run the simulator docker image mapped on port 9000, you can use:
```bash
docker run -d -p 9000:80 vsds/simulator
```
You can also pass the following arguments when running the container:
* `SEED=data/gipod` to seed the simulator with a GIPOD data subset (currently the only data set we bundle in the container)
* `BASEURL=<protocol+origin+port>` to pass the base-url for rewriting the fragment IDs (e.g. `BASEURL=http://www.example.com:80`)

E.g.:
```bash
docker run -e SEED=data/gipod -e BASEURL=http://localhost:9000 -d -p 9000:80 vsds/simulator
```

The docker run command will return a container ID (e.g. `80ebecbd847b42ca359efd951ed1d8369531a35b567458c1ead1b8867c2d2391`), which you need to stop the container.

Alternatively you can run `docker ps` to retrieve the (short version of the) container ID.
 ```
CONTAINER ID   IMAGE            COMMAND                  CREATED         STATUS         PORTS                  NAMES
569053a527bd   vsds/simulator   "/usr/bin/dumb-init ???"   5 seconds ago   Up 4 seconds   0.0.0.0:9000->80/tcp   quizzical_bardeen
 ```
To stop the container, you need to call the stop command with the (long or short) container ID, e.g. `docker stop 569053a527bd`
