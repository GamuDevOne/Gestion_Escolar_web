-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 13-06-2026 a las 23:55:50
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
(2, 'Escott Pilgrim', 'escotpilgrim@gmail.com', '9021', '10°', 'B', 'asucar'),
(3, 'Estudiante 1', 'estudiante1@gmail.com', '810028790', '12°', 'C', 'Il4z8'),
(4, 'Asia', 'Asia@gmai.com', '12435', '10°', 'B', '4wIw8'),
(5, 'Emily Flores', 'emilyflores@gmail.com', '8509987', '9°', 'D', 'WUcmfY'),
(6, 'Rober Limerio', 'robertlime@gmail.com', '89032100', '10°', 'B', 'Ruwn0Q'),
(7, 'Sonia Paredes', 'soniap@gmail.com', '86443211', '10°', 'D', 'NfUMDM');

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
(2, 'ESP01', 'Español', 3, 4),
(3, 'FIS01', 'Física', 3, 2),
(4, 'GEO01', 'Geografía', 3, 3);

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
(1, 2, 1, '2026-06-01'),
(2, 4, 1, '2026-06-11'),
(3, 4, 3, '2026-06-11');

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
-- Estructura de tabla para la tabla `pregunta_seguridad`
--

CREATE TABLE `pregunta_seguridad` (
  `id` int(11) NOT NULL,
  `pregunta` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pregunta_seguridad`
--

INSERT INTO `pregunta_seguridad` (`id`, `pregunta`) VALUES
(1, '¿Cuál es el nombre de tu primera mascota?'),
(2, '¿En qué ciudad naciste?'),
(3, '¿Cuál es el apellido de tu madre?'),
(4, '¿Cuál fue el nombre de tu primera escuela?'),
(5, '¿Cuál es tu comida favorita?'),
(6, '¿Cuál es el nombre de tu mejor amigo de infancia?'),
(7, '¿Cuál fue tu primer número de teléfono?'),
(8, '¿Cuál es el modelo de tu primer auto?');

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
(1, 'Jose Tobares', 'profesorTobares@gmail.com', '7070', 'Ciencias ', 'sal'),
(2, 'Profe 1', 'profe1@gmail.com', '8675489', 'Física', 'EwjYG'),
(3, 'Julio Perez', 'julioperez@gmail.com', '890904667', 'Geografia', 'VIiB6R'),
(4, 'Penelope Bonswit', 'penelopeb@gmail.com', '8567876', 'Comunicación oral y escrita', 'DQeoqF');

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
(30, 1, 'b079c610544c39804796f0b15a9dbc22e784db1c4c00a0f13b997f31a2eee226', '2026-06-04 15:11:11', 0, '2026-06-04 00:11:11'),
(31, 1, 'cf00e9d895a48a2a3ed3b09ec58ee2e4d08c2a945def780d5dd3a6529531aa01', '2026-06-04 15:22:03', 0, '2026-06-04 00:22:03'),
(32, 1, '62530f2b4a34bb868d845cbddc2079a786d53826153b97f814bc3f854dd625ec', '2026-06-04 15:24:52', 0, '2026-06-04 00:24:52'),
(33, 1, 'eb82645ce333c9b75551ca896c7fece2ebf8a32bf8f8d38c36a1e08370280989', '2026-06-04 15:45:24', 0, '2026-06-04 00:45:24'),
(34, 3, '063c8c2f572ff30446e76696bb088159d9a8af2f05996de7d15d596495ede23a', '2026-06-04 15:46:11', 0, '2026-06-04 00:46:11'),
(35, 3, 'f445deab638a70ee0e3d904d11f3d345ba99d60d6b641dabbb2abde53264e75f', '2026-06-04 15:48:19', 0, '2026-06-04 00:48:19'),
(36, 2, '5ed83491522366a8b024859850b5b7b91d4a115e8326c659246f8c979089bbcc', '2026-06-04 15:48:56', 0, '2026-06-04 00:48:56'),
(37, 1, 'c9dfc96b42def64e3e7a75d88d1b51222dc9c742107452588f1feb2129f6ced1', '2026-06-04 15:51:57', 0, '2026-06-04 00:51:57'),
(38, 1, '60050f875f17dbd837fa1d42ade5286c9c7f3123839e1fa3b2a3ffe565a3cbac', '2026-06-04 16:53:47', 0, '2026-06-04 01:53:47'),
(39, 2, '75affb536758df6ee50341624a10a76fa0c65debaec75d5f770fd03b702460f0', '2026-06-04 16:57:01', 0, '2026-06-04 01:57:01'),
(40, 3, '727b2397cf5220a35bde666b055a8aa95220df46469f406b477c96a19b1aa9e4', '2026-06-04 16:58:39', 0, '2026-06-04 01:58:39'),
(41, 1, 'd3aa4524b6d8dace8e9be407d1727d9439648f5603fcc2eadd75bba31e474ae2', '2026-06-05 09:22:41', 0, '2026-06-04 18:22:41'),
(42, 2, '24abdb949b1f077ee05e8d4cdc8d55ead9854e66bbc9bff2ff56715c49d9f55b', '2026-06-05 09:24:03', 0, '2026-06-04 18:24:03'),
(43, 3, '9c0cb26fa573f7ca53a1db3cab9027c78386b5362da02bd8d318e568193b3a22', '2026-06-05 09:41:14', 0, '2026-06-04 18:41:14'),
(44, 1, '33b877eedf678da21e6616cf749865c4a4e41ea50da9557151fb72cdf28cf88f', '2026-06-05 09:49:38', 0, '2026-06-04 18:49:38'),
(45, 1, '3affeffb7bc716ec8c0bba4348bb53ec26e1a82c50b577ba6e4c104b1dcc8d87', '2026-06-05 10:27:00', 0, '2026-06-04 19:27:00'),
(46, 2, '343a3b21ac0773ab8926fdac36d563ea3df623f10596e60fb39177b8d5f1d6b4', '2026-06-05 10:48:41', 0, '2026-06-04 19:48:41'),
(47, 1, 'a43050b56208c9fc546e8b2c6c15fe5a40b89f338945f06631f143ba785b7f1e', '2026-06-05 10:51:43', 0, '2026-06-04 19:51:43'),
(48, 1, '6a709446d71a921dfb77ca49548b70544d2d336b63fe0544ade20ca37b0cb8f3', '2026-06-08 07:05:17', 0, '2026-06-07 16:05:17'),
(49, 2, 'dd5d02d88b0b404feeffb34bdced8e95244fe40909eaca9ed47219f298411c2e', '2026-06-12 10:41:23', 0, '2026-06-11 19:41:23'),
(50, 1, '3890204e4604019d7382734177dfba03374755351c0e006c7418feca4c4ba21c', '2026-06-12 10:42:44', 0, '2026-06-11 19:42:44'),
(51, 1, '0d87a5d8d178a71e6ccfeba5b18279b042a9cb397b10d1dc9a464a5ad95e07e4', '2026-06-13 09:44:56', 0, '2026-06-12 18:44:56'),
(52, 1, '54d224c3b942b8886e469af2b10291aa8bec04331e77e4c91f569b8dcaae965e', '2026-06-13 09:44:57', 1, '2026-06-12 18:44:57'),
(53, 3, 'd5eb755eb4412ca5e672278c5a5423ece95e0653aff7fa03d66feaa88274c810', '2026-06-14 07:21:32', 0, '2026-06-13 16:21:32');

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
  `password_cambiada` tinyint(1) DEFAULT 0,
  `preguntas_configuradas` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id`, `email`, `password_hash`, `rol`, `nombre`, `id_referencia`, `password_cambiada`, `preguntas_configuradas`) VALUES
(1, 'admin@escuela.edu', '$2y$12$kxBNnam4GaKdpVnunJzqJej6KM4DqLtt9czVJH3YcIC.tjI4U6YTy', 'admin', 'Administrador', NULL, 1, 1),
(2, 'escotpilgrim@gmail.com', '$2y$12$zTB/newMGZwUfB2nvGTKYeA4z55MEEmkWxsWLtvQwOjXMnQ2gCEOG', 'estudiante', 'Escott Pilgrim', 2, 1, 1),
(3, 'profesorTobares@gmail.com', '$2y$12$krM6fLObOqTBpdrpoYsUIOjJykdIJy/O2RHOxsHczHDKnyeTCZVYK', 'profesor', 'Jose Tobares', 1, 1, 1),
(4, 'estudiante1@gmail.com', '$2y$12$30nK5N7HUBLGr.oEY2uUd.pVYBr7C0SWK4RsFusQeMZmSVoT04lzq', 'estudiante', 'Estudiante 1', 3, 0, 0),
(5, 'profe1@gmail.com', '$2y$12$tm5bHNo.ZxfPxzcHktXFPeIdRMjTmMmyBWuWoYwLdPAnnv9lIhcLi', 'profesor', 'Profe 1', 2, 0, 0),
(6, 'Asia@gmai.com', '$2y$12$xSGFNqWhaqkWLJFtLVnEIOCU2ntplgLYKd/lv2GsD2tGIUw1jpf1u', 'estudiante', 'Asia', 4, 0, 0),
(7, 'emilyflores@gmail.com', '$2y$12$gpzUEl.za4WyejUisBuYk.untHkoU/0cSJMCiSbSRtPa1.8vEQyfG', 'estudiante', 'Emily Flores', 5, 0, 0),
(8, 'robertlime@gmail.com', '$2y$12$k8L9oiuAkzOr3sBUl3q.x.mkYSw1woUIvnrwJI1co2D/9r.t8wG4.', 'estudiante', 'Rober Limerio', 6, 0, 0),
(9, 'soniap@gmail.com', '$2y$12$TkKENouMeUdI7TWzH3jNlupMZY.xVbkCdXi.4KWlCXa3Jriro4Mhu', 'estudiante', 'Sonia Paredes', 7, 0, 0),
(10, 'julioperez@gmail.com', '$2y$12$ZtC84lWPMToJURXNlTmfbOJas4O7tDWbWN3bHQpTtXiIp/HCPdgMK', 'profesor', 'Julio Perez', 3, 0, 0),
(11, 'penelopeb@gmail.com', '$2y$12$OnlvcCgAx.hfDtT7H5Duo.EurHqbR1DgjKRe2x9XR9/wrsKMjhHj6', 'profesor', 'Penelope Bonswit', 4, 0, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_pregunta`
--

CREATE TABLE `usuario_pregunta` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `pregunta_id` int(11) NOT NULL,
  `respuesta_hash` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario_pregunta`
--

INSERT INTO `usuario_pregunta` (`id`, `usuario_id`, `pregunta_id`, `respuesta_hash`) VALUES
(1, 2, 1, '$2y$10$MZUQmTnnaKG3f5oj0j1UO.OHB73WeqzGCAlPFPvrSnrzN.rDhGsDC'),
(2, 2, 5, '$2y$10$1.tFrYeA9MJUCM1uTk2NkOdumq7l9MmUyesUbkgNBb4AS6GF2DO6e'),
(3, 2, 2, '$2y$10$IcQ4jFdG/4R2wqCVdMGjS.SGE.rQwnyHWaUurEytL5pAIpfaiud5e'),
(4, 3, 1, '$2y$10$./jyjDPmoBaiAADtFSPRGOvLLpaKhQKTUwDOlNg37rbRYm68ymkke'),
(5, 3, 2, '$2y$10$gF3ho8RilMQ1cKMFXEnV7uH6rQ0nFv.BlQnb32zTOBUHBEqr9gu0a'),
(6, 3, 5, '$2y$10$TAMFu1iTyVZDjYbhWL27cuvq9CQmEf2kjNzKOZLVeB.bn4ToIorEa');

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
-- Indices de la tabla `pregunta_seguridad`
--
ALTER TABLE `pregunta_seguridad`
  ADD PRIMARY KEY (`id`);

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
-- Indices de la tabla `usuario_pregunta`
--
ALTER TABLE `usuario_pregunta`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuario_pregunta` (`usuario_id`,`pregunta_id`),
  ADD KEY `fk_up_pregunta` (`pregunta_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `materia`
--
ALTER TABLE `materia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `matricula`
--
ALTER TABLE `matricula`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
-- AUTO_INCREMENT de la tabla `pregunta_seguridad`
--
ALTER TABLE `pregunta_seguridad`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `profesor`
--
ALTER TABLE `profesor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `sesion`
--
ALTER TABLE `sesion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `usuario_pregunta`
--
ALTER TABLE `usuario_pregunta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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

--
-- Filtros para la tabla `usuario_pregunta`
--
ALTER TABLE `usuario_pregunta`
  ADD CONSTRAINT `fk_up_pregunta` FOREIGN KEY (`pregunta_id`) REFERENCES `pregunta_seguridad` (`id`),
  ADD CONSTRAINT `fk_up_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
