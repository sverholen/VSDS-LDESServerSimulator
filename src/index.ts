import fastify from 'fastify'
import minimist from 'minimist'
import { LdesFragmentRepository } from './ldes-fragment-repository';
import { LdesFragmentService } from './ldes-fragment-service';
import { LdesFragmentController, Redirection } from "./ldes-fragment-controller";
import { TreeNode } from './tree-specification';

const server = fastify();
const args = minimist(process.argv.slice(2));
console.debug("arguments: ", args);

const baseUrl = new URL(args.baseUrl || 'http://localhost:8080')
const repository = new LdesFragmentRepository();
const service = new LdesFragmentService(baseUrl, repository);
const controller = new LdesFragmentController(service);

server.get('/', async (_request, _reply) => {
  return controller.getStatistics();
});

server.get('/*', async (request, reply) => {
  const fragment = controller.getFragment(request.url);
  reply.statusCode = fragment === undefined ? 404 : 200;
  return reply.send(fragment);
});

server.post('/ldes', async (request, reply) => {
  reply.statusCode = 201;
  return controller.postFragment(request.body as TreeNode);
});


server.post('/alias', async (request, reply) => {
  reply.statusCode = 201;
  return controller.postAlias(request.body as Redirection);
});

const options = { port: Number.parseInt(baseUrl.port), host: baseUrl.hostname };
server.listen(options, async (err, address) => {
  if (args.seed) {
    try {
      (await controller.seed(args.seed)).forEach(x => 
        console.debug(`seeded with file '${x.file}' containg fragment '${x.fragment}'`));
    } catch (error) {
      console.error(error);
    }
  }

  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
});
