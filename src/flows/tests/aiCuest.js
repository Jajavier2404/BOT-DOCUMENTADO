/*  ------------------------ aiCuest.js ----------------------------
	Este archivo se encarga de validar si dentro del cuestionario
	se digita alguna opcion de respuesta en el mensaje de whatsapp
	---------------------------------------------------------------
*/

export function apiCuest(msg, test) {
	switch (test) {
		case 'ghq12':
			if (msg.includes('1')) {
				return 1
			} else if (msg.includes('2')) {
				return 2
			} else if (msg.includes('3')) {
				return 3
			} else if (msg.includes('0')) {
				return 0
			} else {
				return 9
			}
		case 'dep':
			if (msg.includes('1')) {
				return 1
			} else if (msg.includes('2')) {
				return 2
			} else if (msg.includes('3')) {
				return 3
			} else if (msg.includes('0')) {
				return 0
			} else {
				return 9
			}
		case 'ans':
			if (msg.includes('1')) {
				return 1
			} else if (msg.includes('2')) {
				return 2
			} else if (msg.includes('3')) {
				return 3
			} else if (msg.includes('0')) {
				return 0
			} else {
				return 9
			}
		case 'estr':
			if (msg.includes('1')) {
				return 1
			} else if (msg.includes('2')) {
				return 2
			} else if (msg.includes('3')) {
				return 3
			} else if (msg.includes('4')) {
				return 4
			} else if (msg.includes('0')) {
				return 0
			} else {
				return 9
			}
		case 'calvida':
			if (msg.includes('1')) {
				return 1
			} else if (msg.includes('2')) {
				return 2
			} else if (msg.includes('3')) {
				return 3
			} else if (msg.includes('4')) {
				return 4
			} else if (msg.includes('5')) {
				return 5
			} else {
				return 9
			}
		case 'suic':
			if (msg.includes('1')) {
				return 1
			} else if (msg.includes('2')) {
				return 2
			} else if (msg.includes('0')) {
				return 0
			} else {
				return 9
			}
	}
}
