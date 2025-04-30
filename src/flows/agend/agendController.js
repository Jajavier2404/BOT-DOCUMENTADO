// model informacionUsuario {
//     practicanteAsignado String? // ID del practicante asignado permanentemente
//   }
//IMPORTANTE CREAR ESPACIO PARA EL ID DEL PRACTICANTE EN LA INFO DEL USUARIO!!!!

import { prisma } from '../../queries/queries.js'

export async function controladorAgendamiento(datosUsuario) {
	try {
		const horarioUsuario = datosUsuario.disponibilidad
		console.log(horarioUsuario)

		let practicanteSeleccionado
		let horarioCoincidente

		// Verificar si el usuario ya tiene practicante asignado
		if (datosUsuario.practicanteAsignado) {
			// Buscar horarios con el practicante asignado
			practicanteSeleccionado = await prisma.practicante.findUnique({
				where: { idPracticante: datosUsuario.practicanteAsignado },
			})

			if (!practicanteSeleccionado) {
				throw new Error('Practicante asignado no encontrado')
			}

			const horarioPracticante = practicanteSeleccionado.horario
			const coincidencias = encontrarHorariosCoincidentes(horarioUsuario, horarioPracticante)

			if (coincidencias.length > 0) {
				horarioCoincidente = coincidencias[0]
			} else {
				throw new Error('No hay horarios disponibles con el practicante asignado')
			}
		} else {
			// Buscar nuevo practicante disponible
			const practicantes = await prisma.practicante.findMany()

			for (const practicante of practicantes) {
				const horarioPracticante = practicante.horario
				const coincidencias = encontrarHorariosCoincidentes(
					horarioUsuario,
					horarioPracticante
				)

				if (coincidencias.length > 0) {
					practicanteSeleccionado = practicante
					horarioCoincidente = coincidencias[0]

					// Asignar practicante al usuario de forma permanente
					await prisma.informacionUsuario.update({
						where: { idUsuario: datosUsuario.idUsuario },
						data: {
							practicanteAsignado: practicante.idPracticante,
						},
					})

					break
				}
			}
		}

		if (!practicanteSeleccionado || !horarioCoincidente) {
			throw new Error('No se encontró disponibilidad con ningún practicante')
		}

		// Buscar consultorio disponible
		const consultorios = await prisma.consultorio.findMany({
			where: { activo: true },
		})

		let consultorioSeleccionado = null
		for (const consultorio of consultorios) {
			const citasExistentes = await prisma.cita.findMany({
				where: {
					idConsultorio: consultorio.idConsultorio,
					fechaHora: `${horarioCoincidente.dia} ${horarioCoincidente.horas[0]}`,
				},
			})

			if (citasExistentes.length === 0) {
				consultorioSeleccionado = consultorio
				break
			}
		}

		if (!consultorioSeleccionado) {
			throw new Error('No hay consultorios disponibles')
		}

		// Crear la cita y actualizar disponibilidad del practicante
		const nuevaCita = await prisma.cita.create({
			data: {
				idUsuario: datosUsuario.idUsuario,
				idPracticante: practicanteSeleccionado.idPracticante,
				idConsultorio: consultorioSeleccionado.idConsultorio,
				fechaHora: `${horarioCoincidente.dia} ${horarioCoincidente.horas[0]}`,
			},
		})

		// Actualizar horario del practicante
		const horarioPracticanteActualizado = practicanteSeleccionado.horario
		const horaIndex = horarioPracticanteActualizado[horarioCoincidente.dia].indexOf(
			horarioCoincidente.horas[0]
		)
		if (horaIndex > -1) {
			horarioPracticanteActualizado[horarioCoincidente.dia].splice(horaIndex, 1)
		}

		await prisma.practicante.update({
			where: { idPracticante: practicanteSeleccionado.idPracticante },
			data: {
				horario: horarioPracticanteActualizado,
			},
		})

		return {
			success: true,
			cita: {
				...nuevaCita,
				practicante: {
					nombre: practicanteSeleccionado.nombre,
					idPracticante: practicanteSeleccionado.idPracticante,
				},
				consultorio: {
					nombre: consultorioSeleccionado.nombre,
					idConsultorio: consultorioSeleccionado.idConsultorio,
				},
			},
			esPrimeraCita: !datosUsuario.practicanteAsignado,
		}
	} catch (error) {
		console.error('Error en agendamiento:', error)
		throw error
	}
}

function encontrarHorariosCoincidentes(horarioUsuario, horarioPracticante) {
	const horariosCoincidentes = []

	for (const dia in horarioUsuario) {
		if (horarioPracticante[dia]) {
			const horasCoincidentes = horarioUsuario[dia].filter((hora) =>
				horarioPracticante[dia].includes(hora)
			)

			if (horasCoincidentes.length > 0) {
				horariosCoincidentes.push({
					dia,
					horas: horasCoincidentes,
				})
			}
		}
	}

	return horariosCoincidentes
}
