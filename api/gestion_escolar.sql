-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 04-06-2026 a las 07:11:54
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `gestion_escolar`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comentario`
--

CREATE TABLE `comentario` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `comentario` text NOT NULL,
  `fecha` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `comentario`
--

INSERT INTO `comentario` (`id`, `estudiante_id`, `materia_id`, `comentario`, `fecha`) VALUES
(1, 2, 1, 'pongame uno profe', '2026-06-01 01:47:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiante`
--

CREATE TABLE `estudiante` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `identificacion` varchar(20) NOT NULL,
  `grado` varchar(10) DEFAULT NULL,
  `seccion` varchar(10) DEFAULT NULL,
  `password_inicial` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiante`
--

INSERT INTO `estudiante` (`id`, `nombre`, `email`, `identificacion`, `grado`, `seccion`, `password_inicial`) VALUES
(2, 'Escott Pilgrim', 'escotpilgrim@gmail.com', '9021', '10°', 'B', 'asucar');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materia`
--

CREATE TABLE `materia` (
  `id` int(11) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `creditos` int(11) DEFAULT 3,
  `profesor_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `materia`
--

INSERT INTO `materia` (`id`, `codigo`, `nombre`, `creditos`, `profesor_id`) VALUES
(1, 'CN01', 'Ciencias Naturales', 3, 1),
(2, 'ESP01', 'Español', 3, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `matricula`
--

CREATE TABLE `matricula` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `fecha_asignacion` date DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `matricula`
--

INSERT INTO `matricula` (`id`, `estudiante_id`, `materia_id`, `fecha_asignacion`) VALUES
(1, 2, 1, '2026-06-01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `nota`
--

CREATE TABLE `nota` (
  `id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `profesor_id` int(11) NOT NULL,
  `tipo` enum('parcial','taller','tarea') NOT NULL,
  `puntaje` decimal(3,1) NOT NULL CHECK (`puntaje` >= 1.0 and `puntaje` <= 5.0),
  `trimestre` enum('I Trimestre','II Trimestre','III Trimestre') NOT NULL,
  `comentario` varchar(255) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `nota`
--

INSERT INTO `nota` (`id`, `estudiante_id`, `materia_id`, `profesor_id`, `tipo`, `puntaje`, `trimestre`, `comentario`, `fecha_registro`) VALUES
(1, 2, 1, 1, 'taller', 4.6, 'I Trimestre', 'prueba', '2026-06-01 01:40:52'),
(2, 2, 1, 1, 'parcial', 3.4, 'I Trimestre', 'Revisar la ultima parte', '2026-06-01 01:42:11'),
(3, 2, 1, 1, 'parcial', 3.4, 'I Trimestre', 'No leyó jajajaja', '2026-06-03 22:38:39'),
(4, 2, 1, 1, 'taller', 4.6, 'I Trimestre', NULL, '2026-06-03 22:38:53'),
(5, 2, 1, 1, 'tarea', 5.0, 'I Trimestre', NULL, '2026-06-03 22:38:59'),
(6, 2, 1, 1, 'tarea', 5.0, 'I Trimestre', NULL, '2026-06-03 22:39:05'),
(7, 2, 1, 1, 'tarea', 3.7, 'I Trimestre', 'Faltó información', '2026-06-03 22:39:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `nota_auditoria`
--

CREATE TABLE `nota_auditoria` (
  `id` int(11) NOT NULL,
  `nota_id` int(11) NOT NULL,
  `editor_id` int(11) NOT NULL,
  `puntaje_anterior` decimal(3,1) NOT NULL,
  `puntaje_nuevo` decimal(3,1) NOT NULL,
  `fecha_cambio` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesor`
--

CREATE TABLE `profesor` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `identificacion` varchar(20) NOT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `password_inicial` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `profesor`
--

INSERT INTO `profesor` (`id`, `nombre`, `email`, `identificacion`, `especialidad`, `password_inicial`) VALUES
(1, 'Jose Tobares', 'profesorTobares@gmail.com', '7070', 'Ciencias ', 'sal');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesion`
--

CREATE TABLE `sesion` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `activa` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sesion`
--

INSERT INTO `sesion` (`id`, `usuario_id`, `token`, `expires_at`, `activa`, `created_at`) VALUES
(1, 1, '57f1d273e076537341dcae1883ebcb38b23d91b76b0fb2a7010ba4738c853541', '2026-06-01 15:56:01', 0, '2026-06-01 00:56:01'),
(2, 1, '454795a074fad7adb2507e1ab890951a1df1f778c08b785db3d21bc0ca6eaf56', '2026-06-01 15:56:01', 0, '2026-06-01 00:56:01'),
(3, 1, 'eb945f99eb89358b794e0007659ae32cbf9b578dffeb54612db565d1648a9073', '2026-06-01 16:11:45', 0, '2026-06-01 01:11:45'),
(4, 1, '3dc4f647588b30f4a2e2a1f6ceb3e6e21fa8b72d156b76ff2a2f7084e7369aa1', '2026-06-01 16:32:47', 0, '2026-06-01 01:32:47'),
(5, 3, 'ca47a2ec4abc010896055d3443b1066515f296b6e71a4f059f9ed46f69f9c9eb', '2026-06-01 16:39:46', 0, '2026-06-01 01:39:46'),
(6, 2, '32716c4ae37a84af8357561dee19f9e3099838a8603ab0bc8adca5a122bcfb47', '2026-06-01 16:43:13', 0, '2026-06-01 01:43:13'),
(7, 1, '77ad81371d47b6c8d60890769396c87480c95df5200572553329047caf336a02', '2026-06-01 16:59:50', 0, '2026-06-01 01:59:50'),
(8, 1, 'aa50f1542ad1ce81bfdaccc0c48036a33857748a56e08320489ddf645a9b758f', '2026-06-02 12:15:28', 0, '2026-06-01 21:15:28'),
(9, 2, 'f59eed8ec7c7f051921e7892f2c62288df27bb6fb82f951a729c697a225a8316', '2026-06-02 12:18:23', 0, '2026-06-01 21:18:23'),
(10, 1, '0cf1697377b49fc1e3a5e1cf332832dfb8f4814861317280b41ec78ecefc30ea', '2026-06-02 12:21:52', 0, '2026-06-01 21:21:52'),
(11, 1, 'bbd32166ae99aea210896a4818bbb5266e43eb002ecf5ecb045bcdfe5014401f', '2026-06-03 04:28:28', 0, '2026-06-02 13:28:28'),
(12, 2, '975d7600a58383d13979b0cf2e8edef50841bca9b41b2b1a98614b5c4de42386', '2026-06-03 04:39:01', 0, '2026-06-02 13:39:01'),
(13, 3, '549fb953f6ba529903823c2e7d2cfd04ebbe6b39be84190bb63d5e79353a9ab8', '2026-06-03 04:49:14', 0, '2026-06-02 13:49:14'),
(14, 1, 'd94989819fa3228e34221222af8fe353abbd86aa2825a3ab40f981ef2ecb6bdb', '2026-06-03 04:49:36', 0, '2026-06-02 13:49:36'),
(15, 1, 'b78f72d40ab53b524393c87fd35bcef62a2c5935b90931d11584d30a63ebdff6', '2026-06-04 08:16:06', 0, '2026-06-03 17:16:06'),
(16, 1, 'f7b2df69368a648220536758e9418c0c19dda8bda955e69989547f8a3fb28b57', '2026-06-04 08:32:29', 0, '2026-06-03 17:32:29'),
(17, 1, '0648833853c6c5d190221cf93436cc124a14fa8e3462a7ab6cd2b2a359542b5d', '2026-06-04 08:44:21', 0, '2026-06-03 17:44:21'),
(18, 2, '19093ec33bde43bdcd82d69a73e996d301e7f1bc28de566839b46464dea6c511', '2026-06-04 08:58:46', 0, '2026-06-03 17:58:46'),
(19, 1, 'e74166cce1eaabe53a7427957255f6139a133191f51557a7cf2ba54512d6eae0', '2026-06-04 09:04:52', 0, '2026-06-03 18:04:52'),
(20, 2, '6d0208525a0ce96937252677d29c71255a7fe18f4b351e822483e1c9dd317d30', '2026-06-04 09:05:42', 0, '2026-06-03 18:05:42'),
(21, 1, '3ac209e36d92d796b5ccf7bd742087bd7292196233966e76152c127b147dbbdf', '2026-06-04 09:06:00', 0, '2026-06-03 18:06:00'),
(22, 1, '2bfef502e318db63df51634c94e87acf0bad370ef093e0c30afbaaa6e41dd29d', '2026-06-04 09:30:01', 0, '2026-06-03 18:30:01'),
(23, 1, '007493b57b2065b6a7cda57d4bf18732fff305f7bc7e27082cd6f5144b89e2e0', '2026-06-04 13:24:56', 0, '2026-06-03 22:24:56'),
(24, 2, '71aafdcd2fb4cea4ca0ab2eead3efc02dd169eb9784d3abd0d67705cd900a9dc', '2026-06-04 13:33:15', 0, '2026-06-03 22:33:15'),
(25, 1, '34b6a70ceac6369fe8ffd371ca315d566c605e85e2af47917dea7fd18500766e', '2026-06-04 13:36:52', 0, '2026-06-03 22:36:52'),
(26, 3, 'eee328dbb11bdca305206d533b8b075594e41d0f9222cd9a604043c7c6296496', '2026-06-04 13:37:16', 0, '2026-06-03 22:37:16'),
(27, 2, '6180436a661f4595737a151c8a589bc8b49e46f22bb07a7895d845e6a75cc667', '2026-06-04 13:42:21', 0, '2026-06-03 22:42:21'),
(28, 1, 'eeb6adacbcda3182afe90e3e457bafb1f6e78a8975f81986e7ed59cf3fb28e6a', '2026-06-04 13:45:01', 0, '2026-06-03 22:45:01'),
(29, 1, '76cbabb38f24f3e77937ec6d831982902d14075c870db1affd6c53cb4c0d20a5', '2026-06-04 13:57:25', 0, '2026-06-03 22:57:25'),
(30, 1, 'b079c610544c39804796f0b15a9dbc22e784db1c4c00a0f13b997f31a2eee226', '2026-06-04 15:11:11', 1, '2026-06-04 00:11:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','profesor','estudiante') NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `id_referencia` int(11) DEFAULT NULL,
  `password_cambiada` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id`, `email`, `password_hash`, `rol`, `nombre`, `id_referencia`, `password_cambiada`) VALUES
(1, 'admin@escuela.edu', '$2y$12$kxBNnam4GaKdpVnunJzqJej6KM4DqLtt9czVJH3YcIC.tjI4U6YTy', 'admin', 'Administrador', NULL, 0),
(2, 'escotpilgrim@gmail.com', '$2y$12$zTB/newMGZwUfB2nvGTKYeA4z55MEEmkWxsWLtvQwOjXMnQ2gCEOG', 'estudiante', 'Escott Pilgrim', 2, 0),
(3, 'profesorTobares@gmail.com', '$2y$12$krM6fLObOqTBpdrpoYsUIOjJykdIJy/O2RHOxsHczHDKnyeTCZVYK', 'profesor', 'Jose Tobares', 1, 0);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `comentario`
--
ALTER TABLE `comentario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_estudiante` (`estudiante_id`),
  ADD KEY `idx_materia` (`materia_id`);

--
-- Indices de la tabla `estudiante`
--
ALTER TABLE `estudiante`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `identificacion` (`identificacion`);

--
-- Indices de la tabla `materia`
--
ALTER TABLE `materia`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `profesor_id` (`profesor_id`);

--
-- Indices de la tabla `matricula`
--
ALTER TABLE `matricula`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_matricula` (`estudiante_id`,`materia_id`),
  ADD KEY `materia_id` (`materia_id`);

--
-- Indices de la tabla `nota`
--
ALTER TABLE `nota`
  ADD PRIMARY KEY (`id`),
  ADD KEY `estudiante_id` (`estudiante_id`),
  ADD KEY `materia_id` (`materia_id`),
  ADD KEY `profesor_id` (`profesor_id`);

--
-- Indices de la tabla `nota_auditoria`
--
ALTER TABLE `nota_auditoria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nota_id` (`nota_id`),
  ADD KEY `editor_id` (`editor_id`);

--
-- Indices de la tabla `profesor`
--
ALTER TABLE `profesor`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `identificacion` (`identificacion`);

--
-- Indices de la tabla `sesion`
--
ALTER TABLE `sesion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `comentario`
--
ALTER TABLE `comentario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `estudiante`
--
ALTER TABLE `estudiante`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `materia`
--
ALTER TABLE `materia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `matricula`
--
ALTER TABLE `matricula`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `nota`
--
ALTER TABLE `nota`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `nota_auditoria`
--
ALTER TABLE `nota_auditoria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `profesor`
--
ALTER TABLE `profesor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `sesion`
--
ALTER TABLE `sesion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `comentario`
--
ALTER TABLE `comentario`
  ADD CONSTRAINT `comentario_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comentario_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `materia`
--
ALTER TABLE `materia`
  ADD CONSTRAINT `materia_ibfk_1` FOREIGN KEY (`profesor_id`) REFERENCES `profesor` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `matricula`
--
ALTER TABLE `matricula`
  ADD CONSTRAINT `matricula_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante` (`id`),
  ADD CONSTRAINT `matricula_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`);

--
-- Filtros para la tabla `nota`
--
ALTER TABLE `nota`
  ADD CONSTRAINT `nota_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiante` (`id`),
  ADD CONSTRAINT `nota_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materia` (`id`),
  ADD CONSTRAINT `nota_ibfk_3` FOREIGN KEY (`profesor_id`) REFERENCES `profesor` (`id`);

--
-- Filtros para la tabla `nota_auditoria`
--
ALTER TABLE `nota_auditoria`
  ADD CONSTRAINT `nota_auditoria_ibfk_1` FOREIGN KEY (`nota_id`) REFERENCES `nota` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nota_auditoria_ibfk_2` FOREIGN KEY (`editor_id`) REFERENCES `profesor` (`id`);

--
-- Filtros para la tabla `sesion`
--
ALTER TABLE `sesion`
  ADD CONSTRAINT `sesion_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
