-- CREATE DATABASE IF NOT EXISTS `library_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `library_db`;

-- -------------------------------------------------------------
-- 1. BẢNG THỂ LOẠI (categories)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 2. BẢNG NGƯỜI DÙNG (users)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT AUTO_INCREMENT,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL, -- ADMIN, LIBRARIAN, READER
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 3. BẢNG SÁCH (books)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `books` (
  `id` BIGINT AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `author` VARCHAR(150) NOT NULL,
  `isbn` VARCHAR(50) UNIQUE NOT NULL,
  `publisher` VARCHAR(150) NOT NULL,
  `category_id` BIGINT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `available_quantity` INT NOT NULL DEFAULT 0,
  `description` TEXT,
  `cover_image` LONGTEXT, -- Chứa chuỗi base64 hoặc URL ảnh
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_book_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 4. BẢNG PHIẾU MƯỢN SÁCH (borrow_records)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `borrow_records` (
  `id` BIGINT AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `borrow_date` DATETIME NOT NULL,
  `due_date` DATETIME NOT NULL,
  `return_date` DATETIME DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'BORROWED', -- BORROWED, RETURNED, OVERDUE
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_borrow_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 5. BẢNG CHI TIẾT PHIẾU MƯỢN (borrow_details)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `borrow_details` (
  `id` BIGINT AUTO_INCREMENT,
  `borrow_record_id` BIGINT NOT NULL,
  `book_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_detail_record` FOREIGN KEY (`borrow_record_id`) REFERENCES `borrow_records` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detail_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 6. BẢNG THÔNG BÁO (notifications)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- DỮ LIỆU MẪU (SEED DATA)
-- -------------------------------------------------------------
-- Mật khẩu mặc định của các tài khoản mẫu là "123456" (được mã hóa BCrypt)
-- BCrypt hash: $2a$10$C0Fw8CGyM3WqMA6SDAlxEOxqHPAMk/8z3xFmuaqDkVs.W2IRrHsLa

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`) VALUES
(1, 'Hệ thống Admin', 'admin@library.com', '$2a$10$C0Fw8CGyM3WqMA6SDAlxEOxqHPAMk/8z3xFmuaqDkVs.W2IRrHsLa', 'ADMIN'),
(2, 'Thủ thư Nguyễn Văn A', 'librarian@library.com', '$2a$10$C0Fw8CGyM3WqMA6SDAlxEOxqHPAMk/8z3xFmuaqDkVs.W2IRrHsLa', 'LIBRARIAN'),
(3, 'Độc giả Trần Thị B', 'reader@library.com', '$2a$10$C0Fw8CGyM3WqMA6SDAlxEOxqHPAMk/8z3xFmuaqDkVs.W2IRrHsLa', 'READER'),
(4, 'Độc giả Lê Văn C', 'reader2@library.com', '$2a$10$C0Fw8CGyM3WqMA6SDAlxEOxqHPAMk/8z3xFmuaqDkVs.W2IRrHsLa', 'READER');

INSERT INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'Công nghệ thông tin', 'Sách về Lập trình, Cơ sở dữ liệu, Trí tuệ nhân tạo và Mạng máy tính.'),
(2, 'Văn học & Nghệ thuật', 'Các tác phẩm văn học kinh điển, tiểu thuyết, truyện ngắn và nghệ thuật sáng tạo.'),
(3, 'Kinh tế & Quản trị', 'Sách về kinh tế học, quản trị kinh doanh, marketing và phát triển bản thân.'),
(4, 'Khoa học & Vũ trụ', 'Khám phá vật lý, thiên văn học, sinh học và khoa học tự nhiên.');

INSERT INTO `books` (`id`, `title`, `author`, `isbn`, `publisher`, `category_id`, `quantity`, `available_quantity`, `description`, `cover_image`) VALUES
(1, 'Clean Code', 'Robert C. Martin', '978-0132350884', 'Prentice Hall', 1, 10, 8, 'A Handbook of Agile Software Craftsmanship.', ''),
(2, 'Design Patterns', 'Erich Gamma', '978-0201633610', 'Addison-Wesley', 1, 5, 5, 'Elements of Reusable Object-Oriented Software.', ''),
(3, 'Nhà Giả Kim', 'Paulo Coelho', '978-6045634622', 'NXB Hội Nhà Văn', 2, 15, 14, 'Cuốn sách bán chạy nhất về hành trình tìm kiếm vận mệnh.', ''),
(4, 'Đắc Nhân Tâm', 'Dale Carnegie', '978-6045880784', 'NXB Tổng hợp TP.HCM', 3, 20, 19, 'Nghệ thuật ứng xử và giao tiếp thành công.', ''),
(5, 'Lược sử thời gian', 'Stephen Hawking', '978-6042136150', 'NXB Trẻ', 4, 8, 7, 'Khám phá về nguồn gốc của vũ trụ và thời gian.', '');

-- Một số bản ghi mượn trả mẫu (để có dữ liệu làm dashboard thống kê)
-- Người dùng 3 mượn sách 1 và sách 5
INSERT INTO `borrow_records` (`id`, `user_id`, `borrow_date`, `due_date`, `return_date`, `status`) VALUES
(1, 3, '2026-05-10 09:00:00', '2026-05-24 09:00:00', '2026-05-20 16:30:00', 'RETURNED'), -- Đã trả
(2, 3, '2026-06-01 10:00:00', '2026-06-15 10:00:00', NULL, 'BORROWED'),                 -- Đang mượn (sách 1)
(3, 4, '2026-06-02 14:00:00', '2026-06-16 14:00:00', NULL, 'BORROWED');                 -- Đang mượn (sách 1, sách 5)

INSERT INTO `borrow_details` (`borrow_record_id`, `book_id`) VALUES
(1, 3), -- Phiếu 1 mượn cuốn Nhà Giả Kim (đã trả)
(1, 4), -- Phiếu 1 mượn cuốn Đắc Nhân Tâm (đã trả)
(2, 1), -- Phiếu 2 mượn cuốn Clean Code (đang mượn)
(3, 1), -- Phiếu 3 mượn cuốn Clean Code (đang mượn)
(3, 5); -- Phiếu 3 mượn cuốn Lược sử thời gian (đang mượn)

-- Cập nhật lại available_quantity theo dữ liệu mượn trên
-- Sách 1: quantity=10, đang mượn ở phiếu 2 và phiếu 3 -> available = 8
-- Sách 5: quantity=8, đang mượn ở phiếu 3 -> available = 7
-- Các sách khác available_quantity bằng quantity

-- Tạo thông báo mẫu
INSERT INTO `notifications` (`user_id`, `title`, `content`, `created_at`) VALUES
(3, 'Chào mừng độc giả mới', 'Tài khoản độc giả của bạn đã được khởi tạo thành công trên hệ thống.', '2026-05-09 08:00:00'),
(3, 'Mượn sách thành công', 'Bạn đã mượn thành công cuốn sách Clean Code.', '2026-06-01 10:01:00'),
(4, 'Mượn sách thành công', 'Bạn đã mượn thành công 2 cuốn sách: Clean Code, Lược sử thời gian.', '2026-06-02 14:01:00');
