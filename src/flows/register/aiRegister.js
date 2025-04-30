/*  ------------------------ aiBack.js ---------------------------
	Este archivo se encarga de manejar la conexion con OpenAI
    Especificamente es para las respuestas con IA
	Back se refiere a que se usará para logica interna
    Solicita el historial (para contexto) y la acción a realizar
	--------------------------------------------------------------
*/

import OpenAI from 'openai'
import { obtenerHist, saveHist, registrarUsuario, switchFlujo } from '../../queries/queries.js'
import { registerPrompt } from '../../openAi/prompts.js'

//---------------------------------------------------------------------------------------------------------

const aiRegister = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

//---------------------------------------------------------------------------------------------------------

async function register(conversationHistory, number, aceptaTratamiento = false) {
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
		}`,
	})
	const jsonRegister = await aiRegister.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: hist,
		response_format: { type: 'json_object' },
	})//Envia el hisotrial al modelo de gpt para que lo procese y devuelva un json con la informacion del usuario
	const responseJson = JSON.parse(jsonRegister.choices[0].message.content)//Convierte el JSON devuelto por gpt a objeto

	const { nombre, apellido, correo, tipoDocumento, documento } = responseJson// se desestructura la respuesta del objeto de gpt

	await registrarUsuario(nombre, apellido, correo, tipoDocumento, documento, number, aceptaTratamiento)//se llama a la funcion registrarUsuario que crea el usuario
	await switchFlujo(number, aceptaTratamiento ? 'assistantFlow' : 'finalFlow')

	return {
		success: true,
		result: responseJson,
		message: aceptaTratamiento ? 'Usuario Registrado' : 'Usuario registrado pero no acepta tratamiento de datos',
	}
}

//---------------------------------------------------------------------------------------------------------

// Definición de herramientas
const tools = [
	{
		type: 'function',
		function: {
			name: 'register',
			description: `Cuando los siguientes campos esten llenos, el usuario haya confirmado, y haya aceptado explícitamente el tratamiento de sus datos, se debe registrar el usuario:
			1. Nombres
			2. Apellidos
			3. Correo
			4. Tipo de documento (CC, TI, Pasaporte)
			5. Numero de documento
			6. Aceptación de tratamiento de datos
	`,
			parameters: {
				type: 'object',
				properties: {
					aceptaTratamiento: {
						type: 'boolean',
						description: 'Indica si el usuario acepta el tratamiento de sus datos personales',
					}
				},
				required: ['aceptaTratamiento']
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'registerRejected',
			description: `Cuando el usuario explícitamente NO acepta el tratamiento de sus datos pero ya ha brindado información personal, se debe registrar con tratamiento rechazado:
			1. Nombres
			2. Apellidos
			3. Correo
			4. Tipo de documento (CC, TI, Pasaporte)
			5. Numero de documento
	`,
			parameters: {
				type: 'object',
				properties: {}
			},
		},
	},
]

//---------------------------------------------------------------------------------------------------------

export async function apiRegister(numero, msg) {
	const conversationHistory = await obtenerHist(numero)//Obtiene el historial del usuario desde la base de datos
	conversationHistory.unshift({ role: 'system', content: registerPrompt })// Agrega el prompt de registro al inicio del historial
	conversationHistory.push({ role: 'user', content: msg }) // Agrega el mensaje del usuario al historial
	try {
		const response = await aiRegister.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: conversationHistory,
			tools: tools,
		})

		const assistantMessage = response.choices[0].message.content 
		const toolCalls = response.choices[0].message.tool_calls 

		if (toolCalls && toolCalls.length > 0) {// si hay toolCalls se guarda en la base de datos
			for (const call of toolCalls) {
				if (call.type === 'function' && call.function.name === 'register') {
					const args = JSON.parse(call.function.arguments || '{}')
					const aceptaTratamiento = args.aceptaTratamiento === true
					await register(conversationHistory, numero, aceptaTratamiento)

					let answ = ''
					if (aceptaTratamiento) {
						answ = 'Gracias por realizar tu registro y aceptar el tratamiento de tus datos. ¡Bienvenido! Estoy aquí para apoyarte en lo que necesites. Si en algún momento sientes que quieres hablar de algo o que te gustaría recibir ayuda psicológica, sólo dímelo. Mi prioridad es que te sientas bien y escuchado.'
					} else {
						answ = 'Has completado tu registro pero no has aceptado el tratamiento de tus datos. Sin esta aceptación, no podemos continuar con el proceso. Gracias por tu interés.'
					}
					conversationHistory.push({ role: 'assistant', content: answ })
					conversationHistory.shift()
					await saveHist(numero, conversationHistory)
					return answ
				} else if (call.type === 'function' && call.function.name === 'registerRejected') {
					// El usuario no acepta el tratamiento de datos pero ya proporcionó información
					await register(conversationHistory, numero, false)
					
					const answ = 'Has completado tu registro pero no has aceptado el tratamiento de tus datos. Sin esta aceptación, no podemos continuar con el proceso. Gracias por tu interés.'
					conversationHistory.push({ role: 'assistant', content: answ })
					conversationHistory.shift()
					await saveHist(numero, conversationHistory)
					return answ
				}
			}
		} else {//Si no hay ToolCalls sigue preguntando por el registro
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
