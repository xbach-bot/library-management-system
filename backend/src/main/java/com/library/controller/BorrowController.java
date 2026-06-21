package com.library.controller;

import com.library.dto.BorrowRecordDTO;
import com.library.dto.BorrowRequest;
import com.library.entity.User;
import com.library.service.BorrowService;
import com.library.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/borrow")
@RequiredArgsConstructor
public class BorrowController {

    private final BorrowService borrowService;
    private final UserService userService;

    // Tạo phiếu mượn sách mới
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<BorrowRecordDTO> createBorrowRecord(@Valid @RequestBody BorrowRequest request) {
        BorrowRecordDTO createdRecord = borrowService.createBorrowRecord(request);
        return new ResponseEntity<>(createdRecord, HttpStatus.CREATED);
    }

    // Xác nhận trả sách
    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<BorrowRecordDTO> returnBooks(@PathVariable Long id) {
        BorrowRecordDTO updatedRecord = borrowService.returnBooks(id);
        return ResponseEntity.ok(updatedRecord);
    }

    // Lấy danh sách phiếu mượn toàn hệ thống (dành cho Admin/Librarian)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Page<BorrowRecordDTO>> getBorrowRecords(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir) {
        
        Page<BorrowRecordDTO> records = borrowService.getBorrowRecords(keyword, status, page, size, sortBy, sortDir);
        return ResponseEntity.ok(records);
    }

    // Lấy lịch sử mượn sách cá nhân của độc giả đang đăng nhập
    @GetMapping("/my-history")
    public ResponseEntity<Page<BorrowRecordDTO>> getMyBorrowHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir) {
        
        User user = userService.getUserByEmail(userDetails.getUsername());
        Page<BorrowRecordDTO> myRecords = borrowService.getUserBorrowRecords(user.getId(), page, size, sortBy, sortDir);
        return ResponseEntity.ok(myRecords);
    }

    // Lấy lịch sử mượn sách của độc giả cụ thể (dành cho Admin/Librarian)
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Page<BorrowRecordDTO>> getUserBorrowHistory(
            @PathVariable Long userId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir) {
        
        Page<BorrowRecordDTO> userRecords = borrowService.getUserBorrowRecords(userId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(userRecords);
    }

    // Độc giả gửi yêu cầu gia hạn mượn sách cá nhân
    @PostMapping("/{id}/request-extension")
    public ResponseEntity<BorrowRecordDTO> requestExtension(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        BorrowRecordDTO updatedRecord = borrowService.requestExtension(id, userDetails.getUsername());
        return ResponseEntity.ok(updatedRecord);
    }

    // Thủ thư/Admin duyệt gia hạn
    @PostMapping("/{id}/approve-extension")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<BorrowRecordDTO> approveExtension(@PathVariable Long id) {
        BorrowRecordDTO updatedRecord = borrowService.approveExtension(id);
        return ResponseEntity.ok(updatedRecord);
    }

    // Thủ thư/Admin từ chối gia hạn
    @PostMapping("/{id}/reject-extension")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<BorrowRecordDTO> rejectExtension(@PathVariable Long id) {
        BorrowRecordDTO updatedRecord = borrowService.rejectExtension(id);
        return ResponseEntity.ok(updatedRecord);
    }
}
