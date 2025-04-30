import { createBot, createProvider, createFlow } from '@builderbot/bot'
import { MysqlAdapter as Database } from '@builderbot/database-mysql'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import {
	welcomeFlow,
	registerFlow,
	assistantFlow,
	testFlow,
	agendFlow,
	finalFlow,
} from './flows/flows.js'

const PORT = process.env.PORT ?? 3008

//---------------------------------------------------------------------------------------------------------

const main = async () => {
	const adapterFlow = createFlow([
		welcomeFlow,
		registerFlow,
		assistantFlow,
		testFlow,
		agendFlow,
		finalFlow,
	])

	const adapterProvider = createProvider(Provider)
	const adapterDB = new Database({
		host: process.env.MYSQL_DB_HOST,
		user: process.env.MYSQL_DB_USER,
		database: process.env.MYSQL_DB_NAME,
		password: process.env.MYSQL_DB_PASSWORD,
	})

	const { handleCtx, httpServer } = await createBot(
		{
			flow: adapterFlow,
			provider: adapterProvider,
			database: adapterDB,
		},
		{
			queue: {
				timeout: 1000,
				concurrencyLimit: 5,
			},
		}
	)

	//---------------------------------------------------------------------------------------------------------

	adapterProvider.server.post(
		'/v1/messages', //Permite conectar los mensajes enviados con el bot
		handleCtx(async (bot, req, res) => {
			const { number, message, urlMedia } = req.body
			await bot.sendMessage(number, message, { media: urlMedia ?? null })//Le dice al bot que envie un mensaje al numero de telefono
			return res.end('sended')//Termina la respuesta HTTP devolviendo un simple "sended".
		})
	)
q
	adapterProvider.server.post(
		'/v1/register',//Permite registrar un nuevo usuario con el flow de registro a un numero en especifico
		handleCtx(async (bot, req, res) => {
			const { number, name } = req.body//Extrae el numero y el nombre (ID) del cuerpo de la peticion
			await bot.dispatch('REGISTER_FLOW', { from: number, name })//Inicia un flujo Manualmente, como si el usuario escribiera algo que dispara el flujo
			return res.end('trigger')
		})
	)

	adapterProvider.server.post(
		'/v1/samples',
		handleCtx(async (bot, req, res) => {
			const { number, name } = req.body
			await bot.dispatch('SAMPLES', { from: number, name })
			return res.end('trigger')
		})
	)

	adapterProvider.server.post(
		'/v1/blacklist',
		handleCtx(async (bot, req, res) => {
			const { number, intent } = req.body
			if (intent === 'remove') bot.blacklist.remove(number)
			if (intent === 'add') bot.blacklist.add(number)

			res.writeHead(200, { 'Content-Type': 'application/json' })
			return res.end(JSON.stringify({ status: 'ok', number, intent }))
		})
	)

	httpServer(+PORT)
}

main()
