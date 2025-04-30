import OpenAI from 'openai'

const aiHorarios = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

export async function apiHorarios(msg) {
	try {
		const hist = [
			{
				role: 'system',
				content: `retorna un json con el siguiente formato: {DDD:[HH:MM,HH:MM,HH:MM]}. 
						Por ejemplo "Lunes, martes, miercoles, jueves, viernes y sabado  9 a 2" 
						retorna:
						{
							lun: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
							mar: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
							mie: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
							jue: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
							vie: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
							sab: [ "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" ],
						}
						
						ejemplo 2 "Lunes, Martes, Miercoles 1 a 5":
						retornar:
						{
							lun: [ "13:00", "14:00", "15:00", "16:00", "17:00" ],
							mar: [ "13:00", "14:00", "15:00", "16:00", "17:00" ],
							mie: [ "13:00", "14:00", "15:00", "16:00", "17:00" ],
						}

						HORARIO DE ATENCION:
						Entre semana: 08:00 - 17:00
						Sabado: 08:00 - 11:00

						Nota: ignora las tildes (en caso de miercoles: 'mie')
						Importante: Hazlo en formato 24 horas.
						teniendo en cuenta que el horario laboral va desde las 06:00 a las 18:00 de lunes a sabado (ignora los domingos)
						Si el dia está vacio, significa que puede todo el dia (dentro del horario de atencion 8:00 - 17:00)
						Si el array del horario está vacio no pongas el dia`,
			},
		]

		hist.push({ role: 'user', content: msg })

		const completion = await aiHorarios.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: hist,
			response_format: { type: 'json_object' },
		})

		let responseHorarios = completion.choices[0].message.content
		responseHorarios = JSON.parse(responseHorarios)
		return responseHorarios
	} catch (error) {
		console.error('Error en la API de OpenAI:', error.message)
		throw new Error('Hubo un problema al obtener la respuesta de la IA.')
	}
}
