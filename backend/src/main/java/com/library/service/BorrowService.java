package com.library.service;

import com.library.dto.BorrowRecordDTO;
import com.library.dto.BorrowRequest;
import org.springframework.data.domain.Page;

public interface BorrowService {
    BorrowRecordDTO createBorrowRecord(BorrowRequest request);
    BorrowRecordDTO returnBooks(Long recordId);
    Page<BorrowRecordDTO> getBorrowRecords(String keyword, String status, int page, int size, String sortBy, String sortDir);
    Page<BorrowRecordDTO> getUserBorrowRecords(Long userId, int page, int size, String sortBy, String sortDir);
    void checkAndSetOverdueRecords();
    BorrowRecordDTO requestExtension(Long recordId, String userEmail);
    BorrowRecordDTO approveExtension(Long recordId);
    BorrowRecordDTO rejectExtension(Long recordId);
}
