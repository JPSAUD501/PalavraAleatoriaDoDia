import fastify from 'fastify';
import { DateTime } from 'luxon'

const port = parseInt(process.env.PORT || '3000')
const host = process.env.HOST || '0.0.0.0'
const server = fastify({ logger: true })

export class Server {
  async start () {
    console.log('🟢 - Health Checker On!')

    server.get('/', (request, reply) => {
      reply.send(`[${DateTime.now().setZone('America/Sao_Paulo')}] Palavra Aleatória do Dia - Running!`)
    })

    server.get('/health', (request, reply) => {
      reply.status(200).send('OK')
    })

    server.listen({ port, host }, (err, address) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      console.log(`Server listening at ${address}`)
    })
  }
}