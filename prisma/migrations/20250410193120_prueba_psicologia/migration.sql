-- CreateTable
CREATE TABLE `informacionUsuario` (
    `idUsuario` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NULL,
    `apellido` VARCHAR(191) NULL,
    `correo` VARCHAR(191) NULL,
    `telefonoPersonal` VARCHAR(191) NOT NULL,
    `documento` VARCHAR(191) NULL,
    `tipoDocumento` VARCHAR(191) NOT NULL DEFAULT 'CC',
    `testActual` VARCHAR(191) NOT NULL DEFAULT 'ghq12',
    `motivo` VARCHAR(191) NULL,
    `ayudaPsicologica` INTEGER NOT NULL DEFAULT 1,
    `tratDatos` BOOLEAN NOT NULL DEFAULT false,
    `historial` JSON NULL,
    `flujo` VARCHAR(191) NOT NULL DEFAULT 'register',
    `practicanteAsignado` VARCHAR(191) NULL,
    `disponibilidad` JSON NOT NULL,

    UNIQUE INDEX `informacionUsuario_idUsuario_key`(`idUsuario`),
    UNIQUE INDEX `informacionUsuario_correo_key`(`correo`),
    UNIQUE INDEX `informacionUsuario_telefonoPersonal_key`(`telefonoPersonal`),
    UNIQUE INDEX `informacionUsuario_documento_key`(`documento`),
    PRIMARY KEY (`idUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ghq12` (
    `idGhq12` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `historial` JSON NULL,
    `Puntaje` INTEGER NOT NULL DEFAULT 0,
    `preguntaActual` INTEGER NOT NULL DEFAULT 0,
    `resPreg` JSON NULL,

    UNIQUE INDEX `ghq12_idGhq12_key`(`idGhq12`),
    UNIQUE INDEX `ghq12_telefono_key`(`telefono`),
    PRIMARY KEY (`idGhq12`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tests` (
    `idTests` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `tratDatos` VARCHAR(191) NOT NULL DEFAULT '',
    `historial` JSON NULL,
    `Puntaje` INTEGER NOT NULL DEFAULT 0,
    `preguntaActual` INTEGER NOT NULL DEFAULT 0,
    `resPreg` JSON NULL,

    UNIQUE INDEX `tests_idTests_key`(`idTests`),
    UNIQUE INDEX `tests_telefono_key`(`telefono`),
    PRIMARY KEY (`idTests`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultorio` (
    `idConsultorio` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `consultorio_idConsultorio_key`(`idConsultorio`),
    PRIMARY KEY (`idConsultorio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `practicante` (
    `idPracticante` VARCHAR(191) NOT NULL,
    `numero_documento` VARCHAR(191) NOT NULL,
    `tipo_documento` VARCHAR(191) NOT NULL DEFAULT 'CC',
    `nombre` VARCHAR(191) NOT NULL,
    `genero` VARCHAR(191) NOT NULL,
    `estrato` VARCHAR(191) NOT NULL,
    `barrio` VARCHAR(191) NOT NULL,
    `localidad` VARCHAR(191) NOT NULL,
    `horario` JSON NOT NULL,

    UNIQUE INDEX `practicante_idPracticante_key`(`idPracticante`),
    UNIQUE INDEX `practicante_numero_documento_key`(`numero_documento`),
    PRIMARY KEY (`idPracticante`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cita` (
    `idCita` VARCHAR(191) NOT NULL,
    `idConsultorio` VARCHAR(191) NOT NULL,
    `idUsuario` VARCHAR(191) NOT NULL,
    `idPracticante` VARCHAR(191) NOT NULL,
    `fechaHora` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `cita_idCita_key`(`idCita`),
    PRIMARY KEY (`idCita`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ghq12` ADD CONSTRAINT `ghq12_telefono_fkey` FOREIGN KEY (`telefono`) REFERENCES `informacionUsuario`(`telefonoPersonal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tests` ADD CONSTRAINT `tests_telefono_fkey` FOREIGN KEY (`telefono`) REFERENCES `informacionUsuario`(`telefonoPersonal`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_idConsultorio_fkey` FOREIGN KEY (`idConsultorio`) REFERENCES `consultorio`(`idConsultorio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `informacionUsuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cita` ADD CONSTRAINT `cita_idPracticante_fkey` FOREIGN KEY (`idPracticante`) REFERENCES `practicante`(`idPracticante`) ON DELETE RESTRICT ON UPDATE CASCADE;
