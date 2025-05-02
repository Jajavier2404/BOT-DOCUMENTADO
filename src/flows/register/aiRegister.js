/*  ------------------------ aiBack.js ---------------------------
	Este archivo se encarga de manejar la conexion con OpenAI
    Especificamente es para las respuestas con IA
	Back se refiere a que se usará para logica interna
    Solicita el historial (para contexto) y la acción a realizar
	--------------------------------------------------------------
*/

import OpenAI from 'openai'
import { obtenerHist, saveHist, registrarUsuario, switchFlujo } from '../../queries/queries.js'
import { registerPrompt, } from '../../openAi/prompts.js'

//---------------------------------------------------------------------------------------------------------

const aiRegister = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

//---------------------------------------------------------------------------------------------------------

async function register(conversationHistory, number) {
	const hist = [...conversationHistory]
	hist.shift()
	hist.push({
		role: 'system',
		content: `Extrae en formato json la informacion del usuario con este formato:
		{
		"nombre":"",
		"apellido":"",
		"correo":"",
		"tipoDocumento":"",
		"documento":"",
		"tratDatos": true
		}`,
	})
	const jsonRegister = await aiRegister.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: hist,
		response_format: { type: 'json_object' },
	})
	const responseJson = JSON.parse(jsonRegister.choices[0].message.content)

	const { nombre, apellido, correo, tipoDocumento, documento,tratDatos } = responseJson

	await registrarUsuario(nombre, apellido, correo, tipoDocumento, documento,tratDatos, number)
	await switchFlujo(number, 'assistantFlow')

	return {
		success: true,
		result: responseJson,
		message: 'Usuario Registrado',
	}
}

//---------------------------------------------------------------------------------------------------------

// Definición de herramientas
const tools = [
	{
		type: 'function',
		function: {
			name: 'register',
			description: `Cuando los siguientes campos esten llenos y el usuario haya confirmado, se debe registrar el usuario:
			1. Nombres
			2. Apellidos
			3. Correo
			4. Tipo de documento (CC, TI, Pasaporte)
			5. Numero de documento
			6. Consentimiento explícito para el tratamiento de datos personales

			IMPORTANTE: El registro solo debe realizarse cuando el usuario haya aceptado explícitamente el tratamiento de sus datos personales.
	`,
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
]

//---------------------------------------------------------------------------------------------------------

export async function apiRegister(numero, msg) {
	const conversationHistory = await obtenerHist(numero)
	conversationHistory.unshift({ role: 'system', content: registerPrompt })
	conversationHistory.push({ role: 'user', content: msg })
	try {
		const response = await aiRegister.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: conversationHistory,
			tools: tools,
		})

		const assistantMessage = response.choices[0].message.content
		const toolCalls = response.choices[0].message.tool_calls

		if (toolCalls && toolCalls.length > 0) {
			for (const call of toolCalls) {
				if (call.type === 'function' && call.function.name === 'register') {
					await register(conversationHistory, numero)

					const answ =
						'Gracias por realizar tu registro.  Bienvenido! Estoy aquí para apoyarte en lo que necesites. Si en algún momento sientes que quieres hablar de algo o que te gustaría recibir ayuda psicológica, sólo dímelo. Mi prioridad es que te sientas bien y escuchado. '
					conversationHistory.push({ role: 'assistant', content: answ })
					conversationHistory.shift()
					await saveHist(numero, conversationHistory)
					return answ
				}
			}
		} else {
			conversationHistory.push({ role: 'assistant', content: assistantMessage })
			conversationHistory.shift()
			await saveHist(numero, conversationHistory)
			return assistantMessage
		}
	} catch (error) {
		console.error('Error al obtener la respuesta de OpenAI:', error)
		throw new Error('Hubo un error al procesar la solicitud.')
	}
}

//---------------------------------------------------------------------------------------------------------
