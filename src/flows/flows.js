//---------------------------------------------------------------------------------------------------------

import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import { obtenerUsuario, changeTest, getInfoCuestionario, switchFlujo } from '../queries/queries.js'
import { apiRegister } from './register/aiRegister.js'
import { apiAssistant1, apiAssistant2 } from './assist/aiAssistant.js'
import { procesarMensaje } from './tests/proccesTest.js'
import { apiBack1 } from '../openAi/aiBack.js'
import { apiAgend } from './agend/aiAgend.js'
import { consentPrompt} from '../openAi/prompts.js'

//---------------------------------------------------------------------------------------------------------

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
	async (ctx, { gotoFlow, state }) => {
		const user = await obtenerUsuario(ctx.from)
		await state.update({ 
			user: user,
			consentimientoGHQ12: false, // Inicializar consentimiento como falso
            esperandoConsentimiento: false // Inicializar estado de espera
		})
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

export const registerFlow = addKeyword(utils.setEvent('REGISTER_FLOW')).addAction(
	async (ctx, { flowDynamic }) => {
		await flowDynamic(await apiRegister(ctx.from, ctx.body))
	}
)

//---------------------------------------------------------------------------------------------------------

export const assistantFlow = addKeyword(utils.setEvent('ASSISTANT_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow, state }) => {
		const user = state.get('user')
		if (!user.ayudaPsicologica) {
			const ass2 = await apiAssistant2(ctx.from, ctx.body)
			if (ass2 == true) {
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
				await flowDynamic(assist)
			}
		}
	}
)

//---------------------------------------------------------------------------------------------------------

export const testFlow = addKeyword(utils.setEvent('TEST_FLOW')).addAction(
	async (ctx, { flowDynamic, gotoFlow, state }) => {
		const user = state.get('user')
		console.log(ctx.from, '\n', user.testActual)

		if (!user.consentimientoGHQ12 && user.testActual === 'ghq12') {
            await flowDynamic(consentPrompt)
            state.update({ esperandoConsentimiento: true })
            return
        }

		 // Manejar la respuesta del consentimiento
		if (state.get('esperandoConsentimiento')) {
            if (ctx.body.toLowerCase().includes('sí, acepto')) {
                await flowDynamic('Gracias por su consentimiento. Procederemos con el cuestionario.')
                state.update({ consentimientoGHQ12: true, esperandoConsentimiento: false })
            } else if (ctx.body.toLowerCase().includes('no, no acepto')) {
                await flowDynamic('Entendido. No se aplicará el cuestionario. Gracias por su tiempo.')
                state.update({ consentimientoGHQ12: false, esperandoConsentimiento: false })
                return gotoFlow(finalFlow) // Redirigir al flujo final
            } else {
                await flowDynamic(
                    'Por favor, responda con *Sí, acepto* o *No, no acepto* para continuar.'
                )
                return
            }
        }

		// Validate procesarMensaje output
		const message = await procesarMensaje(ctx.from, ctx.body, user.testActual)

		if (!message || typeof message !== 'string') {
			console.error('Error: procesarMensaje returned an invalid value.', { message })
			await flowDynamic(
				'Ocurrió un error procesando el mensaje. Por favor, inténtelo de nuevo.'
			)
			return
		}

		await flowDynamic(message)

		if (message.includes('El cuestionario ha terminado.')) {
			if (user.testActual == 'ghq12') {
				const { infoCues, preguntasString } = await getInfoCuestionario(
					ctx.from,
					user.testActual
				)
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
				let test = await apiBack1(hist, accion)
				test = test.replace(/"/g, '') // Elimina todas las comillas

				const nuevoTest = await changeTest(ctx.from, test)
				await flowDynamic(await procesarMensaje(ctx.from, ctx.body, nuevoTest))
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
