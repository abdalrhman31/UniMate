-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 23, 2026 at 11:30 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `unimate_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `course_name` varchar(100) NOT NULL,
  `credit_hours` int(11) NOT NULL,
  `schedule_time` varchar(50) DEFAULT NULL,
  `room` varchar(50) DEFAULT NULL,
  `instructor` varchar(100) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `course_name`, `credit_hours`, `schedule_time`, `room`, `instructor`, `user_id`) VALUES
(1, 'Software Engineering', 3, 'Mon & Wed, 10:00-11:30 AM', 'Building B, Room 204', 'Dr. Ahmad', NULL),
(2, 'Operating Systems', 3, 'Sun & Tue, 08:30-10:00 AM', 'Building C, Lab 102', 'Dr. Omar', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `position` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `office_room` varchar(50) DEFAULT NULL,
  `office_hours` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `full_name`, `position`, `department`, `email`, `office_room`, `office_hours`) VALUES
(1, 'Amani Abu Jabal', 'Chair, Assistant Professor', 'School of Computing (SC)', 'Amani.Abujabal@gju.edu.jo', 'M316', NULL),
(2, 'Abdullah Alfarrarjeh', 'Vice Dean, Assistant Professor', 'School of Computing (SC)', 'Abdullah.Alfarrarjeh@gju.edu.jo', 'M309', NULL),
(3, 'Ismail Hababeh', 'Associate Professor', 'School of Computing (SC)', 'Ismail.Hababeh@gju.edu.jo', 'M319', NULL),
(4, 'Ammar Gharaibeh', 'Dean, Associate Professor', 'School of Computing (SC)', 'Ammar.Gharaibeh@gju.edu.jo', 'M 220', NULL),
(5, 'Dhiah el Diehn I. Abou-Tair', 'Professor', 'School of Computing (SC)', 'dhiah.aboutair@gju.edu.jo', 'M311', NULL),
(6, 'Nabil Ayoub', 'Professor', 'School of Computing (SC)', 'nabil.ayoub@gju.edu.jo', 'H209', NULL),
(7, 'Hussein Al-Ta\'ani', 'Associate Professor', 'School of Computing (SC)', 'hussein.taani@gju.edu.jo', 'H407', NULL),
(8, 'Mohammad AlQudah', 'Associate Professor', 'School of Computing (SC)', 'Mohammad.Qudah@gju.edu.jo', 'H307', NULL),
(9, 'Omar Al-Omari', 'Associate Professor (on leave)', 'School of Computing (SC)', 'omar.alomari@gju.edu.jo', 'H414', NULL),
(10, 'Dia Zeidan', 'Professor', 'School of Computing (SC)', 'dia.zeidan@gju.edu.jo', 'H309', NULL),
(11, 'Feras Al-Hawari', 'Professor', 'School of Computing (SC)', 'firas.alhawari@gju.edu.jo', 'M 214', NULL),
(12, 'Inshad Jum\'h', 'Professor (on leave)', 'School of Computing (SC)', 'inshad.yousef@gju.edu.jo', 'H409', NULL),
(13, 'Mohammad Abudayah', 'Chair, Professor', 'School of Computing (SC)', 'Mohammad.Abudayah@gju.edu.jo', 'H413 / H406', NULL),
(14, 'Sameer Arabasi', 'Associate Professor (on leave)', 'School of Computing (SC)', 'sameer.arabasi@gju.edu.jo', 'H408', NULL),
(15, 'Rami Alazrai', 'Professor (on leave)', 'School of Computing (SC)', 'Rami.Azrai@gju.edu.jo', 'M 213', NULL),
(16, 'Ala Khalifeh', 'Professor', 'School of Computing (SC)', 'ala.khalifeh@gju.edu.jo', 'M 215', NULL),
(17, 'Ahmad Barghash', 'Associate Professor', 'School of Computing (SC)', 'Ahmad.barghash@gju.edu.jo', 'M314', NULL),
(18, 'Omar Hiari', 'Professor (on leave)', 'School of Computing (SC)', 'omar.hiari@gju.edu.jo', 'M 221', NULL),
(19, 'Samer Nofal', 'Associate Professor (on leave)', 'School of Computing (SC)', 'Samer.Nofal@gju.edu.jo', 'M317', NULL),
(20, 'Suhad Sbeih', 'Assistant Professor', 'School of Computing (SC)', 'suhad.sbeih@gju.edu.jo', 'H511', NULL),
(21, 'Husam H. Abu-Safe', 'Professor of Physics / Nanomaterials', 'School of Computing (SC)', 'Husam.Abusafe@gju.edu.jo', 'H410', NULL),
(22, 'Laith Hawawsheh', 'Assistant Professor', 'School of Computing (SC)', 'Laith.Hawawsheh@gju.edu.jo', 'H109', NULL),
(23, 'Mohammad AlDaoud', 'Professor (on leave)', 'School of Computing (SC)', 'mohammad.aldaoud@gju.edu.jo', 'M 210', NULL),
(24, 'Sahel Alouneh', 'Professor', 'School of Computing (SC)', 'sahel.alouneh@gju.edu.jo', 'M-212', NULL),
(25, 'Mahmoud Al-Sarayreh', 'Chair, Assistant Professor', 'School of Computing (SC)', 'mahmoud.alsarayreh@gju.edu.jo', 'M 004', NULL),
(26, 'Nadia AL-Rousan', 'Assistant Professor', 'School of Computing (SC)', 'nadia.alrousan@gju.edu.jo', 'M 208', 'sun-tue 11:00-12:30 , mon-wed 8:30-9:30'),
(27, 'Rana Al-Mahmoud', 'Assistant Professor', 'School of Computing (SC)', 'Rana.almahmoud@gju.edu.jo', 'M-320', 'sun 11:30-1:00 , mon 10:00-11:30'),
(28, 'Diana Alshawabkah', 'Administrative Officer', 'School Of Computing (SC)\r\n', 'Diana.alshawabkah@gju.edu.jo', 'M215', NULL),
(29, 'Dima Al-Sbeih', 'Computer Engineer (On Leave)', 'School Of Computing (SC)', 'dima.alsbeih@gju.edu.jo', 'M505', NULL),
(30, 'Hadeel Kayed', 'Research and Teaching Assistant', 'School Of Computing (SC)', 'Hadeel.sammour@gju.edu.jo', 'S-108', NULL),
(31, 'Issra Hamoudeh', 'Research and Teaching Assistant', 'School Of Computing (SC)', 'Asma.Alkhraibat@gju.edu.jo', 'C204', NULL),
(32, 'Dana Alsawaeir', 'International Exchange Officer', 'School Of Computing (SC)', 'Dana.Alsawaeir@gju.edu.jo', 'M309', NULL),
(33, 'Dima Al Shihan', 'Teaching and Research Assistant', 'School Of Computing (SC)', 'Dima.Alshihan@gju.edu.jo', NULL, NULL),
(34, 'Ghadeer Albakkar', 'Administrative Secretary', 'School Of Computing (SC)', 'Ghadeer.Albakkar@gju.edu.jo', 'M215', NULL),
(35, 'Nadeen Alzaougha', 'Research and Teaching Assistant', 'School Of Computing (SC)', 'Nadeen.Alzaougha@gju.edu.jo', 'M121', NULL),
(36, 'Salem Ala\' Alwarawreh', 'Teaching and Research Assistant', 'School Of Computing (SC)', 'salem.alwarwareh@gju.edu.jo', 'M505', NULL),
(37, 'Wala\'a Abu Swaliem', 'Teaching and Research Assistant', 'School Of Computing (SC)', 'Walaa.Abusualiem@gju.edu.jo', 'C406', NULL),
(38, 'Ziad Abu El-Rub', 'Associate Professor; Dean', 'School of Applied Medical Sciences', 'ziad.abuelrub@gju.edu.jo', 'M-509', NULL),
(39, 'Nasim George Alnu\'man', 'Associate Professor; Vice Dean', 'School of Applied Medical Sciences', 'nasim.alnuman@gju.edu.jo', 'Building M', NULL),
(40, 'Sameer Hasan', 'Assistant Professor; Head of Department', 'School of Applied Medical Sciences', 'Sameer.Hasan@gju.edu.jo', 'Building M', NULL),
(41, 'Ahmad Albadarin', 'Assistant Professor; Head of Department', 'School of Applied Medical Sciences', '', 'M-415', NULL),
(42, 'Ibrahem Altarawneh', 'Professor', 'School of Applied Medical Sciences', 'ibrahem.altarawneh@gju.edu.jo', 'M416', NULL),
(43, 'Samer Al-Gharabli', 'Professor', 'School of Applied Medical Sciences', 'samer.gharabli@gju.edu.jo', 'M-503', NULL),
(44, 'Adnan Bashir Al-Lahham', 'Professor', 'School of Applied Medical Sciences', 'adnan.lahham@gju.edu.jo', 'M-414', NULL),
(45, 'Munib Musa Saket', 'Professor', 'School of Applied Medical Sciences', 'munib.saket@gju.edu.jo', 'M-315', NULL),
(46, 'Arwa Abdelhay', 'Professor', 'School of Applied Medical Sciences', 'arwa.abdelhay@gju.edu.jo', 'C411', NULL),
(47, 'Eyad Hamad', 'Professor', 'School of Applied Medical Sciences', 'eyad.hamad@gju.edu.jo', 'M-502', NULL),
(48, 'Samer Alabed', 'Professor', 'School of Applied Medical Sciences', 'Samer.alabed@gju.edu.jo', 'M-507', NULL),
(49, 'Balsam Mohammad', 'Associate Professor', 'School of Applied Medical Sciences', 'balsam.mohammad@gju.edu.jo', 'M-418', NULL),
(50, 'Walid Al-Zyoud', 'Associate Professor', 'School of Applied Medical Sciences', 'Walid.AlZyoud@gju.edu.jo', 'M-413', NULL),
(51, 'Malyuba Abu-Daabes', 'Associate Professor', 'School of Applied Medical Sciences', 'malyuba.abudaabes@gju.edu.jo', 'M-415', NULL),
(52, 'Nafisah Al-Rifai', 'Associate Professor', 'School of Applied Medical Sciences', 'nafisah.rifai@gju.edu.jo', 'M-417', NULL),
(53, 'Mohammad F. Khanfar', 'Associate Professor', 'School of Applied Medical Sciences', 'mohammad.khanfar@gju.edu.jo', 'M-411', NULL),
(54, 'Mohammad Alnaief', 'Associate Professor', 'School of Applied Medical Sciences', 'mohammad.alnaief@gju.edu.jo', 'M-420', NULL),
(55, 'Esra\'a Albarahmieh', 'Associate Professor', 'School of Applied Medical Sciences', 'israa.barahmieh@gju.edu.jo', 'M-419', NULL),
(56, 'Jumana Ma\'touq', 'Associate Professor', 'School of Applied Medical Sciences', 'jumana.matouq@gju.edu.jo', 'M-422', NULL),
(57, 'Amer Alsaraira', 'Associate Professor', 'School of Applied Medical Sciences', 'Amer.Alsaraira@gju.edu.jo', 'M-403', NULL),
(58, 'Omar Yasin', 'Lecturer (MSc)', 'School of Applied Medical Sciences', 'Omar.Yasin@gju.edu.jo', 'Building M', NULL),
(59, 'Fatimeh Al-Hadidi', 'Instructor', 'School of Applied Medical Sciences', 'fatimeh.hadidi@gju.edu.jo', 'C424', NULL),
(60, 'Eslam AlQasem', 'Research and Teaching Assistant', 'School Of Applied Medical Sciences', 'eslam.alqasem@gju.edu.jo', 'A106', NULL),
(61, 'Maryam Saqer', 'Research and Teaching Assistant', 'School Of Applied Medical Sciences', 'maryam.saqer@gju.edu.jo', 'M-004', NULL),
(62, 'Noor Al-Bataina', 'Research and Teaching Assistant', 'School Of Applied Medical Sciences', 'Noor.Albataina@gju.edu.jo', 'M-002', NULL),
(63, 'Sondus Shawabkah', 'Head of Records', 'School Of Applied Medical Sciences', 'SAMS.bureau@gju.edu.jo', 'M', NULL),
(64, 'Ranya Khader', 'Research and Teaching Assistant', 'School Of Applied Medical Sciences', 'Ranya.Khader@gju.edu.jo', 'M-003', NULL),
(65, 'Huda Al Shami', 'Research and Teaching Assistant', 'School Of Applied Medical Sciences', 'Huda.Alshami@gju.edu.jo', 'M-002', NULL),
(66, 'Doaa Shawaheen', 'Dean Assistant for Accreditation', 'School Of Applied Medical Sciences', 'doaa.shawaheen@gju.edu.jo', 'M-002', NULL),
(67, 'Iman Al-Qudah', 'Research and Teaching Assistant', 'School Of Applied Medical Sciences', 'Iman.Alqudah@gju.edu.jo', 'M-003', NULL),
(68, 'Hadeel Al-Ma’ayah', 'Research and Teaching Assistant', 'School Of Applied Medical Sciences', 'Hadeel.Almaayah@gju.edu.jo', 'M-006', NULL),
(69, 'Ayat Abu Daeij', 'Research and Teaching Assistant', 'School Of Applied Medical Sciences', 'Ayat.Abudaeij@gju.edu.jo', 'M-006', NULL),
(70, 'Duaa Alesrawi', 'Research and Teaching Assistant', 'School Of Applied Medical Sciences', 'Duaa.Alesrawi@gju.edu.jo', 'M-003', NULL),
(167, 'Malek Alsharairi', 'Professor (Sabbatical Leave)', 'Business School', 'malek.alsharairi@gju.edu.jo', 'A 202', NULL),
(168, 'Bassam Maali', 'Dean; Professor', 'Business School', 'Bassam.maali@gju.edu.jo', 'B214', NULL),
(169, 'Ghazi Samawi', 'Associate Professor (Sabbatical Leave)', 'Business School', 'ghazi.samawi@gju.edu.jo', 'B307', NULL),
(170, 'Ismail Abushaikha', 'Associate Professor of Logistics', 'Business School', 'ismail.abushaikha@gju.edu.jo', 'B212', NULL),
(171, 'Ahmad Abu Dawleh', 'Assistant Professor', 'Business School', 'ahmad.abudawleh@gju.edu.jo', 'B208', NULL),
(172, 'Khaldoun K. Tahboub', 'Associate Professor', 'Business School', 'Khaldoun.tahboub@gju.edu.jo', 'B414', NULL),
(173, 'Fathi Alarabi Yosef', 'Assistant Professor; Acting Dean', 'Business School', 'Fathi.yosef@gju.edu.jo', 'B401', NULL),
(174, 'Ali Al-attar', 'Associate Professor (Unpaid Leave)', 'Business School', 'Ali.attar@gju.edu.jo', 'B215', NULL),
(175, 'Aziz Al Madi', 'Assistant Professor', 'Business School', 'Aziz.Madi@gju.edu.jo', 'B308', NULL),
(176, 'Mohammad AlOmari', 'Associate Professor (Unpaid Leave)', 'Business School', 'mohammad.alomari@gju.edu.jo', 'B208', NULL),
(177, 'Muhannad Atmeh', 'Associate Professor of Accounting', 'Business School', 'Muhannad.atmeh@gju.edu.jo', 'B403', NULL),
(178, 'Raed Alkhasawneh', 'Associate Professor', 'Business School', 'Raed.khasawneh@gju.edu.jo', 'B403', NULL),
(179, 'Serena Sandri', 'Associate Professor (Sabbatical Leave)', 'Business School', 'serena.sandri@gju.edu.jo', 'B305', NULL),
(180, 'Luai Abu Rajab', 'Assistant Professor', 'Business School', 'Luai.aburajab@gju.edu.jo', 'B217', NULL),
(181, 'Abdelrahim Alsoussi', 'Assistant Professor; Acting Head of Department', 'Business School', 'abdelrahim.alsoussi@gju.edu.jo', 'B402', NULL),
(182, 'Rana Sabri', 'Assistant Professor', 'Business School', 'Rana.sabri@gju.edu.jo', 'B315', NULL),
(183, 'Luay Jum’a', 'Associate Professor', 'Business School', 'Luay.juma@gju.edu.jo', 'B213', NULL),
(184, 'Metri Mdanat', 'Associate Professor', 'Business School', 'metri.mdanat@gju.edu.jo', 'B313', NULL),
(185, 'Omar Shubailat', 'Associate Professor', 'Business School', 'omar.shubailat@gju.edu.jo', 'B310', NULL),
(186, 'Omar Bwaliez', 'Assistant Professor', 'Business School', 'omar.bwaliez@gju.edu.jo', 'B311', NULL),
(187, 'Emad Hatamleh', 'Industrial Professor', 'Business School', 'Emad.Hatamleh@gju.edu.jo', 'B205', NULL),
(188, 'Ahmad Obidat', 'Associate Professor; Head of Department', 'Business School', 'Ahmad.Obidat@gju.edu.jo', 'B215', NULL),
(189, 'Jamal Al Qundus', 'Assistant Professor', 'Business School', 'jamal.alqundus@gju.edu.jo', 'B413', NULL),
(190, 'Lama Obeidat', 'Assistant Professor; Acting Exchange Coordinator', 'Business School', 'lama.obaidat@gju.edu.jo', 'B316', NULL),
(191, 'Maen Zubaydi', 'Assistant Professor', 'Business School', 'Maen.Zubaydi@gju.edu.jo', 'B309', NULL),
(192, 'Zaid Alzghoul', 'Assistant Professor; Head of Department', 'Business School', 'Zaid.Alzghoul@gju.edu.jo', 'B208', NULL),
(193, 'Abdulelah Albdour', 'Instructor', 'Business School', 'abdulelah.albdour@gju.edu.jo', 'B419', NULL),
(194, 'Lana Harb', 'Digital Marketing Instructor', 'Business School', 'Lana.Harb@gju.edu.jo', 'B418', NULL),
(195, 'Thekra ALMaaiteh', 'Acting Head of Records', 'Business School', 'Thekra.ALMaaiteh@gju.edu.jo', 'B401', NULL),
(196, 'Ameera Abusha’irah', 'Teaching Assistant Grants', 'Business School', 'Ameera.Abushairah@gju.edu.jo', 'B420', NULL),
(197, 'Dina Yacoub', 'Teaching Assistant Grants', 'Business School', 'Dina.Yacoub@gju.edu.jo', NULL, NULL),
(198, 'Hasan Al Dabbas', 'Teaching Assistant Grants', 'Business School', 'Hasan.Aldabbas@gju.edu.jo', NULL, NULL),
(199, 'Lubna Al Tarawneh', 'Teaching Assistant', 'Business School', 'Lubna.Altarawneh@gju.edu.jo', 'B404', NULL),
(200, 'Raya Al-talib', 'Teaching Assistant for Student Affairs', 'Business School', 'raya.altalib@gju.edu.jo', 'B401', NULL),
(201, 'Ralf Rosskopf', 'Full Professor; Vice President for International Affairs', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Vice.President-IA@gju.edu.jo', 'A202', NULL),
(202, 'Haytham Thawabih', 'Professor; Dean', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Haytham.Althawbih@gju.edu.jo', 'B001', NULL),
(203, 'Tamara Al Rawwad', 'Vice Dean; Head of Social Department', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Tamara.Alrawwad@gju.edu.jo', 'B107', NULL),
(204, 'Bassmah Al-Taher', 'Head of Applied Humanities Department', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Bassmah.Altaher@gju.edu.jo', 'B010', NULL),
(205, 'Fawwaz Al-Saqqar', 'Head of Basic Education Department', ' School of Applied Humanities and Social Sciences (SAHSS)', 'fawwaz.alsaqqar@gju.edu.jo', 'H212', NULL),
(206, 'Eva Haddad', 'Associate Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'eva.haddad@gju.edu.jo', 'H107', NULL),
(207, 'Ortrun Hanna', 'Assistant Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Ortrun.hanna@gju.edu.jo', 'B109', NULL),
(208, 'Torsten Schaar', 'MA DaF Program Coordinator', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Torsten.Schaar@gju.edu.jo', 'B117', NULL),
(209, 'Mariam Abu Hussein', 'Instructor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Mariam.AbuHussein@gju.edu.jo', 'B110', NULL),
(210, 'Gordon Mitchell', 'Joint PhD in DaF Program Coordinator', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Gordon.Mitchell@gju.edu.jo', 'B114', NULL),
(211, 'Osama Salaita', 'Dean Assistant for Quality', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Osama.Salaita@gju.edu.jo', 'B013', NULL),
(212, 'Christine Huth-Hildebrandt', 'Visiting Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Christine.Hildebrandt@gju.edu.jo', 'B118', NULL),
(213, 'Oliver Ritter', 'Assistant Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Oliver.ritter@gju.edu.jo', 'B108', NULL),
(214, 'Abdallah Al-Raggad', 'Associate Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'abdallah.raggad@gju.edu.jo', 'H211', NULL),
(215, 'Sahar AlMakhamreh', 'Full Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Sahar.Makhamreh@gju.edu.jo', 'B115', NULL),
(216, 'Mohammad Ali Al Hroot', 'Associate Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Mohammad.alhrout@gju.edu.jo', 'H109', NULL),
(217, 'Nada Eltaiba', 'Associate Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Nada.Eltaiba@gju.edu.jo', 'B113', NULL),
(218, 'Safa Shweihat', 'Associate Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'safa.Shweihat@gju.edu.jo', 'H108', NULL),
(219, 'Reem Rabadi', 'Full Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Reem.rabadi@gju.edu.jo', 'B014', NULL),
(220, 'Monika Hryniewicka', 'Assistant Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Monika.Hryniewicka@gju.edu.jo', 'L306', NULL),
(221, 'Dina Al-Hindi', 'Instructor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'dina.hindi@gju.edu.jo', 'H213', NULL),
(222, 'Mahasen Al-Tal', 'Teaching and Research Assistant', ' School of Applied Humanities and Social Sciences (SAHSS)', 'mahasen.altal@gju.edu.jo', 'B016', NULL),
(223, '', 'Instructor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Raghad.Hadidi@gju.edu.jo', 'B011', NULL),
(224, 'Iman Sha’sha’a', 'Instructor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'iman.shashaa@gju.edu.jo', 'H208', NULL),
(225, 'Areen Tarawneh', 'Dean Assistant for Industrial Relations', ' School of Applied Humanities and Social Sciences (SAHSS)', 'areen.tarawneh@gju.edu.jo', 'H210', NULL),
(226, 'Bader Al-Madi', 'Assistant Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Bader.Madi@gju.edu.jo', 'B116', NULL),
(227, 'Thelal Oweis', 'Associate Professor', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Thelal.owies@gju.edu.jo', 'H308 / Sports Hall Office 8', NULL),
(228, 'Deema Khasawneh', 'Full-Time Lecturer', ' School of Applied Humanities and Social Sciences (SAHSS)', 'Deema.khasawneh@gju.edu.jo', 'H312', NULL),
(229, 'Kawthar Karain', 'Full-Time Lecturer', 'School of Applied Humanities and Social Sciences (SAHSS)', 'kawther.karain@gju.edu.jo', 'H311', NULL),
(230, 'Jorg Roche', 'Full Professor', 'School of Applied Humanities and Social Sciences (SAHSS)', 'roche@daf.lmu.de', NULL, NULL),
(231, 'Hamza Al-Majali', 'Assistant Professor', 'School of Applied Humanities and Social Sciences (SAHSS)', 'Hamza.Almajali@gju.edu.jo', 'H110', NULL),
(232, 'Tarik Boutaib', 'Instructor', 'School of Applied Humanities and Social Sciences (SAHSS)', 'tarik.boutaib@gju.edu.jo', NULL, NULL),
(233, 'Alanoud Hamouri', 'Assistant Professor', 'School of Applied Humanities and Social Sciences (SAHSS)', 'alanoud.hamouri@gju.edu.jo', 'B112', NULL),
(234, 'Alaa Obeidat', 'Full-Time Lecturer', 'School of Applied Humanities and Social Sciences (SAHSS)', 'Alaa.Obeidat@gju.edu.jo', 'H112', NULL),
(235, 'Hani Mohammad', 'Full-Time Lecturer', 'School of Applied Humanities and Social Sciences (SAHSS)', 'Hani.Mohammad@gju.edu.jo', 'H314', NULL),
(236, 'Laila Abu-Sharkh', 'Full-Time Lecturer', 'School of Applied Humanities and Social Sciences (SAHSS)', 'Laila.Abusharkh@gju.edu.jo', 'H411', NULL),
(237, 'Lina Alshawabkeh', 'Full-Time Lecturer', 'School of Applied Humanities and Social Sciences (SAHSS)', 'Lina.Alshawabkeh@gju.edu.jo', 'H209', NULL),
(238, 'Saba Alajarmeh', 'Dean\'s Assistant', 'School of Applied Humanities and Social Sciences (SAHSS)', 'Saba.Alajarmeh@gju.edu.jo', 'B003', NULL),
(239, 'Muna Abumeizer', 'Teaching Assistant', 'School of Applied Humanities and Social Sciences (SAHSS)', 'Muna.Abumeizer@gju.edu.jo', 'B007', NULL),
(240, 'Ala’aldeen Al-Halhouli', 'President', 'School of Applied Technical Sciences', 'Alaaldeen.alhalhouli@gju.edu.jo', 'A 201', NULL),
(241, 'Iyas Khader', 'Vice President for Academic Excellence', 'School of Applied Technical Sciences', 'iyas.khader@gju.edu.jo', 'C217', NULL),
(242, 'Aiman Alshare', 'Professor; Dean of SSSE and SATS', 'School of Applied Technical Sciences', 'aiman.share@gju.edu.jo', 'C225', NULL),
(243, 'Ziyad Masoud', 'Professor; Dean of Scientific Research', 'School of Applied Technical Sciences', 'ziyad.masoud@gju.edu.jo', 'C228', NULL),
(244, 'Sahar Qaadan', 'Associate Professor', 'School of Applied Technical Sciences', 'Sahar.qadan@gju.edu.jo', 'C012', NULL),
(245, 'Bashar K. Hammad', 'Professor; Vice Dean', 'School of Applied Technical Sciences', 'Bashar.Hammad@gju.edu.jo', 'C218', NULL),
(246, 'Ahmad Al-Muhtady', 'Associate Professor; Vice Dean', 'School of Applied Technical Sciences', 'ahmad.almuhtady@gju.edu.jo', 'C117 / F040', NULL),
(247, 'Shuruq Shawish', 'Instructor; Head of Department', 'School of Applied Technical Sciences', 'Shorouq.shaweesh@gju.edu.jo', 'C216', NULL),
(248, 'Maysa Ammouri', 'Assistant Professor; Head of Department', 'School of Applied Technical Sciences', 'maysa.ammouri@gju.edu.jo', 'C423', NULL),
(249, 'Hisham ElMoaqet', 'Professor; Vice Dean for International Affairs', 'School of Applied Technical Sciences', 'Hisham.Elmoaqet@gju.edu.jo', 'C214', NULL),
(250, 'Hani Muhsen', 'Professor; Head of Mechatronics Department', 'School of Applied Technical Sciences', 'Hani.Mohsen@gju.edu.jo', 'C133', NULL),
(251, 'Lena Abu-El-Haija', 'Assistant Professor', 'School of Applied Technical Sciences', 'Lena.abualhaija@gju.edu.jo', 'C421', NULL),
(252, 'Mariam Wajdi Ibrahim', 'Professor', 'School of Applied Technical Sciences', 'Mariam.wajdi@gju.edu.jo', 'C014', NULL),
(253, 'Sameer Al-Dahidi', 'Professor', 'School of Applied Technical Sciences', 'sameer.aldahidi@gju.edu.jo', 'C114', NULL),
(254, 'Rula Allaf', 'Associate Professor', 'School of Applied Technical Sciences', 'rula.allaf@gju.edu.jo', 'C224', NULL),
(255, 'Mutaz M. Ryalat', 'Professor', 'School of Applied Technical Sciences', 'mutaz.ryalat@gju.edu.jo', 'C215', NULL),
(256, 'Rafat Al-Waked', 'Professor', 'School of Applied Technical Sciences', 'Rafat.Alwaked@gju.edu.jo', 'C213', NULL),
(257, 'Ma’en S. Sari', 'Professor', 'School of Applied Technical Sciences', 'maen.sari@gju.edu.jo', 'C239', NULL),
(258, 'Safwan Altarazi', 'Professor', 'School of Applied Technical Sciences', 'safwan.altarazi@gju.edu.jo', 'C220', NULL),
(259, 'Hazem Kaylani', 'Associate Professor', 'School of Applied Technical Sciences', 'Hazem.kaylani@gju.edu.jo', 'C134', NULL),
(260, 'Yaqoub AlKhasawneh', 'Associate Professor', 'School of Applied Technical Sciences', 'Yaqoub.Alkhasawneh@gju.edu.jo', 'C318', NULL),
(261, 'Mohammad AbuShams', 'Associate Professor; Programme Coordinator', 'School of Applied Technical Sciences', 'Mohammad.AbuShams@gju.edu.jo', 'C222', NULL),
(262, 'Mahmoud El-Banna', 'Associate Professor', 'School of Applied Technical Sciences', 'Mahmoud.banna@gju.edu.jo', 'C219', NULL),
(263, 'Nidal Shwawreh', 'Assistant Professor', 'School of Applied Technical Sciences', 'Nidal.Alshwawreh@gju.edu.jo', 'C132', NULL),
(264, 'Natheer Almtireen', 'Assistant Professor', 'School of Applied Technical Sciences', 'Natheer.Almtireen@gju.edu.jo', 'C113', NULL),
(265, 'Murad Samhouri', 'Professor; Director of Accreditation', 'School of Applied Technical Sciences', 'Murad.Samhouri@gju.edu.jo', 'C123', NULL),
(266, 'Dina Elayan', 'Industrial Professor', 'School of Applied Technical Sciences', 'dina.elayan@gju.edu.jo', 'C116', NULL),
(267, 'Anas Atieh', 'Associate Professor; Engineering Programme Coordinator', 'School of Applied Technical Sciences', 'anas.atieh@gju.edu.jo', 'C119', NULL),
(268, 'Dina Karasneh', 'Lecturer', 'School of Applied Technical Sciences', 'dina.karasneh@gju.edu.jo', 'C115', NULL),
(269, 'Abdallah Albashir', 'Lecturer', 'School of Applied Technical Sciences', 'Abdallah.Albashir@gju.edu.jo', 'C111', NULL),
(270, 'Sarah Qareish', 'Instructor', 'School of Applied Technical Sciences', 'sarah.ziad@gju.edu.jo', 'C011', NULL),
(271, 'Fadwa Dababneh', 'Associate Professor', 'School of Applied Technical Sciences', 'fadwa.dababneh@gju.edu.jo', 'C007', NULL),
(272, 'Aiman Albatayneh', 'Professor', 'School of Applied Technical Sciences', 'Aiman.Albatayneh@gju.edu.jo', 'C319', NULL),
(273, 'Tamer Yared', 'Assistant Professor', 'School of Applied Technical Sciences', 'Tamer.yared@gju.edu.jo', 'C005', NULL),
(274, 'Mustafa Jaradat', 'Professor', 'School of Applied Technical Sciences', 'Mustafa.Jaradat@gju.edu.jo', 'C314', NULL),
(275, 'Alaa Alghwiri', 'Assistant Professor; Dean’s Assistant', 'School of Applied Technical Sciences', 'alaa.alghwiri@gju.edu.jo', 'C121', NULL),
(276, 'Ahmad Al Majali', 'Assistant Professor', 'School of Applied Technical Sciences', 'ahmad.almajali@gju.edu.com', 'C010', NULL),
(277, 'Ahmad Alshwawra', 'Assistant Professor; Exchange Coordinator', 'School of Applied Technical Sciences', 'Ahmad.Alshwawra@gju.edu.jo', 'C246', NULL),
(278, 'Ghaith Al-refai', 'Associate Professor; Vice Dean', 'School of Applied Technical Sciences', 'ghaith.alrefai@gju.edu.jo', 'C018', NULL),
(279, 'Nader Santarisi', 'Faculty Member', 'School of Applied Technical Sciences', 'Nader.Santarisi@gju.edu.jo', 'C009', NULL),
(280, 'Amani Albdour', 'Full-Time Lecturer; Assistant Dean', 'School of Applied Technical Sciences', 'amani.bdour@gju.edu.jo', 'C430', NULL),
(281, 'Majdoleen Abualeenein', 'Dual Studies Coordinator', 'School of Applied Technical Sciences', 'Majdolen.Abualeenein@gju.edu.jo', 'C012', NULL),
(282, 'Ismael Al-Hinti', 'Professor (Unpaid Leave)', 'School of Applied Technical Sciences', 'Ismael.hinti@gju.edu.jo', 'C229', NULL),
(283, 'Abdallah Abdallah', 'Professor (Unpaid Leave)', 'School of Applied Technical Sciences', 'Abdallah.abdallah@gju.edu.jo', NULL, NULL),
(284, 'Ala L. Hijazi', 'Professor', 'School of Applied Technical Sciences', 'Ala.Hijazi@gju.edu.jo', 'C003', NULL),
(285, 'Nathir A. Rawashdeh', 'Associate Professor (Unpaid Leave)', 'School of Applied Technical Sciences', 'nathir.rawashdeh@gju.edu.jo', 'C222', NULL),
(286, 'Wahib Owhaib', 'Associate Professor (Unpaid Leave)', 'School of Applied Technical Sciences', 'Wahib.Owhaib@gju.edu.jo', 'C137', NULL),
(287, 'Raid Al-Aomar', 'Professor (Unpaid Leave)', 'School of Applied Technical Sciences', 'raid.alaomar@gju.edu.jo', NULL, NULL),
(288, 'Wael Al-Kouz', 'Professor (Unpaid Leave)', 'School of Applied Technical Sciences', 'wael.alkouz@gju.edu.jo', 'C118', NULL),
(289, 'Jumana Abu-Khalaf', 'Associate Professor (Unpaid Leave)', 'School of Applied Technical Sciences', 'jumana.abukhalaf@gju.edu.jo', 'C215', NULL),
(290, 'Ammar Alkhalidi', 'Professor (Unpaid Leave)', 'School of Applied Technical Sciences', 'Ammar.alkhalidi@gju.edu.jo', 'C329', NULL),
(291, 'Ahmad Al-Kousheh', 'Research and Teaching Assistant; Simulation Laboratory', 'School of Applied Technical Sciences', 'Ahmad.kousheh@gju.edu.jo', 'C131', NULL),
(292, 'Mohammad Futian', 'Research and Teaching Assistant; Hydraulic and Pneumatic Systems Laboratory', 'School of Applied Technical Sciences', 'mohammad.fetian@gju.edu.jo', 'C304', NULL),
(293, 'Ohoud Aljaloudi', 'Research and Teaching Assistant; Thermo-Fluid Laboratory', 'School of Applied Technical Sciences', 'ohoud.aljaloudi@gju.edu.jo', 'C439', NULL),
(294, 'Haneen Aboud', 'Research and Teaching Assistant', 'School of Applied Technical Sciences', 'haneen.aboud@gju.edu.jo', 'C122', NULL),
(295, 'Mohammad Al Shimi', 'Research and Teaching Assistant', 'School of Applied Technical Sciences', 'Mohammad.AlShimi@gju.edu.jo', 'C008', NULL),
(296, 'Mohammad Ayyash', 'Research and Teaching Assistant; Hydraulic and Pneumatic Systems Laboratory', 'School of Applied Technical Sciences', 'mohammad.ayyash@gju.edu.jo', 'C303', NULL),
(297, 'Ghaith AlShishani', 'Research and Teaching Assistant', 'School of Applied Technical Sciences', 'Ghaith.Alshishani@gju.edu.jo', 'C103', NULL),
(298, 'Mohammad AlOmari', 'Research and Teaching Assistant', 'School of Applied Technical Sciences', 'Mohammad.hani@gju.edu.jo', 'C126', NULL),
(299, 'Qamar Al-Tarawneh', 'Research and Teaching Assistant; Computer-Aided Drawing Laboratory', 'School of Applied Technical Sciences', 'qamar.al-tarawneh@gju.edu.jo', 'C017', NULL),
(300, 'Sajeda Kamal Alalamie', 'Research and Teaching Assistant', 'School of Applied Technical Sciences', 'sajeda.alalame@gju.edu.jo', 'C436', NULL),
(301, 'Marwa Faouri', 'Research and Teaching Assistant; Control and Vibration Laboratory', 'School of Applied Technical Sciences', 'marwa.alfaouri@gju.edu.jo', 'C128', NULL),
(302, 'Shatha Talaib', 'Research and Teaching Assistant', 'School of Applied Technical Sciences', 'Shatha.Talaib@gju.edu.jo', 'C434', NULL),
(303, 'Shahenaz Alrajfi', 'Research and Teaching Assistant; Control and Vibration Laboratory', 'School of Applied Technical Sciences', 'shahenaz.rajfi@gju.edu.jo', 'C128', NULL),
(304, 'Hamza Ababneh', 'Research and Teaching Assistant', 'School of Applied Technical Sciences', 'Hamza.Ababneh@gju.edu.jo', 'C006', NULL),
(305, 'Saif Alzyoud', 'Research and Teaching Assistant', 'School of Applied Technical Sciences', 'Seif.Alzyoud@gju.edu.jo', 'C006', NULL),
(306, 'Batool Alshawabkeh', 'Research and Teaching Assistant', 'School of Applied Technical Sciences', 'Batool.Alshawabkeh@gju.edu.jo', 'C016', NULL),
(307, 'Hala Qitouqa', 'Exchange Officer for SATS', 'School of Applied Technical Sciences', 'Hala.Qitouqa@gju.edu.jo', 'C110', NULL),
(308, 'Alaa Alhababseh', 'Secretary', 'School of Applied Technical Sciences', 'Alaa.Alhababseh@gju.edu.jo', 'C120', NULL),
(309, 'Dr. Farah Al-Atrash', 'Dean, Associate Professor', 'School of Architecture and Built Environment (SABE)', 'Farah.alatrash@gju.edu.jo', 'Deanship', NULL),
(310, 'Dr. Hazar Taissier Marji', 'Head of Department of Design and Visual Communication', 'School of Architecture and Built Environment (SABE)', 'hazar.marji@gju.edu.jo', 'Deanship', NULL),
(311, 'Arch. Mohammad Khaled', 'Head of Architecture and Interior Design Department', 'School of Architecture and Built Environment (SABE)', 'Mohammed.Zaghmouri@gju.edu.jo', 'Deanship', NULL),
(312, 'Prof. Dr. Natheer Abu Obeid', 'Professor', 'School of Architecture and Built Environment (SABE)', 'Natheer.AbuObeid@gju.edu.jo', 'SII 109', NULL),
(313, 'Prof. Dr. Mohammad Yaghan', 'Professor', 'School of Architecture and Built Environment (SABE)', 'Mohammad.yaghan@gju.edu.jo', 'SI 213', NULL),
(314, 'Prof. Dr. Majd Al-Homoud', 'Professor (On Leave)', 'School of Architecture and Built Environment (SABE)', 'majd.alhomoud@gju.edu.jo', 'SI 209', NULL),
(315, 'Prof. Mohammad Hamed', 'Professor', 'School of Architecture and Built Environment (SABE)', 'Mohammad.Hamed@gju.edu.jo', 'SII 108', NULL),
(316, 'Prof. Dr. Rami Daher', 'Professor (On Leave)', 'School of Architecture and Built Environment (SABE)', 'rami.daher@gju.edu.jo', 'SI 209', NULL),
(317, 'Dr. Maram Tawil', 'Associate Professor (On Leave)', 'School of Architecture and Built Environment (SABE)', 'maram.tawil@gju.edu.jo', 'SII 111', NULL),
(318, 'Dr. Nabil Abu-Dayyeh', 'Associate Professor (On Leave)', 'School of Architecture and Built Environment (SABE)', 'nabil.abudayyeh@gju.edu.jo', 'SI 210', NULL),
(319, 'Dr. Ignacio Arce', 'Associate Professor', 'School of Architecture and Built Environment (SABE)', 'dr.ignacio.arce@gmail.com', 'SI 209', NULL),
(320, 'Dr. Raed Al-Tal', 'Associate Professor', 'School of Architecture and Built Environment (SABE)', 'Raed.Altal@gju.edu.jo', 'SI 210', NULL),
(321, 'Dr. Omaimah Al-Arja', 'Associate Professor (On Leave)', 'School of Architecture and Built Environment (SABE)', 'omaimah.ali@gju.edu.jo', 'SI 208', NULL),
(322, 'Dr. Yazan Alamarat', 'Associate Professor', 'School of Architecture and Built Environment (SABE)', 'Yazan.alamarat@gju.edu.jo', 'Deanship', NULL),
(323, 'Dr. Ikrima Amaireh', 'Assistant Professor', 'School of Architecture and Built Environment (SABE)', 'Ikrima.Amaireh@gju.edu.jo', 'Deanship', NULL),
(324, 'Arch. Leen Fakhoury', 'Dean Assistant for Industrial Links', 'School of Architecture and Built Environment (SABE)', 'lfakhoury962@gmail.com', 'Deanship', NULL),
(325, 'Arch. Amani Malhas', 'Industrial Professor', 'School of Architecture and Built Environment (SABE)', 'Amani.Malhas@gju.edu.jo', 'SII 112', NULL),
(326, 'Arch. Raed Al Naber', 'Industrial Professor', 'School of Architecture and Built Environment (SABE)', 'raedalnaber@gmail.com', 'Daret Othman Bdeir - Jabal Amman', NULL),
(327, 'Arch. Tha’er Qub’a', 'Industrial Professor', 'School of Architecture and Built Environment (SABE)', 'thaer.quba@gju.edu.jo', 'Daret Othman Bdeir - Jabal Amman', NULL),
(328, 'Arch. Rejan Ashour', 'Industrial Professor', 'School of Architecture and Built Environment (SABE)', 'rejan.ashour@gju.edu.jo', 'SI 213', NULL),
(329, 'Rawan Majzoub', 'Industrial Professor', 'School of Architecture and Built Environment (SABE)', 'Rawan.Majzoub@gju.edu.jo', 'SII 111', NULL),
(330, 'Mohammad Alnusairat', 'Industrial Professor', 'School of Architecture and Built Environment (SABE)', 'mohammad.alnusairat@gju.edu.jo', 'SI 207', NULL),
(331, 'Arch. Tala Awadalah', 'Dean Assistant for Graduate Studies', 'School of Architecture and Built Environment (SABE)', 'tala.awadallah@gju.edu.jo', 'Deanship', NULL),
(332, 'Arch. Mohammad Al-Far', 'Instructor', 'School of Architecture and Built Environment (SABE)', 'Mohammad.Alfar@gju.edu.jo', 'Deanship', NULL),
(333, 'Loozan Sabri', 'Instructor', 'School of Architecture and Built Environment (SABE)', 'loozan.hussain@gju.edu.jo', 'SI 207', NULL),
(334, 'Tamam Shaban', 'Assistant Instructor', 'School of Architecture and Built Environment (SABE)', 'Tmam.Shaban@gju.edu.jo', 'Daret Othman Bdeir - Jabal Amman', NULL),
(335, 'Arch. Tala Al-Mukheimer', 'Instructor (On Leave)', 'School of Architecture and Built Environment (SABE)', 'tala.mukheimer@gju.edu.jo', 'SI 306', NULL),
(336, 'Eng. Dana Al-massarweh', 'Research and Teaching Assistant', 'GJU Staff Directory 14459', 'Dana.Massarweh@gju.edu.jo', 'Darat Ibrahim Hashem - Jabal Amman', NULL),
(337, 'Fadi Amer', 'Content Editor and Tech Support', 'GJU Staff Directory 14459', 'Fadi.Amer@gju.edu.jo', NULL, NULL),
(338, 'Eng. Linda Mazahreh', 'Research and Teaching Assistant', 'GJU Staff Directory 14459', 'Linda.Mazahreh@gju.edu.jo', 'Darat Ibrahim Hashem - Jabal Amman', NULL),
(339, 'Eng. Haya Amayreh', 'Research and Teaching Assistant', 'GJU Staff Directory 14459', 'Haya.Amayreh@gju.edu.jo', 'Darat Ibrahim Hashem - Jabal Amman', NULL),
(340, 'Eng. Lama Al-Khushman', 'Research and Teaching Assistant (On Leave)', 'GJU Staff Directory 14459', 'lama.khushman@gju.edu.jo', NULL, NULL),
(341, 'Eng. Sarah Abdo', 'Research and Teaching Assistant', 'GJU Staff Directory 14459', 'Sarah.Abdo@gju.edu.jo', 'Darat Ibrahim Hashem - Jabal Amman', NULL),
(342, 'Eng. Tala Elsheikh', 'Research and Teaching Assistant', 'GJU Staff Directory 14459', 'Tala.Elsheikh@gju.edu.jo', 'Darat Ibrahim Hashem - Jabal Amman', NULL),
(343, 'Rania Makanay', 'Head of Records', 'GJU Staff Directory 14459', 'rania.makanay@gju.edu.jo', 'Daret Othman Bdeir - Jabal Amman', NULL),
(344, 'Rawan Al-Twal', 'Research and Teaching Assistant', 'GJU Staff Directory 14459', 'Rawan.AlTwal@gju.edu.jo', 'Darat Ibrahim Hashem - Jabal Amman', NULL),
(409, 'Dr. Mustafa Shawaqfeh', 'Head of Department, Associate Professor', 'School of Sustainable Systems Engineering (SSSE)', 'Mustafa.Shawaqfeh@gju.edu.jo', 'M 313', NULL),
(410, 'Dr. Omar Albatayneh', 'Associate Professor', 'School of Sustainable Systems Engineering (SSSE)', 'omar.albatayneh@gju.edu.jo', 'C427', NULL),
(411, 'Dr. Qasem Abdelal', 'Associate Professor', 'School of Sustainable Systems Engineering (SSSE)', 'qasem.abdelal@gju.edu.jo', 'C420', NULL),
(412, 'Prof. Osama Saadeh', 'Dean DSR, Professor SSSE', 'School of Sustainable Systems Engineering (SSSE)', 'osama.saadeh@gju.edu.jo', 'C315', NULL),
(413, 'Dr. Mathhar Bdour', 'Associate Professor', 'School of Sustainable Systems Engineering (SSSE)', 'Madher.Bdour@gju.edu.jo', 'C321', NULL),
(414, 'Dr. Murad Al-Omary', 'Associate Professor', 'School of Sustainable Systems Engineering (SSSE)', 'Murad.omary@gju.edu.jo', 'C313', NULL),
(415, 'Prof. Raed Mesleh', 'Chair, Professor', 'School of Sustainable Systems Engineering (SSSE)', 'raed.mesleh@gju.edu.jo', 'M 214', NULL),
(416, 'Dr. Dima A. Husein', 'Head of Department, Associate Professor', 'School of Sustainable Systems Engineering (SSSE)', 'Dima.Malkawi@gju.edu.jo', NULL, NULL),
(417, 'Eng. Gheath Bader', 'Instructor', 'School of Sustainable Systems Engineering (SSSE)', 'Gheath.bader@gju.edu.jo', 'C316', NULL),
(418, 'Prof. Ahmad Harb', 'Professor (On Leave)', 'School of Sustainable Systems Engineering (SSSE)', 'Ahmad.harb@gju.edu.jo', 'C317', NULL),
(419, 'Prof. Nizar Abu Jaber', 'Professor', 'School of Sustainable Systems Engineering (SSSE)', 'Nizar.Abujaber@gju.edu.jo', 'C422', NULL),
(420, 'Prof. Mohammad Al-Addous', 'Professor (On Leave)', 'School of Sustainable Systems Engineering (SSSE)', 'mohammad.addous@gju.edu.jo', 'C325', NULL),
(421, 'Prof. Zakariya Dalala', 'Professor (On Leave)', 'School of Sustainable Systems Engineering (SSSE)', 'Zakariya.Dalalah@gju.edu.jo', 'C328', NULL),
(422, 'Prof. Muna Hindiyeh', 'Professor', 'School of Sustainable Systems Engineering (SSSE)', 'Muna.hindiyeh@gju.edu.jo', 'C419', NULL),
(423, 'Dr. Munjed M. AL-Sharif', 'Associate Professor', 'School of Sustainable Systems Engineering (SSSE)', 'Munjed.Alsharif@gju.edu.jo', 'C432', NULL),
(424, 'Dr. Laith Shalalfeh', 'Associate Professor (On Leave)', 'School of Sustainable Systems Engineering (SSSE)', 'Laith.Shalalfeh@gju.edu.jo', 'C320', NULL),
(425, 'Dr. Raed AlSaleh', 'Assistant Professor', 'School of Sustainable Systems Engineering (SSSE)', 'Raed.Alsaleh@gju.edu.jo', 'C404', NULL),
(426, 'Prof. Osamah Badarneh', 'Professor (On Leave)', 'School of Sustainable Systems Engineering (SSSE)', 'Osamah.badarneh@gju.edu.jo', 'M 219', NULL),
(427, 'Dr. Mohamad Khawaja', 'Associate Professor (On Leave)', 'School of Sustainable Systems Engineering (SSSE)', 'Mohamad.Khawaja@gju.edu.jo', 'C323', NULL),
(428, 'Eng. Anas Alashqar', 'Teaching and Research Assistant', 'School of Sustainable Systems Engineering (SSSE)', 'Anas.Alashqar@gju.edu.jo', 'C409', NULL),
(429, 'Eng. Bilal Flaieh', 'Teaching and Research Assistant', 'School of Sustainable Systems Engineering (SSSE)', 'Bilal.Flaieh@gju.edu.jo', 'C209', NULL),
(430, 'Eng. Anas Alswaeer', 'Research and Teaching Assistant', 'School of Sustainable Systems Engineering (SSSE)', 'Anas.alswaeer@gju.edu.jo', 'C327', NULL),
(431, 'Eng. Sana Alkhateeb', 'Research and Teaching Assistant', 'School of Sustainable Systems Engineering (SSSE)', 'Sana.Alkhateeb@gju.edu.jo', 'C334', NULL),
(432, 'Eng. Ayat Alrjoob', 'Teaching and Research Assistant', 'School of Sustainable Systems Engineering (SSSE)', 'ayat.alrjoob@gju.edu.jo', 'C409', NULL),
(433, 'Eng. Sondos Almashaileh', 'Research and Teaching Assistant', 'School of Sustainable Systems Engineering (SSSE)', 'Sondos.Almashaileh@gju.edu.jo', 'C425', NULL),
(434, 'Eng. Enas Al-Rajfi', 'Research and Teaching Assistant', 'School of Sustainable Systems Engineering (SSSE)', 'enas.alrajfi@gju.edu.jo', 'C401', NULL),
(435, 'Eng. Rahaf Alhashem', 'Research and Teaching Assistant', 'School of Sustainable Systems Engineering (SSSE)', 'rahaf.alhashem@gju.ed.jo', 'C431', NULL),
(436, 'Khaldoun Ayob', 'Technician', 'School of Sustainable Systems Engineering (SSSE)', 'Khaldoun.Ayoub@gju.edu.jo', NULL, NULL),
(437, 'Kifah Aladwan', 'Head of Records', 'School of Sustainable Systems Engineering (SSSE)', 'kifah.aladwan@gju.edu.jo', 'C412', NULL),
(438, 'Alaa Alhababseh', 'Secretary', 'School of Sustainable Systems Engineering (SSSE)', 'SSSE.Bureau@gju.edu.jo', 'C411', NULL),
(441, 'Dr. Mayada A. Daibes', 'Dean', 'School of Nursing (SN)', 'mayada.daibes@gju.edu.jo', 'M506', NULL),
(442, 'Dr. Mohammad Alzaatreh', 'Vice Dean', 'School of Nursing (SN)', 'Mohammad.Alzaatreh@gju.edu.jo', 'M322', NULL),
(443, 'Amal Ismail', 'Instructor - Head of the Department', 'School of Nursing (SN)', 'Amal.Ismail@gju.edu.jo', NULL, NULL),
(444, 'Dr. Hedaya R. Hina', 'Assistant Professor', 'School of Nursing (SN)', 'Hedaya.hina@gju.edu.jo', 'M building', NULL),
(445, 'Dr. Mohammad Alsadi', 'Assistant Professor - Head of the Department', 'School of Nursing (SN)', 'mohammad.alsadi@gju.edu.jo', 'M322', NULL),
(446, 'Raneen Abusaad', 'Research and Teaching Assistant', 'School of Nursing (SN)', 'Raneen.Abusaad@gju.edu.jo', NULL, NULL),
(447, 'Taymya Alakhras', 'Research and Teaching Assistant', 'School of Nursing (SN)', 'Taymya.Alakhras@gju.edu.jo', NULL, NULL),
(448, 'Jumana Yousef', 'Research and Teaching Assistant', 'School of Nursing (SN)', 'Jumana.Yousef@gju.edu.jo', 'M 223', NULL),
(449, 'Mays Alhyari', 'Research and Teaching Assistant', 'School of Nursing (SN)', 'Mayss.alhyari@gju.com', 'M 223', NULL),
(450, 'NemehAllah Ajouri', 'Research and Teaching Assistant', 'School of Nursing (SN)', 'NemehAllah.Ajouri@gju.edu.jo', 'M 223', NULL),
(451, 'Safa’ Amayreh', 'Research and Teaching Assistant', 'School of Nursing (SN)', 'safa.amayreh1@gmail.com', 'M 223', NULL),
(452, 'Dr. Raed AlSaleh', 'Vice Dean', 'Deanship of Student Affairs', 'DSA.Vice.Dean@gju.edu.jo', '001', NULL),
(453, 'Dr. Zeyad Al-Zoubi', 'Dean\'s Assistant', 'Deanship of Student Affairs', 'Zeyad.Zoubi@gju.edu.jo', 'Sport Hall, Room 013', NULL),
(454, 'Eng. Fatimeh AlHadidi', 'Dean\'s Assistant for Quality', 'Deanship of Student Affairs', 'DSA.DAQA@gju.edu.jo', NULL, NULL),
(455, 'Hatem Al- Shawabkeh', 'Dean\'s Assistant', 'Deanship of Student Affairs', 'Hatem.Shawabkeh@gju.edu.jo', NULL, NULL),
(456, 'Doa\'a Habahbeh', 'Bureau and Secretary', 'Deanship of Student Affairs', 'Doaa.alHabahbeh@gju.edu.jo', NULL, NULL),
(457, 'Areej Al-Daebes', 'Head of Artistic and Cultural Activities', 'Deanship of Student Affairs', 'Areej.Daebes@gju.edu.jo', 'Sport Hall, Room 006', NULL),
(458, 'Amani Rosan', 'Media and Public Relations', 'Deanship of Student Affairs', 'amani.rosan@gju.edu.jo', NULL, NULL),
(459, 'Aseel Al-Matar', 'Head of Student Support and Services', 'Deanship of Student Affairs', 'aseel.almatar@gju.edu.jo', 'Sport Hall, Room 005', NULL),
(460, 'Eng. Ahmad Arabyat', 'Head of Student Bodies and Clubs', 'Deanship of Student Affairs', 'Ahmad.Arabyat@gju.edu.jo', 'M 007', NULL),
(461, 'Raed Al-Qaddah', 'Student Affairs', 'Deanship of Student Affairs', 'Raed.Qaddah@gju.edu.jo', 'Sport Hall, Room 013', NULL),
(462, 'Faris Salman', 'Administrative - Student Affairs', 'Deanship of Student Affairs', 'faris.Salman@gju.edu.jo', 'S1209 - Library of Jabal Amman', NULL),
(463, 'Dr. Hatef Abuwaar', 'University Doctor - Student Health Services', 'Deanship of Student Affairs', 'hatef.abuwaar@gju.edu.jo', 'Clinic Building, Room 005', NULL),
(464, 'Shefa Al-Shawabkeh', 'Psychologist', 'Deanship of Student Affairs', 'shefa.shawabkeh@gju.edu.jo', 'Clinic Building, Room 009', NULL),
(465, 'Eman Jomah', 'Pharmacist', 'Deanship of Student Affairs', 'Eman.Jomah@gju.edu.jo', 'Clinic Building, Room 001', NULL),
(466, 'Rawan Mazahreh', 'Staff Nurse', 'Deanship of Student Affairs', 'Rawan.Mazahreh@gju.edu.jo', 'Clinic Building, Room 006', NULL),
(467, 'Tariq Fahed Masoud', 'Building Supervisor', 'Deanship of Student Affairs', 'Tariq.masoud@gju.edu.jo', 'G', NULL),
(468, 'Omar Al-Sawaeir', 'Administrator', 'Deanship of Student Affairs', 'Omar.AlSawaeir@gju.edu.jo', 'Sport Hall', NULL),
(469, 'Fares Darabha', 'Administrative', 'Deanship of Student Affairs', 'Fares.Darabha@gju.edu.jo', '015', NULL),
(470, 'Hamza Mubarak', 'Administrative', 'Deanship of Student Affairs', 'Hamza.Mubarak@gju.edu.jo', '015', NULL),
(472, 'Jacqueline Rogler', 'Head of Department', 'German Language Center', 'jacqueline.rogler@gju.edu.jo', 'L 210', NULL),
(473, 'Margarethe Nofal', 'Deputy Director - Course Schedules and Registration', 'German Language Center', 'Margarethe.Nofal@gju.edu.jo', 'L 209', NULL),
(474, 'Samir Haskic', 'Deputy Director and Coordination German II/III/IV-B2', 'German Language Center', 'Samir.Haskic@gju.edu.jo', 'L 209', NULL),
(475, 'Mahmoud Elazzazi', 'Coordination German I-B1', 'German Language Center', 'mahmoud.elazzazi@gju.edu.jo', 'L 306', NULL),
(476, 'Andreas Majed Chehadi', 'Coordination German III-B1', 'German Language Center', 'andreas.chehadi@gju.edu.jo', 'L 306', NULL),
(477, 'Elisa Faltermeier', 'Coordination German IV-B1', 'German Language Center', 'elisa.faltermeier@gju.edu.jo', 'L 306', NULL),
(478, 'Ruwaidah Hamad', 'Coordination German V-B1 and SOI', 'German Language Center', 'Ruwaidah.Hamad@gju.edu.jo', 'L 302', NULL),
(479, 'Dana Fattah', 'Coordination German VI-REG/INT', 'German Language Center', 'Dana.Fattah@gju.edu.jo', 'L 309', NULL),
(480, 'Friederike Haumann', 'Coordination German V/VI-B2', 'German Language Center', 'friederike.haumann@gju.edu.jo', 'L 303', NULL),
(481, 'Esther Kurani', 'Coordination German III/IV-Nursing', 'German Language Center', 'Esther.Kurani@gju.edu.jo', 'L 306', NULL),
(482, 'Jaroslav Patus', 'Coordination German V/VI/VII Nursing', 'German Language Center', 'jaroslav.patus@gju.edu.jo', 'L 312', NULL),
(483, 'Silvie Zeller', 'DAAD Lektorin', 'German Language Center', 'silvie.zeller@gju.edu.jo', 'L 316', NULL),
(484, 'Yasmin Ali Salam', 'Coordination Technical Languages', 'German Language Center', 'Yasmin.Salam@gju.edu.jo', 'SABE, Jabal Amman SI 501', NULL),
(485, 'Melanie Asdodi', 'Coordination Job Application Training', 'German Language Center', 'Melanie.Asdodi@gju.edu.jo', 'L 302', NULL),
(486, 'Samar Mjalli', 'Coordination Tests and Exams', 'German Language Center', 'samar.mjalli@gju.edu.jo', 'L 303', NULL),
(487, 'Fatima Moussaoui', 'GLCTech, Moodle Exams', 'German Language Center', 'Fatima.moussaoui@gju.edu.jo', 'L 317', NULL),
(488, 'Omar Al-Duais', 'GLCTech, Moodle Exams', 'German Language Center', 'Omar.AlDuais@gju.edu.jo', 'L 318', NULL),
(489, 'Abdel Aziz Al-Asmar', 'German Lecturer', 'German Language Center', 'AbdelAziz.AlAsmar@gju.edu.jo', 'L 213', NULL),
(490, 'Ajnadeen Sharabati', 'German Lecturer', 'German Language Center', 'Ajnadeen.Sharabati@gju.edu.jo', 'SABE, Jabal Amman SI 501', NULL),
(491, 'Ala Daraghmi', 'German Lecturer', 'German Language Center', 'A.Daraghmi1@gju.edu.jo', 'L 301', NULL),
(492, 'Ashraf Saadeya', 'German Lecturer', 'German Language Center', 'ashraf.saadeya@gju.edu.jo', 'L 305', NULL),
(493, 'Abderrahmane Ardem', 'German Lecturer', 'German Language Center', 'abderrahmane.ardem@gju.edu.jo', 'L 305', NULL),
(494, 'Abdo Alsharaby', 'German Lecturer', 'German Language Center', 'abdo.alsharaby@gju.edu.jo', 'L 314', NULL),
(495, 'Abdulmoamen Mohammad', 'German Lecturer', 'German Language Center', 'Abdulmoamen.Mohammad@gju.edu.jo', 'L 318', NULL),
(496, 'Abdulnaser Albaadani', 'Coordinator German Classes at SABE Campus', 'German Language Center', 'Abdelnaser.Albadaani@gju.edu.jo', 'SABE, Jabal Amman SI 501', NULL),
(497, 'Abdelsalam Al Khaiwani', 'German Lecturer', 'German Language Center', 'Abdalslam.Alkhaiwani@gju.edu.jo', 'L 305', NULL),
(498, 'Abdulsalam Al Huda', 'German Lecturer', 'German Language Center', 'Abdalsalam.Alhuda@gju.edu.jo', 'L 318', NULL),
(499, 'Ahmed Sammak', 'German Lecturer', 'German Language Center', 'ahmed.sammak@gju.edu.jo', 'L 213', NULL),
(500, 'Aseel Almomani', 'German Lecturer', 'German Language Center', 'Aseel.Momani@gju.edu.jo', 'SABE, Jabal Amman SI 501', NULL),
(501, 'Asmae El Bainoun', 'German Lecturer', 'German Language Center', 'asmae.elbainoun@gju.edu.jo', 'L 304', NULL),
(502, 'Basil Alabdallah', 'German Lecturer', 'German Language Center', 'basil.alabdallah@gju.edu.jo', 'L 310', NULL),
(503, 'Bushra Tarawneh', 'German Lecturer', 'German Language Center', 'Bushra.Tarawneh@gju.edu.jo', 'L 313', NULL),
(504, 'Chaima Naimi', 'German Lecturer', 'German Language Center', 'Chaima.Naimi@gju.edu.jo', 'L 301', NULL),
(505, 'Da\'ad Nazzal', 'German Lecturer', 'German Language Center', 'daad.nazzal@gju.edu.jo', 'L 309', NULL),
(506, 'Dalia Nasreldin', 'German Lecturer', 'German Language Center', 'Dalia.Nasreldin@gju.edu.jo', 'L 313', NULL),
(507, 'Daniela Schäfer-Peters', 'German Lecturer', 'German Language Center', 'Daniela.Peters@gju.edu.jo', 'L 308', NULL),
(508, 'Dara Bara', 'German Lecturer', 'German Language Center', 'Dara.Bara@gju.edu.jo', 'L 308', NULL),
(509, 'Dima Amr', 'German Lecturer', 'German Language Center', 'Dima.Amr@gju.edu.jo', 'L 315', NULL),
(510, 'Ehtisabliallah Mohyaldeen', 'German Lecturer', 'German Language Center', 'ehtisab.mohyaldeen@gju.edu.jo', 'L 313', NULL),
(511, 'Elaf Alnajafi', 'German Lecturer', 'German Language Center', 'Elaf.Alnajafi@gju.edu.jo', 'L 304', NULL),
(512, 'Eleonora Bello', 'German Lecturer', 'German Language Center', 'Eleonora.Bello@gju.edu.jo', 'L 316', NULL),
(513, 'Ghadeer Abu Libdeh', 'German Lecturer', 'German Language Center', 'Ghadeer.Abulibdeh@gju.edu.jo', 'L 304', NULL),
(514, 'Grace Halasah', 'German Lecturer', 'German Language Center', 'Grace.Halasah@gju.edu.jo', 'L 315', NULL),
(515, 'Hamzah Murshed', 'German Lecturer', 'German Language Center', 'hamzah.murshed@gju.edu.jo', 'L 307', NULL),
(516, 'Hanan AL-Mashharawi', 'German Lecturer', 'German Language Center', 'Hanan.Almashharawi@gju.edu.jo', 'L 308', NULL),
(517, 'Hemam Bani Khaled', 'German Lecturer', 'German Language Center', 'Hemam.BaniKhaled@gju.edu.jo', 'L 213', NULL),
(518, 'Husein Al-Neimat', 'German Lecturer', 'German Language Center', 'Husein.Alneimat@gju.edu.jo', 'L 311', NULL),
(519, 'Imed Eddine Merah', 'German Lecturer', 'German Language Center', 'Imededdine.Merah@gju.edu.jo', 'L 213', NULL),
(520, 'Isabel Blank', 'German Lecturer', 'German Language Center', 'Isabel.Blank@gju.edu.jo', 'L 308', NULL),
(521, 'Khaled Daoud', 'German Lecturer', 'German Language Center', 'Khaled.Daoud@gju.edu.jo', 'SABE, Jabal Amman SI 501', NULL),
(522, 'Khaleel Barbar', 'German Lecturer', 'German Language Center', 'Khaleel.Barbar@gju.edu.jo', 'L 318', NULL),
(523, 'Khalida Radaideh', 'German Lecturer', 'German Language Center', 'khalida.radaideh@gju.edu.jo', 'Building A', NULL),
(524, 'Lana Alzu\'bi', 'German Lecturer', 'German Language Center', 'Lana.Alzubi@gju.edu.jo', 'SABE, Jabal Amman SI 501', NULL),
(525, 'Lemiaa Mohmed', 'German Lecturer', 'German Language Center', 'lemiaa.mohamed@gju.edu.jo', 'L 313', NULL),
(526, 'Liza Balker', 'German Lecturer', 'German Language Center', 'liza.balker@gju.edu.jo', 'L 304', NULL),
(527, 'Lobna Jlidi', 'German Lecturer', 'German Language Center', 'Lobna.Jlidi@gju.edu.jo', 'L 304', NULL),
(528, 'Mahmoud Jarrar', 'German Lecturer - Social Media, Content Admin and Editor', 'German Language Center', 'mahmoud.jarrar@gju.edu.jo', 'L 314', NULL),
(529, 'Martin Kurani', 'German Lecturer', 'German Language Center', 'martin.kurani@gju.edu.jo', NULL, NULL),
(530, 'Maryam Al-Qwidari', 'German Lecturer', 'German Language Center', 'Maryam.Alqwidari@gju.edu.jo', 'L 315', NULL),
(531, 'Mohammad Awlad Essa', 'German Lecturer', 'German Language Center', 'Mohammad.Essa@gju.edu.jo', 'L 305', NULL),
(532, 'Mohammad Charif Rached', 'German Lecturer', 'German Language Center', 'Mohammed.Rached@gju.edu.jo', 'L 312', NULL),
(533, 'Mutaz Hassan', 'German Lecturer', 'German Language Center', 'mutaz.hassan@gju.edu.jo', 'L 307', NULL),
(534, 'Nadja Dayeh', 'German Lecturer', 'German Language Center', 'Nadja.Dayeh@gju.edu.jo', 'L 317', NULL),
(535, 'Nazih Jaferr', 'German Lecturer', 'German Language Center', 'Nazih.jaferr@yahoo.com', 'L 311', NULL);
INSERT INTO `doctors` (`id`, `full_name`, `position`, `department`, `email`, `office_room`, `office_hours`) VALUES
(536, 'Nesrin Mlouki', 'German Lecturer', 'German Language Center', 'nesrine.mlouki@gju.edu.jo', 'L 304', NULL),
(537, 'Nouara Mehenni', 'German Lecturer', 'German Language Center', 'Nouara.Mehenni@gju.edu.jo', 'L 301', NULL),
(538, 'Osman Khalil', 'German Lecturer', 'German Language Center', 'Osman.Khalil@gju.edu.jo', 'L 305', NULL),
(539, 'Othmane Cherrate', 'German Lecturer', 'German Language Center', 'Othmane.Cherrate@gju.edu.jo', 'L 312', NULL),
(540, 'Othmen Chedly', 'German Lecturer', 'German Language Center', 'othmen.chedly@gju.edu.jo', 'L 213', NULL),
(541, 'Ramze Al-Ozieb', 'German Lecturer', 'German Language Center', 'ramze.alozieb@gju.edu.jo', 'L 314', NULL),
(542, 'Ruba Alshawabkeh', 'German Lecturer', 'German Language Center', 'Ruba.Alshawabkeh@gju.edu.jo', 'L 304', NULL),
(543, 'Sahar Alhandoush', 'German Lecturer', 'German Language Center', 'Sahar.Alhandoush@gju.edu.jo', 'L 315', NULL),
(544, 'Salma Ahmed', 'German Lecturer', 'German Language Center', 'salma.ahmed@gju.edu.jo', 'L 315', NULL),
(545, 'Samer Al-Zgool', 'German Lecturer', 'German Language Center', 'samer.alzgool@gju.edu.jo', 'SABE, Jabal Amman SI 501', NULL),
(546, 'Sara Obeidat', 'German Lecturer', 'German Language Center', 'sarah.obeidat@gju.edu.jo', 'L 317', NULL),
(547, 'Soha Ayyoub', 'German Lecturer', 'German Language Center', 'Soha.Ayyoub@gju.edu.jo', 'L 301', NULL),
(548, 'Tala Mesmar', 'German Lecturer', 'German Language Center', 'tala.mesmar@gju.edu.jo', 'L 301', NULL),
(549, 'Tareq Refaie', 'German Lecturer', 'German Language Center', 'mohammadtareq.refaie@gju.edu.jo', 'L 318', NULL),
(550, 'Tariq Izraiqi', 'German Lecturer', 'German Language Center', 'Tariq.Izraqi@gju.edu.jo', 'L 308', NULL),
(551, 'Yassine Tawart', 'German Lecturer', 'German Language Center', 'Yassine.Tawart@gju.edu.jo', 'L 318', NULL),
(552, 'Zain Abu-Taleb', 'German Lecturer', 'German Language Center', 'zain.abutaleb@gju.edu.jo', 'L 316', NULL),
(553, 'Zakaria El Guerda', 'German Lecturer', 'German Language Center', 'zakaria.elguerda@gju.edu.jo', 'L 307', NULL),
(554, 'Eman Asenwar', 'German Language Center Coordinator and Student Advisor', 'German Language Center', 'eman.asenwar@gju.edu.jo', 'L 209', NULL),
(555, 'Hamsah Alnooh', 'Management Assistance', 'German Language Center', 'hamsa.alnooh@gju.edu.jo', 'L 211', NULL),
(556, 'Mutaz Abu Ghazzi', 'Administrative - Technical Room', 'German Language Center', 'mutaz.abughazzi@gju.edu.edu', 'L 213', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `lost_found_items`
--

CREATE TABLE `lost_found_items` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('Lost','Found') NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `date_lost_found` date DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `contact_info` varchar(255) DEFAULT NULL,
  `status` enum('Open','Claimed','Returned') DEFAULT 'Open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `student_id` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `student_id`, `email`, `password`, `created_at`) VALUES
(1, 'abdalrhman alzgheir', '', 'A.Alzgheir@gju.edu.jo', 'Az098831', '2026-10-21 22:43:06'),
(7, 'Fares Yousef', NULL, 'F.Yousef2@gju.edu.jo', 'xafAUS*607', '2026-10-21 22:53:04'),
(8, 'test123', NULL, 'test@gju.edu.jo', 'test1234', '2026-10-23 20:51:40');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `lost_found_items`
--
ALTER TABLE `lost_found_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=557;

--
-- AUTO_INCREMENT for table `lost_found_items`
--
ALTER TABLE `lost_found_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lost_found_items`
--
ALTER TABLE `lost_found_items`
  ADD CONSTRAINT `lost_found_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
