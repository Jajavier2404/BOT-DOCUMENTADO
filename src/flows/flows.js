//---------------------------------------------------------------------------------------------------------

import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import { obtenerUsuario, changeTest, getInfoCuestionario, switchFlujo } from '../queries/queries.js'
import { apiRegister } from './register/aiRegister.js'
import { apiAssistant1, apiAssistant2 } from './assist/aiAssistant.js'
import { procesarMensaje } from './tests/proccesTest.js'
import { apiBack1 } from '../openAi/aiBack.js'
import { apiAgend } from './agend/aiAgend.js'

//---------------------------------------------------------------------------------------------------------

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
	async (ctx, { gotoFlow, state }) => { 
		/*-ctx contiene info de usuario, from=telefono, body=mensaje, keyword=palabra clave que activa el flujo
		-state contiene la memoria del usuario, lo que ha hecho, lo que ha respondido, etc.
		-gotoFlow permite cambiar de flujo, por ejemplo de registerFlow a assistantFlow*/

		const user = await obtenerUsuario(ctx.from) //Espera a que crear o buscar al usuario en la base de datos
		await state.update({ user: user })//Dice al bot como, ey guarda en la memoria de este usuario su información como 'user' para que más tarde sepamos quién es, qué hizo, qué test lleva, etc.
		console.log(user.flujo)
		switch (user.flujo) {
			case 'assistantFlow':
				console.log('assistantFlow')
				return gotoFlow(assistantFlow)
			case 'testFlow':
				console.log('testFlow')
				return gotoFlow(testFlow)
			case 'agendFlow':
				console.log('agendFlow')
				return gotoFlow(agendFlow)

			case 'finalFlow':
				console.log('finalFlow')
				return gotoFlow(finalFlow)

			default:
				console.log('registerFlow')
				return gotoFlow(registerFlow)
		}
	}
)

//---------------------------------------------------------------------------------------------------------
/*Flujo de REGISTRO (no reconoce al usuario o está iniciando por primera vez)*/
export const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW')).addAction(
	async (ctx, { flowDynamic }) => { //FlowDynamic permite enviar mensajes al usuario
		await flowDynamic(await apiRegister(ctx.from, ctx.body))//Valida o Registra al usuario y manda un mensaje de bienvenida
	}
)

//---------------------------------------------------------------------------------------------------------

export const assistantFlow = addKeyword(utils.setEvent('ASSISTANT_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow, state }) => {
		const user = state.get('user')// Esto agarra el usuario guardado en la memoria temporal del bot
		if (!user.ayudaPsicologica) { 
			const ass2 = await apiAssistant2(ctx.from, ctx.body)
			if (ass2 == true) {//!como devuelve TRUE?
				return gotoFlow(testFlow)
			} else {
				await flowDynamic(ass2)
			}
		} else {
			if (user.ayudaPsicologica == 2) {
				await switchFlujo(user.telefonoPersonal, 'testFlow')
				return gotoFlow(testFlow)
			} else {
				const assist = await apiAssistant1(ctx.from, ctx.body)
				await flowDynamic(assist)//Esto es lo que manda el mensaje al usuario
			}
		}
	}
)

//---------------------------------------------------------------------------------------------------------

export const testFlow = addKeyword(utils.setEvent('TEST_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow, state }) => {
		const user = state.get('user')
		console.log(ctx.from, '\n', user.testActual)
		// Validate procesarMensaje output
		const message = await procesarMensaje(ctx.from, ctx.body, user.testActual)

		if (!message || typeof message !== 'string') {
			console.error('Error: procesarMensaje returned an invalid value.', { message })
			await flowDynamic(
				'Ocurrió un error procesando el mensaje. Por favor, inténtelo de nuevo.'
			)
			return
		}

		await flowDynamic(message)//Envia el mensaje del resultado del cuestionario o siguiente pregunta al usuario

		if (message.includes('El cuestionario ha terminado.')) {
			// Se verifica si el test es GHQ-12 (test de salud mental)
			if (user.testActual == 'ghq12') {
				//Se consulta como respondio al cuestionario GHQ-12
				const { infoCues, preguntasString } = await getInfoCuestionario(
					ctx.from,
					user.testActual
				)
				// Constuye un resumen
				const historialContent = `De las preguntas ${preguntasString}, el usuario respondio asi: ${JSON.stringify(
					infoCues
				)}`

				let accion = `Debes analizar las respuestas del usuario y asignarle en lo que más grave está
					Entre las siguientes opciones:
					"dep"(depresión)
					"ans"(ansiedad)
					"estr"(estrés)
					"suic"(ideacion suicida)
					"calVida"(Calidad de vida)
					Responde unicamente con "dep", "ans", "estr", "suic" o "calVida"
				`
				const hist = user.historial
				hist.push({ role: 'system', content: historialContent })
				let test = await apiBack1(hist, accion)// se realiza la consulta a la IA y se pone en el hi
				test = test.replace(/"/g, '') // Elimina todas las comillas

				const nuevoTest = await changeTest(ctx.from, test)//Se cambia el test del usuario en la base de datos al nuevo que la IA recomendó.
				await flowDynamic(await procesarMensaje(ctx.from, ctx.body, nuevoTest))//Inicia el nuevo test recomendado por la IA
			} else {
				await switchFlujo(ctx.from, 'finalFlow')
				return gotoFlow(finalFlow)

				//! await switchFlujo(ctx.from, 'agendFlow')
				//! return gotoFlow(agendFlow)
			}
		}
	}
)

//---------------------------------------------------------------------------------------------------------

export const agendFlow = addKeyword(utils.setEvent('AGEND_FLOW')).addAction(
	async (ctx, { flowDynamic, state }) => {
		const user = state.get('user')
		await flowDynamic(await apiAgend(ctx.from, ctx.body, user))
	}
)

//---------------------------------------------------------------------------------------------------------

export const finalFlow = addKeyword(utils.setEvent('FINAL_FLOW')).addAction(
	async (_, { flowDynamic }) => {
		await flowDynamic('Gracias por usar el bot, hasta luego!')
	}
)

//---------------------------------------------------------------------------------------------------------

// export const discordFlow = addKeyword('doc').addAnswer(
// 	[
// 		'You can see the documentation here',
// 		'📄 https://builderbot.app/docs \n',
// 		'Do you want to continue? *yes*',
// 	].join('\n'),
// 	{ capture: true },
// 	async (ctx, { gotoFlow, flowDynamic }) => {
// 		if (ctx.body.toLocaleLowerCase().includes('yes')) {
// 			return gotoFlow(registerFlow)
// 		}
// 		await flowDynamic('Thanks!')
// 		return
// 	}
// )

// export const welcomeFlow = addKeyword(EVENTS.WELCOME)
// 	.addAnswer(`🙌 Hello welcome to this *Chatbot*`)
// 	.addAnswer(
// 		[
// 			'I share with you the following links of interest about the project',
// 			'👉 *doc* to view the documentation',
// 		].join('\n'),
// 		{ delay: 800, capture: true },
// 		async (ctx, { fallBack }) => {
// 			if (!ctx.body.toLocaleLowerCase().includes('doc')) {
// 				return fallBack('You should type *doc*')
// 			}
// 			return
// 		},
// 		[discordFlow]
// 	)

// export const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW'))
// 	.addAnswer(`What is your name?`, { capture: true }, async (ctx, { state }) => {
// 		await state.update({ name: ctx.body })
// 	})
// 	.addAnswer('What is your age?', { capture: true }, async (ctx, { state }) => {
// 		await state.update({ age: ctx.body })
// 	})
// 	.addAction(async (_, { flowDynamic, state }) => {
// 		await flowDynamic(
// 			`${state.get('name')}, thanks for your information!: Your age: ${state.get('age')}`
// 		)
// 	})

// export const fullSamplesFlow = addKeyword(['samples', utils.setEvent('SAMPLES')])
// 	.addAnswer(`💪 I'll send you a lot files...`)
// 	.addAnswer(`Send image from Local`, { media: join(process.cwd(), 'assets', 'sample.png') })
// 	.addAnswer(`Send video from URL`, {
// 		media: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTJ0ZGdjd2syeXAwMjQ4aWdkcW04OWlqcXI3Ynh1ODkwZ25zZWZ1dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LCohAb657pSdHv0Q5h/giphy.mp4',
// 	})
// 	.addAnswer(`Send audio from URL`, {
// 		media: 'https://cdn.freesound.org/previews/728/728142_11861866-lq.mp3',
// 	})
// 	.addAnswer(`Send file from URL`, {
// 		media: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
// 	})
