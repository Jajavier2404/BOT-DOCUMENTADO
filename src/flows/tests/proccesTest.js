/*  ------------------------ processMensaje.js ------------------------
	Este archivo se encarga de manejar la logica del flujo de mensajes
	para el tratamiento de datos y cuestionarios de la aplicacion
	Aca se hacen varias validaciones para llevar al usuario al 
	Cuestionario correspondiente.
	--------------------------------------------------------------------
*/
import axios from 'axios'
import { iniciarCuestionario } from './cuestionario.js'
let esPrimeraVez = true
let esPrimeraVez1 = true
const mensajesTest = {
	ghq12: 'A continuación, te presentaremos el cuestionario GHQ-12. Es una forma sencilla de conocer un poco mejor cómo te has sentido en las últimas dos semanas. Tus respuestas son muy valiosas para nosotros y, por supuesto, serán tratadas con total confidencialidad.',
	dep: 'Te invitamos a completar el Inventario de Depresión de Beck (BDI-2). Este cuestionario te ayudará a describir cómo te has sentido últimamente. Recuerda, tus respuestas son confidenciales y nos servirán para entenderte mejor.',
	ans: 'El Inventario de Ansiedad de Beck (BAI) te permitirá compartir cómo la ansiedad ha influido en tu vida en la última semana. Tus respuestas son importantes para nosotros y serán tratadas con el cuidado que merecen.',
	estr: 'Te presentaremos el Inventario de Estrés de escala percibida. Queremos saber cómo has vivido el estrés en el último mes. Tus respuestas son confidenciales y nos ayudarán a comprender tu experiencia.',
	calvida:
		'Este cuestionario te permitirá reflexionar sobre tu calidad de vida. Tus respuestas son muy importantes para nosotros y nos ayudarán a conocerte mejor.',
	suic: 'La Escala de Ideación Suicida es una herramienta que nos ayudará a comprender tus pensamientos y sentimientos. Recuerda, no estás solo y tus respuestas serán tratadas con la mayor confidencialidad.',
}

export async function procesarMensaje(numeroUsuario, mensaje, tipoTest) {
	console.log(tipoTest)
	if (esPrimeraVez1 == true && tipoTest != 'ghq12') {
		esPrimeraVez1 = false

		await axios.post('http://localhost:3000/v1/messages', {
			number: numeroUsuario,
			message: mensajesTest[tipoTest],
		})
	}

	if (esPrimeraVez) {
		esPrimeraVez = false

		await axios.post('http://localhost:3000/v1/messages', {
			number: numeroUsuario,
			message: mensajesTest[tipoTest],
		})
	}

	return await iniciarCuestionario(numeroUsuario, mensaje, tipoTest) // Responder al usuario con el resultado del cuestionario
}
