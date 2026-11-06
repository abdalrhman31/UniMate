CREATE TABLE IF NOT EXISTS campus_buildings (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(80) NOT NULL,
  college VARCHAR(150) NOT NULL,
  location VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  floors VARCHAR(50) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS news_articles (
  id VARCHAR(120) NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(80) NOT NULL,
  date DATE NOT NULL,
  read_time VARCHAR(40) NOT NULL,
  summary TEXT NOT NULL,
  PRIMARY KEY (id),
  KEY news_articles_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO campus_buildings (id, name, code, college, location, details, floors) VALUES
(1, 'Main Academic Building', 'A · CENTRAL CAMPUS', 'School of Computing and Informatics', 'Main campus, near the central courtyard', 'Lecture rooms, student services, and faculty offices.', '4 floors'),
(2, 'Engineering & Design Building', 'B · CENTRAL CAMPUS', 'School of Architecture and Built Environment', 'Main campus, east side', 'Design studios, engineering labs, and project spaces.', '3 floors'),
(3, 'Business and Languages Building', 'C · CENTRAL CAMPUS', 'School of Management and Logistics', 'Main campus, beside the library', 'Classrooms, seminar rooms, and faculty offices.', '3 floors');

INSERT IGNORE INTO news_articles (id, title, category, date, read_time, summary) VALUES
('email-career-workshop', 'Career preparation workshop announced for students', 'Student stories', '2026-10-22', '2 min read', 'A sample email announcement highlights an upcoming workshop to help students prepare for their next career step.'),
('email-research-opportunity', 'Student research opportunity now accepting applications', 'Research', '2026-10-21', '3 min read', 'A sample announcement shares a research opportunity and invites interested students to learn more.'),
('research-spotlight', 'Student research takes the spotlight at GJU', 'Research', '2026-10-20', '4 min read', 'A look at how students are turning classroom ideas into projects with the potential to make a difference.'),
('campus-community', 'A campus community built on exchange', 'Campus life', '2026-10-18', '3 min read', 'Students share the experiences, traditions, and ideas that make campus life at GJU unique.'),
('learning-innovation', 'New approaches to learning and innovation', 'Academics', '2026-10-15', '5 min read', 'Inside the ideas and collaborations helping students connect academic learning with real-world challenges.'),
('student-opportunities', 'Making the most of opportunities beyond the classroom', 'Student stories', '2026-10-12', '3 min read', 'GJU students talk about the experiences that helped them grow their skills and discover new interests.'),
('sustainability', 'Small ideas for a more sustainable campus', 'Campus life', '2026-10-08', '2 min read', 'Students and staff consider practical ways to make everyday campus life more sustainable.');
