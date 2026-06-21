package com.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BorrowRecordDTO {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private LocalDateTime borrowDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate;
    private String status;
    private List<BookDTO> books;
    private boolean extensionRequested;
    private int extensionCount;
}
