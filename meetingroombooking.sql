-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Oct 08, 2025 at 09:14 AM
-- Server version: 8.4.6
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `meetingroombooking`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `room_id` int NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `date` date DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `user_id`, `room_id`, `start_time`, `end_time`, `purpose`, `status`, `date`, `created_at`) VALUES
(26, 1, 1, '02:02:00', '05:05:00', NULL, 'confirmed', '2025-10-11', '2025-10-08 09:10:13');

-- --------------------------------------------------------

--
-- Table structure for table `districts`
--

CREATE TABLE `districts` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `districts`
--

INSERT INTO `districts` (`id`, `name`) VALUES
(1, 'Ba Đình'),
(2, 'Hoàn Kiếm'),
(3, 'Hai Bà Trưng'),
(4, 'Đống Đa'),
(5, 'Cầu Giấy'),
(6, 'Thanh Xuân'),
(7, 'Nam Từ Liêm'),
(8, 'Bắc Từ Liêm');

-- --------------------------------------------------------

--
-- Table structure for table `equipment`
--

CREATE TABLE `equipment` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `equipment`
--

INSERT INTO `equipment` (`id`, `name`, `description`) VALUES
(1, 'Máy chiếu', 'Máy chiếu độ phân giải cao cho thuyết trình.'),
(2, 'Màn hình LCD', 'Màn hình LCD 55 inch hiển thị nội dung.'),
(3, 'Loa', 'Hệ thống loa phục vụ hội nghị và họp trực tuyến.'),
(4, 'Micro', 'Micro không dây chất lượng cao.'),
(5, 'Bảng trắng', 'Bảng trắng kèm bút lông.'),
(6, 'Máy lạnh', 'Máy lạnh điều hòa nhiệt độ cho phòng họp.'),
(7, 'Camera hội nghị', 'Camera Full HD phục vụ họp trực tuyến.'),
(8, 'Máy tính', 'Máy tính để bàn kết nối Internet.');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `capacity` int NOT NULL,
  `status` enum('available','unavailable') DEFAULT 'available',
  `district_id` int DEFAULT NULL,
  `price` int DEFAULT NULL,
  `imageUrl` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `name`, `location`, `capacity`, `status`, `district_id`, `price`, `imageUrl`) VALUES
(1, 'Phòng Họp Lê Nin', 'Tầng 3, Tòa nhà A, Quận Ba Đình', 20, 'available', 1, 100000, 'https://t3.ftcdn.net/jpg/02/38/54/82/240_F_238548286_UHBUPhU8STNmQ8rayFxzKLG8LDLgWcwr.jpg'),
(2, 'Phòng Họp Hồ Gươm', 'Tầng 2, Tòa nhà B, Quận Hoàn Kiếm', 15, 'available', 2, 150000, 'https://t4.ftcdn.net/jpg/13/90/18/61/240_F_1390186113_UmFKH5LCr5jc430gG2mHyZChaHv7FYvx.jpg'),
(3, 'Phòng Họp Bà Triệu', 'Tầng 5, Tòa nhà C, Quận Hai Bà Trưng', 25, 'available', 3, 200000, 'https://t3.ftcdn.net/jpg/14/60/39/48/240_F_1460394865_OhOw4ZKqpbJ8B8xw2D7Xuxla9JJBOWni.jpg'),
(4, 'Phòng Họp Văn Miếu', 'Tầng 4, Tòa nhà D, Quận Đống Đa', 30, 'available', 4, 300000, 'https://t4.ftcdn.net/jpg/13/20/97/43/240_F_1320974311_pA5J4XswEZGFeA1NuoyBJ4RH8X7cwoKd.jpg'),
(5, 'Phòng Họp Cầu Giấy 1', 'Tầng 6, Tòa nhà E, Quận Cầu Giấy', 40, 'available', 5, 400000, 'https://t4.ftcdn.net/jpg/09/13/49/47/240_F_913494763_S2zC2A40Cya5asIt836yTiU8v0MRJHmD.jpg'),
(6, 'Phòng Họp Thanh Xuân', 'Tầng 7, Tòa nhà F, Quận Thanh Xuân', 35, 'available', 6, 350000, 'https://t4.ftcdn.net/jpg/14/28/24/63/240_F_1428246386_uRKp3kXwdem7M9H2wp73Z4XshgC74PaN.jpg'),
(7, 'Phòng Họp Mỹ Đình', 'Tầng 10, Tòa nhà G, Quận Nam Từ Liêm', 50, 'available', 7, 500000, 'https://t4.ftcdn.net/jpg/15/44/14/65/240_F_1544146559_kHDEviWBfo9QeRalqQk4pjFmjoE1eR3G.jpg'),
(8, 'Phòng Họp Ciputra', 'Tầng 8, Tòa nhà H, Quận Bắc Từ Liêm', 25, 'unavailable', 8, 250000, 'https://t4.ftcdn.net/jpg/08/29/92/69/240_F_829926904_PTNE45t72j6QnLeCJ3OLkLCR7f2ueD1Q.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `room_equipment`
--

CREATE TABLE `room_equipment` (
  `room_id` int NOT NULL,
  `equipment_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `room_equipment`
--

INSERT INTO `room_equipment` (`room_id`, `equipment_id`) VALUES
(1, 1),
(3, 1),
(5, 1),
(7, 1),
(8, 1),
(2, 2),
(3, 2),
(5, 2),
(6, 2),
(7, 2),
(3, 3),
(4, 3),
(5, 3),
(7, 3),
(8, 3),
(1, 4),
(2, 4),
(3, 4),
(4, 4),
(5, 4),
(7, 4),
(1, 5),
(2, 5),
(6, 5),
(1, 6),
(4, 6),
(6, 6),
(7, 6),
(8, 6),
(5, 7),
(7, 7),
(8, 8);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `phone` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`) VALUES
(1, 'kien', 'kien@gmail.com', '123456', 'user', NULL),
(2, 'kien', 'k@gmail.com', '1234', 'admin', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `districts`
--
ALTER TABLE `districts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `equipment`
--
ALTER TABLE `equipment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `district_id` (`district_id`);

--
-- Indexes for table `room_equipment`
--
ALTER TABLE `room_equipment`
  ADD PRIMARY KEY (`room_id`,`equipment_id`),
  ADD KEY `equipment_id` (`equipment_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `districts`
--
ALTER TABLE `districts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `equipment`
--
ALTER TABLE `equipment`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `room_equipment`
--
ALTER TABLE `room_equipment`
  ADD CONSTRAINT `room_equipment_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `room_equipment_ibfk_2` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
