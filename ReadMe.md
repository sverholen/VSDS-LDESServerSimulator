# LDES Server Simulator

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

## Start the simulator

The simulator accepts the following command line arguments:

`--baseUrl=<protocol+origin>` allows to set the base URL the server will be serving, defaults to http://localhost:8080

`--seed=<local-directory>` allows to seed the simulator with the fragments found in the given local directory, no default (will not serve any fragments)

To start the simulator you need to run the following at the command line in a terminal (bash, powershell, etc.):

`node src/index.js` (use the default base URL)

OR

`node -- src/index.js --baseUrl=http://localhost:8080 --seed=./data/gipod` (providing custom arguments)

## Retrieve available fragments and aliases

You can use a regulator browser, [postman](https://www.postman.com/), [curl](https://curl.se/) or any other http client to query the simulator. The root url of the simulator allows to query for the available fragments (uploaded pages) and aliases (configured redirects). 

To query the available fragments and aliases from the (bash) command line using curl:

`curl http://localhost:8080/` 

This results initially in:
```json
{"aliases":[],"fragments":[]}  
```

## Upload a fragment

To upload the LDES fragments, the simulator offers an `/ldes` endpoint to which you can `POST` your LDES fragment with the body containg the fragment content. The simulator will replace the origin and protocol (e.g. `https://private-api.gipod.beta-vlaanderen.be`) in the fragment's id (`"tree:node"."@id"`) with its own origin and protocol (i.e. the baseURL) to ensure that when it returns a fragment, you can follow the fragment relations.

To upload an LDES fragment from the (bash) command line using curl:

`curl -X POST http://localhost:8080/ldes -H "Content-Type: application/json-ld" -d "@ldes-fragment.json-ld"`

where `ldes-fragment.json-ld` is your fragment file located in the current working directory. This results in something like (depends on the file's content):
```json
{"path":"/api/v1/ldes/mobility-hindrances?generatedAtTime=2020-12-28T09:36:09.72Z"}
```

> **Note**: you need to ensure that your collection of fragments does not contain a relation to a fragment outside of your collection (data subset). Obviously, the simulator will not contain such a fragment and return a HTTP code 404.

## Create an alias

Although it does not matter with which fragment you start retrieving a LDES data set, typically it can be retrieved from a 'starting point', e.g. in case of a time-based fragmentation this is the oldest fragment. For this and similar reasons you can alias a fragment with a more human-friendly path. The simulator allows to define an alias for a fragment, resulting in a HTTP redirect to the original fragment. The simulator provides an `/alias` endpoint to which you can `POST` your alias information with the body containg a json like:
```json
{"original":"<fragment-url>", "alias":"<alias-url>"}
```
To create an alias for a fragment from the (bash) command line using curl:
```bash
curl -X POST http://localhost:8080/alias -H "Content-Type: application/json" -d '{"original": "https://private-api.gipod.beta-vlaanderen.be/api/v1/ldes/mobility-hindrances?generatedAtTime=2020-12-28T09:36:09.72Z", "alias": "https://private-api.gipod.beta-vlaanderen.be/api/v1/ldes/mobility-hindrances"}'
```
and the simulator will respond with:
```json
{"redirect":{"from":"/api/v1/ldes/mobility-hindrances","to":"/api/v1/ldes/mobility-hindrances?generatedAtTime=2020-12-28T09:36:09.72Z"}}
```

## Retrieve a fragment

After uploading the fragments and optionally creating aliases, you can retrieve a fragment using your favorite http client directly or through the simulator home page.

To request the simulator home page using curl:
```text
curl http://localhost:8080
```
results in:
```json
{"aliases":["/api/v1/ldes/mobility-hindrances"],"fragments":["/api/v1/ldes/mobility-hindrances?generatedAtTime=2020-12-28T09:36:09.72Z"]}
```

To retrieve a fragment directly with curl:
```text
curl http://localhost:8080/api/v1/ldes/mobility-hindrances?generatedAtTime=2020-12-28T09:36:09.72Z
```
results in:
```json
{
  "@context": [
    "https://private-api.gipod.beta-vlaanderen.be/api/v1/context/gipod.jsonld"
  ],
  "@id": "http://localhost:8080/api/v1/ldes/mobility-hindrances?generatedAtTime=2020-12-28T09:36:09.72Z",
  "@type": "Node",
  "viewOf": "https://private-api.gipod.beta-vlaanderen.be/api/v1/ldes/mobility-hindrances",
  "collectionInfo": {
    "@id": "https://private-api.gipod.beta-vlaanderen.be/api/v1/ldes/mobility-hindrances",
    "@type": "EventStream",
    "shape": "https://private-api.gipod.beta-vlaanderen.be/api/v1/ldes/mobility-hindrances/shape",
    "timestampPath": "prov:generatedAtTime",
    "versionOfPath": "dct:isVersionOf"
  },
  "tree:relation": [
    {
      "tree:node": "http://localhost:8080/api/v1/ldes/mobility-hindrances?generatedAtTime=2020-12-28T09:37:18.577Z",
      "@type": "tree:GreaterThanRelation",
      "tree:path": "prov:generatedAtTime",
      "tree:value": "2020-12-28T09:37:18.577Z"
    }
  ],
  "items": [
      ... (omitted LDES members)
  ]
}
```
> **Note**: that the fragment ID and the relation link refer to the simulator instead of the original LDES server.
