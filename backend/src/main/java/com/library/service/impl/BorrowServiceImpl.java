package com.library.service.impl;

import com.library.dto.BookDTO;
import com.library.dto.BorrowRecordDTO;
import com.library.dto.BorrowRequest;
import com.library.entity.*;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.BookRepository;
import com.library.repository.BorrowRecordRepository;
import com.library.repository.NotificationRepository;
import com.library.repository.UserRepository;
import com.library.service.BorrowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BorrowServiceImpl implements BorrowService {

    private final BorrowRecordRepository borrowRecordRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public BorrowRecordDTO createBorrowRecord(BorrowRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy độc giả với ID: " + request.getUserId()));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dueDate = now.plusDays(request.getBorrowDays());

        BorrowRecord record = BorrowRecord.builder()
                .user(user)
                .borrowDate(now)
                .dueDate(dueDate)
                .status(BorrowStatus.BORROWED)
                .build();

        List<BorrowDetail> details = new ArrayList<>();
        List<String> borrowedBookTitles = new ArrayList<>();

        for (Long bookId : request.getBookIds()) {
            Book book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + bookId));

            if (book.getAvailableQuantity() <= 0) {
                throw new BadRequestException("Sách '" + book.getTitle() + "' đã hết trong kho, không thể mượn!");
            }

            // Trừ 1 cuốn trong kho
            book.setAvailableQuantity(book.getAvailableQuantity() - 1);
            bookRepository.save(book);

            BorrowDetail detail = BorrowDetail.builder()
                    .borrowRecord(record)
                    .book(book)
                    .build();
            details.add(detail);
            borrowedBookTitles.add(book.getTitle());
        }

        record.setBorrowDetails(details);
        BorrowRecord savedRecord = borrowRecordRepository.save(record);

        // Lưu thông báo
        String bookTitlesStr = String.join(", ", borrowedBookTitles);
        notificationRepository.save(Notification.builder()
                .user(user)
                .title("Mượn sách thành công")
                .content("Bạn đã tạo thành công phiếu mượn #" + savedRecord.getId() + " gồm các cuốn: " + bookTitlesStr + ". Hạn trả là: " + dueDate.toLocalDate())
                .createdAt(now)
                .build());

        return convertToDTO(savedRecord);
    }

    @Override
    @Transactional
    public BorrowRecordDTO returnBooks(Long recordId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn với ID: " + recordId));

        if (record.getStatus() == BorrowStatus.RETURNED) {
            throw new BadRequestException("Phiếu mượn này đã được trả từ trước!");
        }

        LocalDateTime now = LocalDateTime.now();
        record.setReturnDate(now);
        record.setStatus(BorrowStatus.RETURNED);

        List<String> returnedBookTitles = new ArrayList<>();

        // Cộng lại kho cho từng cuốn sách
        for (BorrowDetail detail : record.getBorrowDetails()) {
            Book book = detail.getBook();
            book.setAvailableQuantity(book.getAvailableQuantity() + 1);
            bookRepository.save(book);
            returnedBookTitles.add(book.getTitle());
        }

        BorrowRecord updatedRecord = borrowRecordRepository.save(record);

        // Lưu thông báo
        String bookTitlesStr = String.join(", ", returnedBookTitles);
        notificationRepository.save(Notification.builder()
                .user(record.getUser())
                .title("Trả sách thành công")
                .content("Bạn đã trả thành công các cuốn sách: " + bookTitlesStr + " thuộc phiếu mượn #" + recordId)
                .createdAt(now)
                .build());

        return convertToDTO(updatedRecord);
    }

    @Override
    public Page<BorrowRecordDTO> getBorrowRecords(String keyword, String status, int page, int size, String sortBy, String sortDir) {
        // Trước khi query, kiểm tra và cập nhật các phiếu mượn bị quá hạn
        checkAndSetOverdueRecords();

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? 
                Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        BorrowStatus borrowStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                borrowStatus = BorrowStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Trạng thái mượn '" + status + "' không hợp lệ!");
            }
        }

        Page<BorrowRecord> recordsPage = borrowRecordRepository.searchAndFilterRecords(keyword, borrowStatus, pageable);
        return recordsPage.map(this::convertToDTO);
    }

    @Override
    public Page<BorrowRecordDTO> getUserBorrowRecords(Long userId, int page, int size, String sortBy, String sortDir) {
        checkAndSetOverdueRecords();

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? 
                Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<BorrowRecord> recordsPage = borrowRecordRepository.findByUserId(userId, pageable);
        return recordsPage.map(this::convertToDTO);
    }

    @Override
    @Transactional
    public void checkAndSetOverdueRecords() {
        LocalDateTime now = LocalDateTime.now();
        List<BorrowRecord> overdueRecords = borrowRecordRepository.findOverdueRecords(now);
        for (BorrowRecord record : overdueRecords) {
            record.setStatus(BorrowStatus.OVERDUE);
            borrowRecordRepository.save(record);

            notificationRepository.save(Notification.builder()
                    .user(record.getUser())
                    .title("Cảnh báo quá hạn sách")
                    .content("Phiếu mượn #" + record.getId() + " của bạn đã quá hạn trả (" + record.getDueDate().toLocalDate() + "). Vui lòng trả sách ngay!")
                    .createdAt(now)
                    .build());
        }
    }

    private BorrowRecordDTO convertToDTO(BorrowRecord record) {
        List<BookDTO> bookDTOs = record.getBorrowDetails().stream()
                .map(detail -> {
                    Book book = detail.getBook();
                    return BookDTO.builder()
                            .id(book.getId())
                            .title(book.getTitle())
                            .author(book.getAuthor())
                            .isbn(book.getIsbn())
                            .publisher(book.getPublisher())
                            .categoryId(book.getCategory().getId())
                            .categoryName(book.getCategory().getName())
                            .quantity(book.getQuantity())
                            .availableQuantity(book.getAvailableQuantity())
                            .description(book.getDescription())
                            .coverImage(book.getCoverImage())
                            .build();
                }).collect(Collectors.toList());

        return BorrowRecordDTO.builder()
                .id(record.getId())
                .userId(record.getUser().getId())
                .userEmail(record.getUser().getEmail())
                .userFullName(record.getUser().getFullName())
                .borrowDate(record.getBorrowDate())
                .dueDate(record.getDueDate())
                .returnDate(record.getReturnDate())
                .status(record.getStatus().name())
                .books(bookDTOs)
                .extensionRequested(record.isExtensionRequested())
                .extensionCount(record.getExtensionCount())
                .build();
    }

    @Override
    @Transactional
    public BorrowRecordDTO requestExtension(Long recordId, String userEmail) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn với ID: " + recordId));

        if (userEmail != null && !record.getUser().getEmail().equals(userEmail)) {
            throw new BadRequestException("Bạn không có quyền yêu cầu gia hạn cho phiếu mượn của người khác!");
        }

        if (record.getStatus() != BorrowStatus.BORROWED) {
            throw new BadRequestException("Chỉ có thể gia hạn sách cho phiếu đang mượn!");
        }

        if (record.getExtensionCount() >= 1) {
            throw new BadRequestException("Sách này đã được gia hạn trước đó! Chỉ được phép gia hạn tối đa 1 lần.");
        }

        if (record.isExtensionRequested()) {
            throw new BadRequestException("Yêu cầu gia hạn cho phiếu mượn này đang chờ duyệt!");
        }

        record.setExtensionRequested(true);
        BorrowRecord savedRecord = borrowRecordRepository.save(record);

        notificationRepository.save(Notification.builder()
                .user(record.getUser())
                .title("Yêu cầu gia hạn đang chờ duyệt")
                .content("Yêu cầu gia hạn thêm 7 ngày cho phiếu mượn #" + recordId + " đã được gửi và đang chờ thủ thư phê duyệt.")
                .createdAt(LocalDateTime.now())
                .build());

        return convertToDTO(savedRecord);
    }

    @Override
    @Transactional
    public BorrowRecordDTO approveExtension(Long recordId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn với ID: " + recordId));

        if (!record.isExtensionRequested()) {
            throw new BadRequestException("Không tìm thấy yêu cầu gia hạn cho phiếu mượn này!");
        }

        LocalDateTime now = LocalDateTime.now();
        record.setDueDate(record.getDueDate().plusDays(7));
        record.setExtensionRequested(false);
        record.setExtensionCount(record.getExtensionCount() + 1);

        // Nếu trạng thái đang là quá hạn nhưng được gia hạn thêm mà hạn mới lớn hơn hiện tại, chuyển về đang mượn
        if (record.getStatus() == BorrowStatus.OVERDUE && record.getDueDate().isAfter(now)) {
            record.setStatus(BorrowStatus.BORROWED);
        }

        BorrowRecord savedRecord = borrowRecordRepository.save(record);

        notificationRepository.save(Notification.builder()
                .user(record.getUser())
                .title("Gia hạn mượn sách thành công")
                .content("Yêu cầu gia hạn cho phiếu mượn #" + recordId + " đã được duyệt. Hạn trả mới của bạn là: " + savedRecord.getDueDate().toLocalDate())
                .createdAt(now)
                .build());

        return convertToDTO(savedRecord);
    }

    @Override
    @Transactional
    public BorrowRecordDTO rejectExtension(Long recordId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn với ID: " + recordId));

        if (!record.isExtensionRequested()) {
            throw new BadRequestException("Không tìm thấy yêu cầu gia hạn cho phiếu mượn này!");
        }

        record.setExtensionRequested(false);
        BorrowRecord savedRecord = borrowRecordRepository.save(record);

        notificationRepository.save(Notification.builder()
                .user(record.getUser())
                .title("Yêu cầu gia hạn bị từ chối")
                .content("Yêu cầu gia hạn cho phiếu mượn #" + recordId + " của bạn đã bị từ chối bởi thủ thư.")
                .createdAt(LocalDateTime.now())
                .build());

        return convertToDTO(savedRecord);
    }
}
